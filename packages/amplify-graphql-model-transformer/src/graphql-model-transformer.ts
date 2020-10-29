import {
  ObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  InputObjectTypeDefinitionNode,
  DirectiveNode,
} from 'graphql';
import { camelCase } from 'change-case';
import {
  AppSyncDataSourceType,
  DataSourceProvider,
  QueryFieldType,
  TransformerContextProvider,
  TransformerModelProvider,
  TransformerResolverProvider,
  MutationFieldType,
  SubscriptionFieldType,
  DataSourceInstance,
} from '@aws-amplify/graphql-transformer-interfaces';
import { AttributeType, ITable, Table, TableEncryption } from '@aws-cdk/aws-dynamodb';
import { TransformerModelBase, MappingTemplate } from '@aws-amplify/graphql-transformer-core';
import { TranformerTransformSchemaStepContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import {
  getBaseType,
  isScalar,
  makeField,
  makeInputValueDefinition,
  makeNamedType,
  makeNonNullType,
  toCamelCase,
  toPascalCase,
} from 'graphql-transformer-common';
import { RemovalPolicy } from '@aws-cdk/core';
import {
  DirectiveWrapper,
  FieldWrapper,
  InputObjectDefinationWrapper,
  ObjectDefinationWrapper,
} from './wrappers/object-defination-wrapper';
import { addModelConditionInputs, createEnumModelFilters, makeCreateInputField, makeDeleteInputField, makeMutationConditionInput, makeUpdateInputField } from './input-types';
import {
  generateCreateInitSlotTemplate,
  generateCreateRequestTemplate,
  generateDefaultResponseMappingTemplate,
  generateDeleteRequestTemplate,
  generateResolverKey,
  generateUpdateInitSlotTemplate,
  generateUpdateRequestTemplate,
} from './resolvers';
import { generateGetRequestTemplate } from './resolvers/query';

export type Nullable<T> = T | null;
export type OptionalAndNullable<T> = Partial<T>;

export enum SubscriptionLevel {
  off = 'off',
  public = 'public',
  on = 'on',
}
export type ModelDirectiveConfiguration = {
  queries?: OptionalAndNullable<{
    get: OptionalAndNullable<string>;
    list: OptionalAndNullable<string>;
  }>;
  mutations: {
    create: OptionalAndNullable<string>;
    update: OptionalAndNullable<string>;
    delete: OptionalAndNullable<string>;
  } | null;
  subscriptions: {
    onCreate: OptionalAndNullable<string>;
    onUpdate: OptionalAndNullable<string>;
    onDelete: OptionalAndNullable<string>;
    level: Partial<SubscriptionLevel>;
  } | null;
  timestamps: OptionalAndNullable<{
    createdAt: OptionalAndNullable<string>;
    updatedAt: OptionalAndNullable<string>;
  }>;
};

export const directiveDefinition = /* GraphQl */ `
  directive @model(
    queries: ModelQueryMap
    mutations: ModelMutationMap
    subscriptions: ModelSubscriptionMap
    timestamps: TimestampConfiguration
  ) on OBJECT
  input ModelMutationMap {
    create: String
    update: String
    delete: String
  }
  input ModelQueryMap {
    get: String
    list: String
  }
  input ModelSubscriptionMap {
    onCreate: [String]
    onUpdate: [String]
    onDelete: [String]
    level: ModelSubscriptionLevel
  }
  enum ModelSubscriptionLevel {
    off
    public
    on
  }
  input TimestampConfiguration {
    createdAt: String
    updatedAt: String
  }
`;

export class ModelTransformer extends TransformerModelBase implements TransformerModelProvider {
  private datasourceMap: Record<string, DataSourceProvider> = {};
  private ddbTableMap: Record<string, ITable> = {};
  private resolverMap: Record<string, TransformerResolverProvider> = {};
  private typesWithModelDirective: Set<string> = new Set();
  /**
   * A Map to hold the directive configuration
   */
  private modelDirectiveConfig: Map<string, ModelDirectiveConfiguration> = new Map();
  constructor() {
    super('amplify-model-transformer', directiveDefinition);
  }

  generateGetResolver = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
  ): TransformerResolverProvider => {
    const dataSource = this.datasourceMap[type.name.value];
    const resolverKey = `Get${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateQueryResolver(
        typeName,
        fieldName,
        dataSource,
        MappingTemplate.s3MappingTemplateFromString(generateGetRequestTemplate(), `${typeName}.${fieldName}.req.vtl`),
        MappingTemplate.s3MappingTemplateFromString(generateDefaultResponseMappingTemplate(), `${typeName}.${fieldName}.res.vtl`),
      );
    }
    return this.resolverMap[resolverKey];
  };

  generateListResolver = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
  ): TransformerResolverProvider => {
    // Todo: Update VTL code to generate for getResolver
    const dataSource = this.datasourceMap[typeName];
    const resolverKey = `List${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateQueryResolver(
        typeName,
        fieldName,
        dataSource,
        MappingTemplate.s3MappingTemplateFromString('{}', `${typeName}.${fieldName}.req.vtl`),
        MappingTemplate.s3MappingTemplateFromString('{}', `${typeName}.${fieldName}.res.vtl`),
      );
    }
    return this.resolverMap[resolverKey];
  };

  generateUpdateResolver = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
  ): TransformerResolverProvider => {
    const dataSource = this.datasourceMap[type.name.value];
    const resolverKey = `Update${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      const resolver = ctx.resolvers.generateMutationResolver(
        typeName,
        fieldName,
        dataSource,
        MappingTemplate.s3MappingTemplateFromString(generateUpdateRequestTemplate(typeName), `${typeName}.${fieldName}.req.vtl`),
        MappingTemplate.s3MappingTemplateFromString(generateDefaultResponseMappingTemplate(), `${typeName}.${fieldName}.res.vtl`),
      );
      // Todo: get the slot index from the resolver to keep the name unique and show the order of functions
      resolver.addToSlot(
        'init',
        MappingTemplate.s3MappingTemplateFromString(
          generateUpdateInitSlotTemplate(type.name.value, this.modelDirectiveConfig.get(type.name.value)!),
          `${typeName}.${fieldName}.init.1.req.vtl`,
        ),
      );
      this.resolverMap[resolverKey] = resolver;
    }
    return this.resolverMap[resolverKey];
  };

  object = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode): void => {
    // todo: get model configuration with default values and store it in the map
    const typeName = definition.name.value;
    const directiveWrapped: DirectiveWrapper = new DirectiveWrapper(directive);
    const options = <ModelDirectiveConfiguration>directiveWrapped.getArguments({
      queries: {
        get: toCamelCase(['get', typeName]),
        list: toCamelCase(['list', `${typeName}s`]), // Existing implementation suffixes `s` at the end
      },
      mutations: {
        create: toCamelCase(['create', typeName]),
        update: toCamelCase(['update', typeName]),
        delete: toCamelCase(['delete', typeName]),
      },
      subscriptions: {
        level: SubscriptionLevel.public,
        onCreate: toCamelCase(['onCreate', typeName]),
        onDelete: toCamelCase(['onDelete', typeName]),
        onUpdate: toCamelCase(['onUpdate', typeName]),
      },
      timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
    });
    this.modelDirectiveConfig.set(typeName, options);
    this.typesWithModelDirective.add(typeName);
  };

  validate = () => {};
  prepare = () => {};

  transformSchema = (ctx: TranformerTransformSchemaStepContextProvider): void => {
    // Create Non Model input types

    // add the model input conditions
    addModelConditionInputs(ctx);

    for (let type of this.typesWithModelDirective) {
      const def = ctx.output.getObject(type)!;
      // add Non Model type inputs
      this.createNonModelInputs(ctx, def);
      const queryFields = this.getQueryFieldNames(ctx, def!);
      const mutationFields = this.getMutationFieldNames(ctx, def!);
      for (let queryField of queryFields.values()) {
        const args = this.getInputs(ctx, def!, {
          fieldName: queryField.fieldName,
          typeName: queryField.typeName,
          type: queryField.type,
        });
        const field = makeField(queryField.fieldName, args, makeNamedType(def!.name.value));
        ctx.output.addQueryFields([field]);
      }
      for (let mutationField of mutationFields) {
        const args = this.getInputs(ctx, def!, {
          fieldName: mutationField.fieldName,
          typeName: mutationField.typeName,
          type: mutationField.type,
        });

        // Todo use FieldWrapper and add support for arguments
        // const field = FieldWrapper.create(mutationField.fieldName, def.name.value).serialize();
        const field = makeField(mutationField.fieldName, args, makeNamedType(def!.name.value));
        ctx.output.addMutationFields([field]);
      }

      // Update the field with auto generatable Fields
      this.addAutoGeneratableFields(ctx, type);
    }
  };

  generateResolvers = (context: TransformerContextProvider): void => {
    for (let type of this.typesWithModelDirective) {
      const def = context.output.getObject(type);
      const queryFields = this.getQueryFieldNames(context, def!);
      const mutationFields = this.getMutationFieldNames(context, def!);

      // add the table
      const tableLogicalName = `${def!.name.value}Table`;
      const tableName = context.resourceHelper.generateResourceName(def!.name.value);
      const stack = context.stackManager.getStackFor(tableLogicalName, def!.name.value);
      // Expose a way in context to allow proper resource naming
      const table = new Table(stack, tableLogicalName, {
        tableName,
        partitionKey: {
          name: 'id',
          type: AttributeType.STRING,
        },
        encryption: TableEncryption.DEFAULT,
        removalPolicy: RemovalPolicy.DESTROY,
      });
      // Expose a better API to select what stack this belongs to
      const dataSource = context.api.addDynamoDbDataSource(
        `${def!.name.value}DS`,
        table,
        {
          name: `${def!.name.value}DS`,
        },
        stack,
      );
      // add the data source
      context.dataSources.add(def!, dataSource);
      this.datasourceMap[def!.name.value] = dataSource;
      // add the resolvers
      for (let queryField of queryFields.values()) {
        const resolver = this.generateGetResolver(context, def!, queryField.typeName, queryField.fieldName);
        resolver.mapToStack(stack);
        context.resolvers.addResolver(queryField.typeName, queryField.fieldName, resolver);
      }

      for (let mutationField of mutationFields.values()) {
        let resolver;
        switch (mutationField.type) {
          case MutationFieldType.CREATE:
            resolver = this.generateCreateResolver(context, def!, mutationField.typeName, mutationField.fieldName);
            resolver.mapToStack(stack);
            context.resolvers.addResolver(mutationField.typeName, mutationField.fieldName, resolver);
            break;
          case MutationFieldType.DELETE:
            resolver = this.generateDeleteResolver(context, def!, mutationField.typeName, mutationField.fieldName);
            resolver.mapToStack(stack);
            context.resolvers.addResolver(mutationField.typeName, mutationField.fieldName, resolver);
            break;
          case MutationFieldType.UPDATE:
            resolver = this.generateUpdateResolver(context, def!, mutationField.typeName, mutationField.fieldName);
            resolver.mapToStack(stack);
            context.resolvers.addResolver(mutationField.typeName, mutationField.fieldName, resolver);
            break;
        }
      }
    }
  };
  generateDeleteResolver = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
  ): TransformerResolverProvider => {
    const dataSource = this.datasourceMap[type.name.value];
    const resolverKey = `update${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateQueryResolver(
        typeName,
        fieldName,
        dataSource,
        MappingTemplate.s3MappingTemplateFromString(generateDeleteRequestTemplate(), `${typeName}.${fieldName}.req.vtl`),
        MappingTemplate.s3MappingTemplateFromString(generateDefaultResponseMappingTemplate(), `${typeName}.${fieldName}.res.vtl`),
      );
    }
    return this.resolverMap[resolverKey];
  };

  generateOnCreateResolver = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
  ): TransformerResolverProvider => {
    const dataSource = this.datasourceMap[typeName];
    const resolverKey = `OnCreate${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateQueryResolver(
        typeName,
        fieldName,
        dataSource,
        MappingTemplate.s3MappingTemplateFromString('{}', `${typeName}.${fieldName}.req.vtl`),
        MappingTemplate.s3MappingTemplateFromString('{}', `${typeName}.${fieldName}.res.vtl`),
      );
    }
    return this.resolverMap[resolverKey];
  };
  generateOnUpdateResolver = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
  ): TransformerResolverProvider => {
    const dataSource = this.datasourceMap[typeName];
    const resolverKey = `OnUpdate${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateQueryResolver(
        typeName,
        fieldName,
        dataSource,
        MappingTemplate.s3MappingTemplateFromString('{}', `${typeName}.${fieldName}.req.vtl`),
        MappingTemplate.s3MappingTemplateFromString('{}', `${typeName}.${fieldName}.res.vtl`),
      );
    }
    return this.resolverMap[resolverKey];
  };
  generateOnDeleteResolver = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
  ): TransformerResolverProvider => {
    const dataSource = this.datasourceMap[typeName];
    const resolverKey = `OnDelete${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateQueryResolver(
        typeName,
        fieldName,
        dataSource,
        MappingTemplate.s3MappingTemplateFromString('{}', `${typeName}.${fieldName}.req.vtl`),
        MappingTemplate.s3MappingTemplateFromString('{}', `${typeName}.${fieldName}.res.vtl`),
      );
    }
    return this.resolverMap[resolverKey];
  };
  generateSyncResolver = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
  ): TransformerResolverProvider => {
    const dataSource = this.datasourceMap[typeName];
    const resolverKey = `Sync${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateQueryResolver(
        typeName,
        fieldName,
        dataSource,
        MappingTemplate.s3MappingTemplateFromString('{}', `${typeName}.${fieldName}.req.vtl`),
        MappingTemplate.s3MappingTemplateFromString('{}', `${typeName}.${fieldName}.res.vtl`),
      );
    }
    return this.resolverMap[resolverKey];
  };

  getQueryFieldNames = (
    ctx: TranformerTransformSchemaStepContextProvider,
    type: ObjectTypeDefinitionNode,
  ): Set<{ fieldName: string; typeName: string; type: QueryFieldType }> => {
    // Todo: take name from the directive
    const typeName = type.name.value;
    const fields: Set<{ fieldName: string; typeName: string; type: QueryFieldType }> = new Set();

    fields.add({
      typeName: 'Query',
      fieldName: camelCase(`get ${typeName}`),
      type: QueryFieldType.GET,
    });

    // fields.add({
    //   typeName: 'Query',
    //   fieldName: camelCase(`list ${typeName}`),
    //   type: QueryFieldType.LIST,
    // });

    // fields.add({
    //   typeName: 'Query',
    //   fieldName: camelCase(`sync ${typeName}`),
    //   type: QueryFieldType.SYNC,
    // });
    return fields;
  };

  getMutationFieldNames = (
    ctx: TranformerTransformSchemaStepContextProvider,
    type: ObjectTypeDefinitionNode,
  ): Set<{ fieldName: string; typeName: string; type: MutationFieldType }> => {
    // Todo: get fields names from the directives
    const typeName = type.name.value;
    const modelDirectiveConfig = this.modelDirectiveConfig.get(typeName);
    const getMuationType = (type: string): MutationFieldType => {
      switch (type) {
        case 'create':
          return MutationFieldType.CREATE;
        case 'update':
          return MutationFieldType.UPDATE;
        case 'delete':
          return MutationFieldType.DELETE;
        default:
          throw new Error('Unknow mutation type');
      }
    };

    const fieldNames: Set<{ fieldName: string; typeName: string; type: MutationFieldType }> = new Set();
    for (let [mutationType, mutationName] of Object.entries(modelDirectiveConfig?.mutations || {})) {
      if (mutationName) {
        fieldNames.add({
          typeName: 'Mutation',
          fieldName: mutationName,
          type: getMuationType(mutationType),
        });
      }
    }

    return fieldNames;
  };

  getSubscriptionFieldNames = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
  ): Set<{
    fieldName: string;
    typeName: string;
    type: SubscriptionFieldType;
  }> => {
    const fields: Set<{
      fieldName: string;
      typeName: string;
      type: SubscriptionFieldType;
    }> = new Set();
    return fields;
  };

  getDataSourceResource = (ctx: TransformerContextProvider, type: ObjectTypeDefinitionNode): DataSourceInstance => {
    // Todo: add sanity check to ebsure the type has an table
    return this.ddbTableMap[type.name.value];
  };

  getDataSourceType = (): AppSyncDataSourceType => {
    return AppSyncDataSourceType.AMAZON_DYNAMODB;
  };

  generateCreateResolver = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
  ): TransformerResolverProvider => {
    const dataSource = this.datasourceMap[type.name.value];
    const resolverKey = `Create${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      const resolver = ctx.resolvers.generateMutationResolver(
        typeName,
        fieldName,
        dataSource,
        MappingTemplate.s3MappingTemplateFromString(generateCreateRequestTemplate(type.name.value), `${typeName}.${fieldName}.req.vtl`),
        MappingTemplate.s3MappingTemplateFromString(generateDefaultResponseMappingTemplate(), `${typeName}.${fieldName}.res.vtl`),
      );
      this.resolverMap[resolverKey] = resolver;
      // Todo: get the slot index from the resolver to keep the name unique and show the order of functions
      resolver.addToSlot(
        'init',
        MappingTemplate.s3MappingTemplateFromString(
          generateCreateInitSlotTemplate(type.name.value, this.modelDirectiveConfig.get(type.name.value)!),
          `${typeName}.${fieldName}.init.1.req.vtl`,
        ),
      );
    }
    return this.resolverMap[resolverKey];
  };

  getInputs = (
    ctx: TranformerTransformSchemaStepContextProvider,
    type: ObjectTypeDefinitionNode,
    operation: {
      fieldName: string;
      typeName: string;
      type: QueryFieldType | MutationFieldType | SubscriptionFieldType;
    },
  ): InputValueDefinitionNode[] => {
    // Todo: return fields bassed on operation
    const knownModels = this.typesWithModelDirective;
    let conditionInput: InputObjectTypeDefinitionNode;
    if ([MutationFieldType.CREATE, MutationFieldType.DELETE, MutationFieldType.UPDATE].includes(<MutationFieldType>operation.type)) {
      const condtionTypeName = toPascalCase(['Model', type.name.value, 'ConditionInput']);

      const filterInputs = createEnumModelFilters(ctx, type);
      conditionInput = makeMutationConditionInput(ctx, condtionTypeName, type);
      filterInputs.push(conditionInput);
      for (let input of filterInputs) {
        const conditionInputName = input.name.value;
        if (!ctx.output.getType(conditionInputName)) {
          ctx.output.addInput(input);
        }
      }
    }
    switch (operation.type) {
      case QueryFieldType.GET:
        return [makeInputValueDefinition('id', makeNonNullType(makeNamedType('ID')))];

      case QueryFieldType.LIST:
        return [];
      case QueryFieldType.SYNC:
        return [];

      case MutationFieldType.CREATE:
        const createInputField = makeCreateInputField(type, this.modelDirectiveConfig.get(type.name.value)!, knownModels);
        const createInputTypeName = createInputField.name.value;
        if (!ctx.output.getType(createInputField.name.value)) {
          ctx.output.addInput(createInputField);
        }
        return [
          makeInputValueDefinition('input', makeNonNullType(makeNamedType(createInputTypeName))),
          makeInputValueDefinition('condition', makeNamedType(conditionInput!.name.value)),
        ];

      case MutationFieldType.DELETE:
        const deleteInputField = makeDeleteInputField(type);
        const deleteInputTypeName = deleteInputField.name.value;
        if (!ctx.output.getType(deleteInputField.name.value)) {
          ctx.output.addInput(deleteInputField);
        }
        return [
          makeInputValueDefinition('input', makeNonNullType(makeNamedType(deleteInputTypeName))),
          makeInputValueDefinition('condition', makeNamedType(conditionInput!.name.value)),
        ];

      case MutationFieldType.UPDATE:
        const updateInputField = makeUpdateInputField(type, this.modelDirectiveConfig.get(type.name.value)!, knownModels);
        const updateInputTypeName = updateInputField.name.value;
        if (!ctx.output.getType(updateInputField.name.value)) {
          ctx.output.addInput(updateInputField);
        }
        return [
          makeInputValueDefinition('input', makeNonNullType(makeNamedType(updateInputTypeName))),
          makeInputValueDefinition('condition', makeNamedType(conditionInput!.name.value)),
        ];
    }
    return [];
  };

  private createNonModelInputs = (ctx: TranformerTransformSchemaStepContextProvider, obj: ObjectTypeDefinitionNode): void => {
    for (let field of obj.fields || []) {
      if (!isScalar(field.type)) {
        const def = ctx.output.getType(getBaseType(field.type));
        if (def && def.kind == 'ObjectTypeDefinition' && !this.isModelField(def.name.value)) {
          const name = this.getNonModelInputObjectName(def.name.value);
          if (!ctx.output.getType(name)) {
            const inputObj = InputObjectDefinationWrapper.fromObject(name, def);
            ctx.output.addInput(inputObj.serialize());
          }
        }
      }
    }
  };
  private isModelField = (name: string): boolean => {
    return this.typesWithModelDirective.has(name) ? true : false;
  };


  private getNonModelInputObjectName = (name: string): string => {
    return `${name}Input`;
  };

  /**
   * Model directive automatically adds id, created and updated time stamps to the filed, if they are configured
   * @param name Name of the type
   */
  private addAutoGeneratableFields = (ctx: TranformerTransformSchemaStepContextProvider, name: string): void => {
    const modelDirectiveConfig = this.modelDirectiveConfig.get(name);
    const typeObj = ctx.output.getObject(name);
    if (!typeObj) {
      throw new Error(`Type ${name} is missing in outputs`);
    }
    const typeWrapper = new ObjectDefinationWrapper(typeObj);
    if (!typeWrapper.hasField('id')) {
      const idField = FieldWrapper.create('id', 'ID');
      typeWrapper.addField(idField);
    }
    if (modelDirectiveConfig?.timestamps) {
      for (let [, fieldName] of Object.entries(modelDirectiveConfig?.timestamps))
        if (fieldName) {
          if (typeWrapper.hasField(fieldName)) {
            const createdAtField = typeWrapper.getField(fieldName);
            if (!['String', 'AWSDateTime'].includes(createdAtField.getTypeName())) {
              console.warn(`type ${name}.${fieldName} is not of String or AWSDateTime. Autopoupulation is not supported`);
            }
          } else {
            const createdAtField = FieldWrapper.create(fieldName, 'AWSDateTime');
            typeWrapper.addField(createdAtField);
          }
        }
    }
    ctx.output.updateObject(typeWrapper.serialize());
  };
}
