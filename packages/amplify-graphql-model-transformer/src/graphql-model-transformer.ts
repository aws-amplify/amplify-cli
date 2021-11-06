import {
  DirectiveWrapper,
  InvalidDirectiveError,
  MappingTemplate,
  SyncConfig,
  SyncUtils,
  TransformerModelBase,
} from '@aws-amplify/graphql-transformer-core';
import {
  AppSyncDataSourceType,
  DataSourceInstance,
  DataSourceProvider,
  MutationFieldType,
  QueryFieldType,
  SubscriptionFieldType,
  TransformerContextProvider,
  TransformerModelProvider,
  TransformerPrepareStepContextProvider,
  TransformerResolverProvider,
  TransformerSchemaVisitStepContextProvider,
  TransformerTransformSchemaStepContextProvider,
  TransformerValidationStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { AttributeType, CfnTable, ITable, StreamViewType, Table, TableEncryption } from '@aws-cdk/aws-dynamodb';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { CfnDataSource } from '@aws-cdk/aws-appsync';
import {
  DirectiveNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  ObjectTypeDefinitionNode,
} from 'graphql';
import {
  getBaseType,
  isScalar,
  makeArgument,
  makeDirective,
  makeField,
  makeInputValueDefinition,
  makeNamedType,
  makeNonNullType,
  makeValueNode,
  ModelResourceIDs,
  plurality,
  ResolverResourceIDs,
  ResourceConstants,
  SyncResourceIDs,
  toCamelCase,
  toPascalCase,
} from 'graphql-transformer-common';
import {
  addModelConditionInputs,
  createEnumModelFilters,
  makeCreateInputField,
  makeDeleteInputField,
  makeListQueryFilterInput,
  makeListQueryModel,
  makeModelSortDirectionEnumObject,
  makeMutationConditionInput,
  makeUpdateInputField,
} from './graphql-types';
import {
  generateAuthExpressionForSandboxMode,
  generateCreateInitSlotTemplate,
  generateCreateRequestTemplate,
  generateDefaultResponseMappingTemplate,
  generateDeleteRequestTemplate,
  generateResolverKey,
  generateSubscriptionRequestTemplate,
  generateSubscriptionResponseTemplate,
  generateUpdateInitSlotTemplate,
  generateUpdateRequestTemplate,
} from './resolvers';
import {
  generateGetRequestTemplate,
  generateGetResponseTemplate,
  generateListRequestTemplate,
  generateSyncRequestTemplate,
} from './resolvers/query';
import { FieldWrapper, InputObjectDefinitionWrapper, ObjectDefinitionWrapper } from './wrappers/object-definition-wrapper';
import { CfnRole } from '@aws-cdk/aws-iam';
import md5 from 'md5';

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
    sync: OptionalAndNullable<string>;
  }>;
  mutations: OptionalAndNullable<{
    create: OptionalAndNullable<string>;
    update: OptionalAndNullable<string>;
    delete: OptionalAndNullable<string>;
  }>;
  subscriptions: OptionalAndNullable<{
    onCreate: OptionalAndNullable<string>[];
    onUpdate: OptionalAndNullable<string>[];
    onDelete: OptionalAndNullable<string>[];
    level: SubscriptionLevel;
  }>;
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

type ModelTransformerOptions = {
  EnableDeletionProtection?: boolean;
  SyncConfig?: SyncConfig;
};

export class ModelTransformer extends TransformerModelBase implements TransformerModelProvider {
  private options: ModelTransformerOptions;
  private datasourceMap: Record<string, DataSourceProvider> = {};
  private ddbTableMap: Record<string, ITable> = {};
  private resolverMap: Record<string, TransformerResolverProvider> = {};
  private typesWithModelDirective: Set<string> = new Set();
  /**
   * A Map to hold the directive configuration
   */
  private modelDirectiveConfig: Map<string, ModelDirectiveConfiguration> = new Map();
  constructor(options: ModelTransformerOptions = {}) {
    super('amplify-model-transformer', directiveDefinition);
    this.options = this.getOptions(options);
  }

  object = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerSchemaVisitStepContextProvider): void => {
    const isTypeNameReserved =
      definition.name.value === ctx.output.getQueryTypeName() ||
      definition.name.value === ctx.output.getMutationTypeName() ||
      definition.name.value === ctx.output.getSubscriptionTypeName();

    if (isTypeNameReserved) {
      throw new InvalidDirectiveError(
        `'${definition.name.value}' is a reserved type name and currently in use within the default schema element.`,
      );
    }
    // todo: get model configuration with default values and store it in the map
    const typeName = definition.name.value;

    if (ctx.isProjectUsingDataStore()) {
      SyncUtils.validateResolverConfigForType(ctx, typeName);
    }

    const directiveWrapped: DirectiveWrapper = new DirectiveWrapper(directive);
    const options = directiveWrapped.getArguments({
      queries: {
        get: toCamelCase(['get', typeName]),
        list: toCamelCase(['list', plurality(typeName, true)]),
        ...(ctx.isProjectUsingDataStore() ? { sync: toCamelCase(['sync', plurality(typeName, true)]) } : undefined),
      },
      mutations: {
        create: toCamelCase(['create', typeName]),
        update: toCamelCase(['update', typeName]),
        delete: toCamelCase(['delete', typeName]),
      },
      subscriptions: {
        level: SubscriptionLevel.on,
        onCreate: [this.ensureValidSubscriptionName(toCamelCase(['onCreate', typeName]))],
        onDelete: [this.ensureValidSubscriptionName(toCamelCase(['onDelete', typeName]))],
        onUpdate: [this.ensureValidSubscriptionName(toCamelCase(['onUpdate', typeName]))],
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
  prepare = (context: TransformerPrepareStepContextProvider) => {
    for (const modelTypeName of this.typesWithModelDirective) {
      const type = context.output.getObject(modelTypeName);
      context.providerRegistry.registerDataSourceProvider(type!, this);
    }
  };

  transformSchema = (ctx: TransformerTransformSchemaStepContextProvider): void => {
    // add the model input conditions
    addModelConditionInputs(ctx);

    this.ensureModelSortDirectionEnum(ctx);
    for (const type of this.typesWithModelDirective) {
      const def = ctx.output.getObject(type)!;

      // add Non Model type inputs
      this.createNonModelInputs(ctx, def);

      const queryFields = this.createQueryFields(ctx, def);
      ctx.output.addQueryFields(queryFields);

      const mutationFields = this.createMutationFields(ctx, def);
      ctx.output.addMutationFields(mutationFields);

      const subscriptionsFields = this.createSubscriptionFields(ctx, def!);
      ctx.output.addSubscriptionFields(subscriptionsFields);

      // Update the field with auto generatable Fields
      this.addAutoGeneratableFields(ctx, type);

      if (ctx.isProjectUsingDataStore()) {
        this.addModelSyncFields(ctx, type);
      }
    }
  };

  generateResolvers = (context: TransformerContextProvider): void => {
    for (let type of this.typesWithModelDirective) {
      const def = context.output.getObject(type)!;
      // This name is used by the mock functionality. Changing this can break mock.
      const tableLogicalName = `${def!.name.value}Table`;
      const stack = context.stackManager.getStackFor(tableLogicalName, def!.name.value);

      this.createModelTable(stack, def!, context);

      const queryFields = this.getQueryFieldNames(context, def!);
      for (let query of queryFields.values()) {
        let resolver;
        switch (query.type) {
          case QueryFieldType.GET:
            resolver = this.generateGetResolver(context, def!, query.typeName, query.fieldName, query.resolverLogicalId);
            break;
          case QueryFieldType.LIST:
            resolver = this.generateListResolver(context, def!, query.typeName, query.fieldName, query.resolverLogicalId);
            break;
          case QueryFieldType.SYNC:
            resolver = this.generateSyncResolver(context, def!, query.typeName, query.fieldName, query.resolverLogicalId);
            break;
          default:
            throw new Error('Unknown query field type');
        }
        resolver.addToSlot(
          'postAuth',
          MappingTemplate.s3MappingTemplateFromString(
            generateAuthExpressionForSandboxMode(context),
            `${query.typeName}.${query.fieldName}.{slotName}.{slotIndex}.req.vtl`,
          ),
        );
        resolver.mapToStack(stack);
        context.resolvers.addResolver(query.typeName, query.fieldName, resolver);
      }

      const mutationFields = this.getMutationFieldNames(context, def!);
      for (let mutation of mutationFields.values()) {
        let resolver;
        switch (mutation.type) {
          case MutationFieldType.CREATE:
            resolver = this.generateCreateResolver(context, def!, mutation.typeName, mutation.fieldName, mutation.resolverLogicalId);
            break;
          case MutationFieldType.DELETE:
            resolver = this.generateDeleteResolver(context, def!, mutation.typeName, mutation.fieldName, mutation.resolverLogicalId);
            break;
          case MutationFieldType.UPDATE:
            resolver = this.generateUpdateResolver(context, def!, mutation.typeName, mutation.fieldName, mutation.resolverLogicalId);
            break;
          default:
            throw new Error('Unknown mutation field type');
        }
        resolver.addToSlot(
          'postAuth',
          MappingTemplate.s3MappingTemplateFromString(
            generateAuthExpressionForSandboxMode(context),
            `${mutation.typeName}.${mutation.fieldName}.{slotName}.{slotIndex}.req.vtl`,
          ),
        );
        resolver.mapToStack(stack);
        context.resolvers.addResolver(mutation.typeName, mutation.fieldName, resolver);
      }

      const subscriptionLevel = this.modelDirectiveConfig.get(def.name.value)?.subscriptions?.level;
      // in order to create subscription resolvers the level needs to be on
      if (subscriptionLevel === SubscriptionLevel.on) {
        const subscriptionFields = this.getSubscriptionFieldNames(context, def!);
        for (let subscription of subscriptionFields.values()) {
          let resolver;
          switch (subscription.type) {
            case SubscriptionFieldType.ON_CREATE:
              resolver = this.generateOnCreateResolver(
                context,
                def,
                subscription.typeName,
                subscription.fieldName,
                subscription.resolverLogicalId,
              );
              break;
            case SubscriptionFieldType.ON_UPDATE:
              resolver = this.generateOnUpdateResolver(
                context,
                def,
                subscription.typeName,
                subscription.fieldName,
                subscription.resolverLogicalId,
              );
              break;
            case SubscriptionFieldType.ON_DELETE:
              resolver = this.generateOnDeleteResolver(
                context,
                def,
                subscription.typeName,
                subscription.fieldName,
                subscription.resolverLogicalId,
              );
              break;
            default:
              throw new Error('Unknown subscription field type');
          }
          resolver.addToSlot(
            'postAuth',
            MappingTemplate.s3MappingTemplateFromString(
              generateAuthExpressionForSandboxMode(context),
              `${subscription.typeName}.${subscription.fieldName}.{slotName}.{slotIndex}.req.vtl`,
            ),
          );
          resolver.mapToStack(stack);
          context.resolvers.addResolver(subscription.typeName, subscription.fieldName, resolver);
        }
      }
    }
  };

  generateGetResolver = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
  ): TransformerResolverProvider => {
    const isSyncEnabled = ctx.isProjectUsingDataStore();
    const dataSource = this.datasourceMap[type.name.value];
    const resolverKey = `Get${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateQueryResolver(
        typeName,
        fieldName,
        resolverLogicalId,
        dataSource,
        MappingTemplate.s3MappingTemplateFromString(generateGetRequestTemplate(), `${typeName}.${fieldName}.req.vtl`),
        MappingTemplate.s3MappingTemplateFromString(generateGetResponseTemplate(isSyncEnabled), `${typeName}.${fieldName}.res.vtl`),
      );
    }
    return this.resolverMap[resolverKey];
  };

  generateListResolver = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
  ): TransformerResolverProvider => {
    const isSyncEnabled = ctx.isProjectUsingDataStore();
    const dataSource = this.datasourceMap[type.name.value];
    const resolverKey = `List${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateQueryResolver(
        typeName,
        fieldName,
        resolverLogicalId,
        dataSource,
        MappingTemplate.s3MappingTemplateFromString(generateListRequestTemplate(), `${typeName}.${fieldName}.req.vtl`),
        MappingTemplate.s3MappingTemplateFromString(
          generateDefaultResponseMappingTemplate(isSyncEnabled),
          `${typeName}.${fieldName}.res.vtl`,
        ),
      );
    }
    return this.resolverMap[resolverKey];
  };

  generateUpdateResolver = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
  ): TransformerResolverProvider => {
    const isSyncEnabled = ctx.isProjectUsingDataStore();
    const dataSource = this.datasourceMap[type.name.value];
    const resolverKey = `Update${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      const resolver = ctx.resolvers.generateMutationResolver(
        typeName,
        fieldName,
        resolverLogicalId,
        dataSource,
        MappingTemplate.s3MappingTemplateFromString(
          generateUpdateRequestTemplate(typeName, isSyncEnabled),
          `${typeName}.${fieldName}.req.vtl`,
        ),
        MappingTemplate.s3MappingTemplateFromString(
          generateDefaultResponseMappingTemplate(isSyncEnabled, true),
          `${typeName}.${fieldName}.res.vtl`,
        ),
      );
      // Todo: get the slot index from the resolver to keep the name unique and show the order of functions
      resolver.addToSlot(
        'init',
        MappingTemplate.s3MappingTemplateFromString(
          generateUpdateInitSlotTemplate(type.name.value, this.modelDirectiveConfig.get(type.name.value)!),
          `${typeName}.${fieldName}.{slotName}.{slotIndex}.req.vtl`,
        ),
      );
      this.resolverMap[resolverKey] = resolver;
    }
    return this.resolverMap[resolverKey];
  };
  generateDeleteResolver = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
  ): TransformerResolverProvider => {
    const isSyncEnabled = ctx.isProjectUsingDataStore();
    const dataSource = this.datasourceMap[type.name.value];
    const resolverKey = `delete${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateMutationResolver(
        typeName,
        fieldName,
        resolverLogicalId,
        dataSource,
        MappingTemplate.s3MappingTemplateFromString(generateDeleteRequestTemplate(isSyncEnabled), `${typeName}.${fieldName}.req.vtl`),
        MappingTemplate.s3MappingTemplateFromString(
          generateDefaultResponseMappingTemplate(isSyncEnabled, true),
          `${typeName}.${fieldName}.res.vtl`,
        ),
      );
    }
    return this.resolverMap[resolverKey];
  };

  generateOnCreateResolver = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
  ): TransformerResolverProvider => {
    const resolverKey = `OnCreate${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateSubscriptionResolver(
        typeName,
        fieldName,
        resolverLogicalId,
        MappingTemplate.s3MappingTemplateFromString(generateSubscriptionRequestTemplate(), `${typeName}.${fieldName}.req.vtl`),
        MappingTemplate.s3MappingTemplateFromString(generateSubscriptionResponseTemplate(), `${typeName}.${fieldName}.res.vtl`),
      );
    }
    return this.resolverMap[resolverKey];
  };
  generateOnUpdateResolver = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
  ): TransformerResolverProvider => {
    const resolverKey = `OnUpdate${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateSubscriptionResolver(
        typeName,
        fieldName,
        resolverLogicalId,
        MappingTemplate.s3MappingTemplateFromString(generateSubscriptionRequestTemplate(), `${typeName}.${fieldName}.req.vtl`),
        MappingTemplate.s3MappingTemplateFromString(generateSubscriptionResponseTemplate(), `${typeName}.${fieldName}.res.vtl`),
      );
    }
    return this.resolverMap[resolverKey];
  };
  generateOnDeleteResolver = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
  ): TransformerResolverProvider => {
    const resolverKey = `OnDelete${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateSubscriptionResolver(
        typeName,
        fieldName,
        resolverLogicalId,
        MappingTemplate.s3MappingTemplateFromString(generateSubscriptionRequestTemplate(), `${typeName}.${fieldName}.req.vtl`),
        MappingTemplate.s3MappingTemplateFromString(generateSubscriptionResponseTemplate(), `${typeName}.${fieldName}.res.vtl`),
      );
    }
    return this.resolverMap[resolverKey];
  };
  generateSyncResolver = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    resolverLogicalId: string,
  ): TransformerResolverProvider => {
    const isSyncEnabled = ctx.isProjectUsingDataStore();
    const dataSource = this.datasourceMap[type.name.value];
    const resolverKey = `Sync${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateQueryResolver(
        typeName,
        fieldName,
        resolverLogicalId,
        dataSource,
        MappingTemplate.s3MappingTemplateFromString(generateSyncRequestTemplate(), `${typeName}.${fieldName}.req.vtl`),
        MappingTemplate.s3MappingTemplateFromString(
          generateDefaultResponseMappingTemplate(isSyncEnabled),
          `${typeName}.${fieldName}.res.vtl`,
        ),
      );
    }
    return this.resolverMap[resolverKey];
  };

  getQueryFieldNames = (
    ctx: TransformerTransformSchemaStepContextProvider,
    type: ObjectTypeDefinitionNode,
  ): Set<{ fieldName: string; typeName: string; type: QueryFieldType; resolverLogicalId: string }> => {
    const typeName = type.name.value;
    const fields: Set<{ fieldName: string; typeName: string; type: QueryFieldType; resolverLogicalId: string }> = new Set();
    const modelDirectiveConfig = this.modelDirectiveConfig.get(type.name.value);
    if (modelDirectiveConfig?.queries?.get) {
      fields.add({
        typeName: 'Query',
        fieldName: modelDirectiveConfig.queries.get || toCamelCase(['get', typeName]),
        type: QueryFieldType.GET,
        resolverLogicalId: ResolverResourceIDs.DynamoDBGetResolverResourceID(typeName),
      });
    }

    if (modelDirectiveConfig?.queries?.list) {
      fields.add({
        typeName: 'Query',
        fieldName: modelDirectiveConfig.queries.list || toCamelCase(['list', typeName]),
        type: QueryFieldType.LIST,
        resolverLogicalId: ResolverResourceIDs.DynamoDBListResolverResourceID(typeName),
      });
    }

    if (modelDirectiveConfig?.queries?.sync) {
      fields.add({
        typeName: 'Query',
        fieldName: modelDirectiveConfig.queries.sync || toCamelCase(['sync', typeName]),
        type: QueryFieldType.SYNC,
        resolverLogicalId: ResolverResourceIDs.SyncResolverResourceID(typeName),
      });
    }

    return fields;
  };

  getMutationFieldNames = (
    ctx: TransformerTransformSchemaStepContextProvider,
    type: ObjectTypeDefinitionNode,
  ): Set<{ fieldName: string; typeName: string; type: MutationFieldType; resolverLogicalId: string }> => {
    // Todo: get fields names from the directives
    const typeName = type.name.value;
    const modelDirectiveConfig = this.modelDirectiveConfig.get(typeName);
    const getMutationType = (type: string): MutationFieldType => {
      switch (type) {
        case 'create':
          return MutationFieldType.CREATE;
        case 'update':
          return MutationFieldType.UPDATE;
        case 'delete':
          return MutationFieldType.DELETE;
        default:
          throw new Error('Unknown mutation type');
      }
    };

    const getMutationResolverLogicalId = (type: string): string => {
      switch (type) {
        case 'create':
          return ResolverResourceIDs.DynamoDBCreateResolverResourceID(typeName);
        case 'update':
          return ResolverResourceIDs.DynamoDBUpdateResolverResourceID(typeName);
        case 'delete':
          return ResolverResourceIDs.DynamoDBDeleteResolverResourceID(typeName);
        default:
          throw new Error('Unknown mutation type');
      }
    };

    const fieldNames: Set<{ fieldName: string; typeName: string; type: MutationFieldType; resolverLogicalId: string }> = new Set();
    for (let [mutationType, mutationName] of Object.entries(modelDirectiveConfig?.mutations || {})) {
      if (mutationName) {
        fieldNames.add({
          typeName: 'Mutation',
          fieldName: mutationName,
          type: getMutationType(mutationType),
          resolverLogicalId: getMutationResolverLogicalId(mutationType),
        });
      }
    }

    return fieldNames;
  };

  getMutationName = (
    subscriptionType: SubscriptionFieldType,
    mutationMap: Set<{
      fieldName: string;
      typeName: string;
      type: MutationFieldType;
      resolverLogicalId: string;
    }>,
  ): string => {
    const mutationToSubscriptionTypeMap = {
      [SubscriptionFieldType.ON_CREATE]: MutationFieldType.CREATE,
      [SubscriptionFieldType.ON_UPDATE]: MutationFieldType.UPDATE,
      [SubscriptionFieldType.ON_DELETE]: MutationFieldType.DELETE,
    };
    const mutation = Array.from(mutationMap).find(m => m.type == mutationToSubscriptionTypeMap[subscriptionType]);
    if (mutation) {
      return mutation.fieldName;
    }
    throw new Error('Unknown Subscription type');
  };

  private createQueryFields = (ctx: TransformerValidationStepContextProvider, def: ObjectTypeDefinitionNode): FieldDefinitionNode[] => {
    const queryFields: FieldDefinitionNode[] = [];
    const queryFieldNames = this.getQueryFieldNames(ctx, def!);
    for (const queryField of queryFieldNames.values()) {
      const outputType = this.getOutputType(ctx, def, queryField);
      const args = this.getInputs(ctx, def!, {
        fieldName: queryField.fieldName,
        typeName: queryField.typeName,
        type: queryField.type,
      });
      queryFields.push(makeField(queryField.fieldName, args, makeNamedType(outputType.name.value)));
    }

    return queryFields;
  };

  private createMutationFields = (ctx: TransformerValidationStepContextProvider, def: ObjectTypeDefinitionNode): FieldDefinitionNode[] => {
    const mutationFields: FieldDefinitionNode[] = [];
    const mutationFieldNames = this.getMutationFieldNames(ctx, def!);
    for (const mutationField of mutationFieldNames) {
      const args = this.getInputs(ctx, def!, {
        fieldName: mutationField.fieldName,
        typeName: mutationField.typeName,
        type: mutationField.type,
      });

      mutationFields.push(makeField(mutationField.fieldName, args, makeNamedType(def!.name.value)));
    }
    return mutationFields;
  };

  private createSubscriptionFields = (
    ctx: TransformerTransformSchemaStepContextProvider,
    def: ObjectTypeDefinitionNode,
  ): FieldDefinitionNode[] => {
    const subscriptionToMutationsMap = this.getSubscriptionToMutationsReverseMap(ctx, def);
    const mutationFields = this.getMutationFieldNames(ctx, def!);

    const subscriptionFields: FieldDefinitionNode[] = [];
    for (const subscriptionFieldName of Object.keys(subscriptionToMutationsMap)) {
      const maps = subscriptionToMutationsMap[subscriptionFieldName];

      const args: InputValueDefinitionNode[] = [];
      maps.map(it =>
        args.concat(
          this.getInputs(ctx, def!, {
            fieldName: it.fieldName,
            typeName: it.typeName,
            type: it.type,
          }),
        ),
      );

      const mutationNames = maps.map(it => this.getMutationName(it.type, mutationFields));

      // Todo use directive wrapper to build the directive node
      const directive = makeDirective('aws_subscribe', [makeArgument('mutations', makeValueNode(mutationNames))]);
      const field = makeField(subscriptionFieldName, args, makeNamedType(def!.name.value), [directive]);
      subscriptionFields.push(field);
    }

    return subscriptionFields;
  };

  getSubscriptionFieldNames = (
    ctx: TransformerTransformSchemaStepContextProvider,
    type: ObjectTypeDefinitionNode,
  ): Set<{
    fieldName: string;
    typeName: string;
    type: SubscriptionFieldType;
    resolverLogicalId: string;
  }> => {
    const fields: Set<{
      fieldName: string;
      typeName: string;
      type: SubscriptionFieldType;
      resolverLogicalId: string;
    }> = new Set();

    const modelDirectiveConfig = this.modelDirectiveConfig.get(type.name.value);
    if (modelDirectiveConfig?.subscriptions?.level !== SubscriptionLevel.off) {
      if (modelDirectiveConfig?.subscriptions?.onCreate && modelDirectiveConfig.mutations?.create) {
        for (const fieldName of modelDirectiveConfig.subscriptions.onCreate) {
          fields.add({
            typeName: 'Subscription',
            fieldName: fieldName,
            type: SubscriptionFieldType.ON_CREATE,
            resolverLogicalId: ModelResourceIDs.ModelOnCreateSubscriptionName(type.name.value),
          });
        }
      }

      if (modelDirectiveConfig?.subscriptions?.onUpdate && modelDirectiveConfig.mutations?.update) {
        for (const fieldName of modelDirectiveConfig.subscriptions.onUpdate) {
          fields.add({
            typeName: 'Subscription',
            fieldName: fieldName,
            type: SubscriptionFieldType.ON_UPDATE,
            resolverLogicalId: ModelResourceIDs.ModelOnUpdateSubscriptionName(type.name.value),
          });
        }
      }

      if (modelDirectiveConfig?.subscriptions?.onDelete && modelDirectiveConfig.mutations?.delete) {
        for (const fieldName of modelDirectiveConfig.subscriptions.onDelete) {
          fields.add({
            typeName: 'Subscription',
            fieldName: fieldName,
            type: SubscriptionFieldType.ON_DELETE,
            resolverLogicalId: ModelResourceIDs.ModelOnDeleteSubscriptionName(type.name.value),
          });
        }
      }
    }

    return fields;
  };

  getDataSourceResource = (ctx: TransformerContextProvider, type: ObjectTypeDefinitionNode): DataSourceInstance => {
    // Todo: add sanity check to ensure the type has an table
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
    resolverLogicalId: string,
  ): TransformerResolverProvider => {
    const isSyncEnabled = ctx.isProjectUsingDataStore();
    const dataSource = this.datasourceMap[type.name.value];
    const resolverKey = `Create${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      const resolver = ctx.resolvers.generateMutationResolver(
        typeName,
        fieldName,
        resolverLogicalId,
        dataSource,
        MappingTemplate.s3MappingTemplateFromString(generateCreateRequestTemplate(type.name.value), `${typeName}.${fieldName}.req.vtl`),
        MappingTemplate.s3MappingTemplateFromString(
          generateDefaultResponseMappingTemplate(isSyncEnabled, true),
          `${typeName}.${fieldName}.res.vtl`,
        ),
      );
      this.resolverMap[resolverKey] = resolver;
      resolver.addToSlot(
        'init',
        MappingTemplate.s3MappingTemplateFromString(
          generateCreateInitSlotTemplate(type.name.value, this.modelDirectiveConfig.get(type.name.value)!),
          `${typeName}.${fieldName}.{slotName}.{slotIndex}.req.vtl`,
        ),
      );
    }
    return this.resolverMap[resolverKey];
  };

  getInputs = (
    ctx: TransformerTransformSchemaStepContextProvider,
    type: ObjectTypeDefinitionNode,
    operation: {
      fieldName: string;
      typeName: string;
      type: QueryFieldType | MutationFieldType | SubscriptionFieldType;
    },
  ): InputValueDefinitionNode[] => {
    const isSyncEnabled = ctx.isProjectUsingDataStore();

    const knownModels = this.typesWithModelDirective;
    let conditionInput: InputObjectTypeDefinitionNode;
    if ([MutationFieldType.CREATE, MutationFieldType.DELETE, MutationFieldType.UPDATE].includes(operation.type as MutationFieldType)) {
      const conditionTypeName = toPascalCase(['Model', type.name.value, 'ConditionInput']);

      const filterInputs = createEnumModelFilters(ctx, type);
      conditionInput = makeMutationConditionInput(ctx, conditionTypeName, type);
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
        const filterInputName = toPascalCase(['Model', type.name.value, 'FilterInput']);
        const filterInputs = createEnumModelFilters(ctx, type);
        filterInputs.push(makeListQueryFilterInput(ctx, filterInputName, type));
        for (let input of filterInputs) {
          const conditionInputName = input.name.value;
          if (!ctx.output.getType(conditionInputName)) {
            ctx.output.addInput(input);
          }
        }

        return [
          makeInputValueDefinition('filter', makeNamedType(filterInputName)),
          makeInputValueDefinition('limit', makeNamedType('Int')),
          makeInputValueDefinition('nextToken', makeNamedType('String')),
        ];
      case QueryFieldType.SYNC:
        const syncFilterInputName = toPascalCase(['Model', type.name.value, 'FilterInput']);
        const syncFilterInputs = makeListQueryFilterInput(ctx, syncFilterInputName, type);
        const conditionInputName = syncFilterInputs.name.value;
        if (!ctx.output.getType(conditionInputName)) {
          ctx.output.addInput(syncFilterInputs);
        }
        return [
          makeInputValueDefinition('filter', makeNamedType(syncFilterInputName)),
          makeInputValueDefinition('limit', makeNamedType('Int')),
          makeInputValueDefinition('nextToken', makeNamedType('String')),
          makeInputValueDefinition('lastSync', makeNamedType('AWSTimestamp')),
        ];

      case MutationFieldType.CREATE:
        const createInputField = makeCreateInputField(
          type,
          this.modelDirectiveConfig.get(type.name.value)!,
          knownModels,
          ctx.inputDocument,
          isSyncEnabled,
        );
        const createInputTypeName = createInputField.name.value;
        if (!ctx.output.getType(createInputField.name.value)) {
          ctx.output.addInput(createInputField);
        }
        return [
          makeInputValueDefinition('input', makeNonNullType(makeNamedType(createInputTypeName))),
          makeInputValueDefinition('condition', makeNamedType(conditionInput!.name.value)),
        ];

      case MutationFieldType.DELETE:
        const deleteInputField = makeDeleteInputField(type, isSyncEnabled);
        const deleteInputTypeName = deleteInputField.name.value;
        if (!ctx.output.getType(deleteInputField.name.value)) {
          ctx.output.addInput(deleteInputField);
        }
        return [
          makeInputValueDefinition('input', makeNonNullType(makeNamedType(deleteInputTypeName))),
          makeInputValueDefinition('condition', makeNamedType(conditionInput!.name.value)),
        ];

      case MutationFieldType.UPDATE:
        const updateInputField = makeUpdateInputField(
          type,
          this.modelDirectiveConfig.get(type.name.value)!,
          knownModels,
          ctx.inputDocument,
          isSyncEnabled,
        );
        const updateInputTypeName = updateInputField.name.value;
        if (!ctx.output.getType(updateInputField.name.value)) {
          ctx.output.addInput(updateInputField);
        }
        return [
          makeInputValueDefinition('input', makeNonNullType(makeNamedType(updateInputTypeName))),
          makeInputValueDefinition('condition', makeNamedType(conditionInput!.name.value)),
        ];

      case SubscriptionFieldType.ON_CREATE:
      case SubscriptionFieldType.ON_DELETE:
      case SubscriptionFieldType.ON_UPDATE:
        return [];
        break;

      default:
        throw new Error('Unknown operation type');
    }
    return [];
  };

  getOutputType = (
    ctx: TransformerTransformSchemaStepContextProvider,
    type: ObjectTypeDefinitionNode,
    operation: {
      fieldName: string;
      typeName: string;
      type: QueryFieldType | MutationFieldType | SubscriptionFieldType;
    },
  ): ObjectTypeDefinitionNode => {
    let outputType: ObjectTypeDefinitionNode;
    switch (operation.type) {
      case MutationFieldType.CREATE:
      case MutationFieldType.UPDATE:
      case MutationFieldType.DELETE:
      case QueryFieldType.GET:
      case SubscriptionFieldType.ON_CREATE:
      case SubscriptionFieldType.ON_DELETE:
      case SubscriptionFieldType.ON_UPDATE:
        outputType = type;
        break;
      case QueryFieldType.SYNC:
      case QueryFieldType.LIST:
        const isSyncEnabled = ctx.isProjectUsingDataStore();
        const connectionFieldName = toPascalCase(['Model', type.name.value, 'Connection']);
        outputType = makeListQueryModel(type, connectionFieldName, isSyncEnabled);
        break;
      default:
        throw new Error(`${operation.type} not supported for ${type.name.value}`);
    }
    if (!ctx.output.getObject(outputType.name.value)) {
      ctx.output.addObject(outputType);
    }
    return outputType;
  };

  private createNonModelInputs = (ctx: TransformerTransformSchemaStepContextProvider, obj: ObjectTypeDefinitionNode): void => {
    for (let field of obj.fields || []) {
      if (!isScalar(field.type)) {
        const def = ctx.output.getType(getBaseType(field.type));
        if (def && def.kind == 'ObjectTypeDefinition' && !this.isModelField(def.name.value)) {
          const name = this.getNonModelInputObjectName(def.name.value);
          if (!ctx.output.getType(name)) {
            const inputObj = InputObjectDefinitionWrapper.fromObject(name, def, ctx.inputDocument);
            ctx.output.addInput(inputObj.serialize());
            this.createNonModelInputs(ctx, def);
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
  private addAutoGeneratableFields = (ctx: TransformerTransformSchemaStepContextProvider, name: string): void => {
    const modelDirectiveConfig = this.modelDirectiveConfig.get(name);
    const typeObj = ctx.output.getObject(name);
    if (!typeObj) {
      throw new Error(`Type ${name} is missing in outputs`);
    }
    const typeWrapper = new ObjectDefinitionWrapper(typeObj);
    if (!typeWrapper.hasField('id')) {
      const idField = FieldWrapper.create('id', 'ID');
      typeWrapper.addField(idField);
    }

    const timestamps = [];

    if (modelDirectiveConfig?.timestamps) {
      if (modelDirectiveConfig.timestamps.createdAt !== null) {
        timestamps.push(modelDirectiveConfig.timestamps.createdAt ?? 'createdAt');
      }

      if (modelDirectiveConfig.timestamps.updatedAt !== null) {
        timestamps.push(modelDirectiveConfig.timestamps.updatedAt ?? 'updatedAt');
      }
    }

    for (let fieldName of timestamps) {
      if (typeWrapper.hasField(fieldName)) {
        const field = typeWrapper.getField(fieldName);
        if (!['String', 'AWSDateTime'].includes(field.getTypeName())) {
          console.warn(`type ${name}.${fieldName} is not of String or AWSDateTime. Auto population is not supported`);
        }
      } else {
        const field = FieldWrapper.create(fieldName, 'AWSDateTime');
        typeWrapper.addField(field);
      }
    }

    ctx.output.updateObject(typeWrapper.serialize());
  };

  private addModelSyncFields = (ctx: TransformerTransformSchemaStepContextProvider, name: string): void => {
    const typeObj = ctx.output.getObject(name);
    if (!typeObj) {
      throw new Error(`Type ${name} is missing in outputs`);
    }

    const typeWrapper = new ObjectDefinitionWrapper(typeObj);
    typeWrapper.addField(FieldWrapper.create('_version', 'Int'));
    typeWrapper.addField(FieldWrapper.create('_deleted', 'Boolean', true));
    typeWrapper.addField(FieldWrapper.create('_lastChangedAt', 'AWSTimestamp'));

    ctx.output.updateObject(typeWrapper.serialize());
  };

  private getSubscriptionToMutationsReverseMap = (
    ctx: TransformerValidationStepContextProvider,
    def: ObjectTypeDefinitionNode,
  ): { [subField: string]: { fieldName: string; typeName: string; type: SubscriptionFieldType }[] } => {
    const subscriptionToMutationsMap: { [subField: string]: { fieldName: string; typeName: string; type: SubscriptionFieldType }[] } = {};
    const subscriptionFieldNames = this.getSubscriptionFieldNames(ctx, def);

    for (const subscriptionFieldName of subscriptionFieldNames) {
      if (!subscriptionToMutationsMap[subscriptionFieldName.fieldName]) {
        subscriptionToMutationsMap[subscriptionFieldName.fieldName] = [];
      }
      subscriptionToMutationsMap[subscriptionFieldName.fieldName].push(subscriptionFieldName);
    }

    return subscriptionToMutationsMap;
  };

  private createModelTable(stack: cdk.Stack, def: ObjectTypeDefinitionNode, context: TransformerContextProvider) {
    const tableLogicalName = `${def!.name.value}Table`;
    const tableName = context.resourceHelper.generateResourceName(def!.name.value);

    // Add parameters.
    const env = context.stackManager.getParameter(ResourceConstants.PARAMETERS.Env) as cdk.CfnParameter;
    const readIops = new cdk.CfnParameter(stack, ResourceConstants.PARAMETERS.DynamoDBModelTableReadIOPS, {
      description: 'The number of read IOPS the table should support.',
      type: 'Number',
      default: 5,
    }).valueAsString;
    const writeIops = new cdk.CfnParameter(stack, ResourceConstants.PARAMETERS.DynamoDBModelTableWriteIOPS, {
      description: 'The number of write IOPS the table should support.',
      type: 'Number',
      default: 5,
    }).valueAsString;
    const billingMode = new cdk.CfnParameter(stack, ResourceConstants.PARAMETERS.DynamoDBBillingMode, {
      description: 'Configure @model types to create DynamoDB tables with PAY_PER_REQUEST or PROVISIONED billing modes.',
      type: 'String',
      default: 'PAY_PER_REQUEST',
      allowedValues: ['PAY_PER_REQUEST', 'PROVISIONED'],
    }).valueAsString;
    const pointInTimeRecovery = new cdk.CfnParameter(stack, ResourceConstants.PARAMETERS.DynamoDBEnablePointInTimeRecovery, {
      description: 'Whether to enable Point in Time Recovery on the table.',
      type: 'String',
      default: 'false',
      allowedValues: ['true', 'false'],
    }).valueAsString;
    const enableSSE = new cdk.CfnParameter(stack, ResourceConstants.PARAMETERS.DynamoDBEnableServerSideEncryption, {
      description: 'Enable server side encryption powered by KMS.',
      type: 'String',
      default: 'true',
      allowedValues: ['true', 'false'],
    }).valueAsString;

    // Add conditions.
    // eslint-disable-next-line no-new
    new cdk.CfnCondition(stack, ResourceConstants.CONDITIONS.HasEnvironmentParameter, {
      expression: cdk.Fn.conditionNot(cdk.Fn.conditionEquals(env, ResourceConstants.NONE)),
    });
    const useSSE = new cdk.CfnCondition(stack, ResourceConstants.CONDITIONS.ShouldUseServerSideEncryption, {
      expression: cdk.Fn.conditionEquals(enableSSE, 'true'),
    });
    const usePayPerRequestBilling = new cdk.CfnCondition(stack, ResourceConstants.CONDITIONS.ShouldUsePayPerRequestBilling, {
      expression: cdk.Fn.conditionEquals(billingMode, 'PAY_PER_REQUEST'),
    });
    const usePointInTimeRecovery = new cdk.CfnCondition(stack, ResourceConstants.CONDITIONS.ShouldUsePointInTimeRecovery, {
      expression: cdk.Fn.conditionEquals(pointInTimeRecovery, 'true'),
    });

    const removalPolicy = this.options.EnableDeletionProtection ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY;

    // Expose a way in context to allow proper resource naming
    const table = new Table(stack, tableLogicalName, {
      tableName,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      encryption: TableEncryption.DEFAULT,
      removalPolicy: removalPolicy,
      ...(context.isProjectUsingDataStore() ? { timeToLiveAttribute: '_ttl' } : undefined),
    });
    const cfnTable = table.node.defaultChild as CfnTable;

    cfnTable.provisionedThroughput = cdk.Fn.conditionIf(usePayPerRequestBilling.logicalId, cdk.Fn.ref('AWS::NoValue'), {
      ReadCapacityUnits: readIops,
      WriteCapacityUnits: writeIops,
    });
    cfnTable.pointInTimeRecoverySpecification = cdk.Fn.conditionIf(
      usePointInTimeRecovery.logicalId,
      { PointInTimeRecoveryEnabled: true },
      cdk.Fn.ref('AWS::NoValue'),
    );
    cfnTable.billingMode = cdk.Fn.conditionIf(usePayPerRequestBilling.logicalId, 'PAY_PER_REQUEST', cdk.Fn.ref('AWS::NoValue')).toString();
    cfnTable.sseSpecification = {
      sseEnabled: cdk.Fn.conditionIf(useSSE.logicalId, true, false),
    };

    const streamArnOutputId = `GetAtt${ModelResourceIDs.ModelTableStreamArn(def!.name.value)}`;
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(stack, streamArnOutputId, {
      value: cdk.Fn.getAtt(tableLogicalName, 'StreamArn').toString(),
      description: 'Your DynamoDB table StreamArn.',
      exportName: cdk.Fn.join(':', [context.api.apiId, 'GetAtt', tableLogicalName, 'StreamArn']),
    });

    const tableNameOutputId = `GetAtt${tableLogicalName}Name`;
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(stack, tableNameOutputId, {
      value: cdk.Fn.ref(tableLogicalName),
      description: 'Your DynamoDB table name.',
      exportName: cdk.Fn.join(':', [context.api.apiId, 'GetAtt', tableLogicalName, 'Name']),
    });

    const role = this.createIAMRole(context, def, stack, tableName);
    this.createModelTableDataSource(def, context, table, stack, role);
  }

  private createModelTableDataSource(
    def: ObjectTypeDefinitionNode,
    context: TransformerContextProvider,
    table: Table,
    stack: cdk.Stack,
    role: iam.Role,
  ) {
    const tableLogicalName = `${def!.name.value}Table`;
    const datasourceRoleLogicalID = ModelResourceIDs.ModelTableDataSourceID(def!.name.value);
    const dataSource = context.api.host.addDynamoDbDataSource(
      datasourceRoleLogicalID,
      table,
      { name: tableLogicalName, serviceRole: role },
      stack,
    );

    const cfnDataSource = dataSource.node.defaultChild as CfnDataSource;
    cfnDataSource.addDependsOn(role.node.defaultChild as CfnRole);
    cfnDataSource.overrideLogicalId(datasourceRoleLogicalID);

    if (context.isProjectUsingDataStore()) {
      const datasourceDynamoDb = cfnDataSource.dynamoDbConfig as any;
      datasourceDynamoDb.deltaSyncConfig = {
        deltaSyncTableName: context.resourceHelper.generateResourceName(SyncResourceIDs.syncTableName),
        deltaSyncTableTtl: '30',
        baseTableTtl: '43200',
      };
      datasourceDynamoDb.versioned = true;
    }

    const datasourceOutputId = `GetAtt${datasourceRoleLogicalID}Name`;
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(stack, datasourceOutputId, {
      value: dataSource.ds.attrName,
      description: 'Your model DataSource name.',
      exportName: cdk.Fn.join(':', [context.api.apiId, 'GetAtt', datasourceRoleLogicalID, 'Name']),
    });

    // add the data source
    context.dataSources.add(def!, dataSource);
    this.datasourceMap[def!.name.value] = dataSource;
  }

  private createIAMRole(context: TransformerContextProvider, def: ObjectTypeDefinitionNode, stack: cdk.Stack, tableName: string) {
    const roleName = context.resourceHelper.generateIAMRoleName(ModelResourceIDs.ModelTableIAMRoleID(def!.name.value));
    const role = new iam.Role(stack, ModelResourceIDs.ModelTableIAMRoleID(def!.name.value), {
      roleName: roleName,
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
    });

    const amplifyDataStoreTableName = context.resourceHelper.generateResourceName(SyncResourceIDs.syncTableName);
    role.attachInlinePolicy(
      new iam.Policy(stack, 'DynamoDBAccess', {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'dynamodb:BatchGetItem',
              'dynamodb:BatchWriteItem',
              'dynamodb:PutItem',
              'dynamodb:DeleteItem',
              'dynamodb:GetItem',
              'dynamodb:Scan',
              'dynamodb:Query',
              'dynamodb:UpdateItem',
            ],
            resources: [
              // eslint-disable-next-line no-template-curly-in-string
              cdk.Fn.sub('arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${tablename}', {
                tablename: tableName,
              }),
              // eslint-disable-next-line no-template-curly-in-string
              cdk.Fn.sub('arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${tablename}/*', {
                tablename: tableName,
              }),
              ...(context.isProjectUsingDataStore()
                ? [
                    // eslint-disable-next-line no-template-curly-in-string
                    cdk.Fn.sub('arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${tablename}', {
                      tablename: amplifyDataStoreTableName,
                    }),
                    // eslint-disable-next-line no-template-curly-in-string
                    cdk.Fn.sub('arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${tablename}/*', {
                      tablename: amplifyDataStoreTableName,
                    }),
                  ]
                : []),
            ],
          }),
        ],
      }),
    );

    const syncConfig = SyncUtils.getSyncConfig(context, def!.name.value);
    if (syncConfig && SyncUtils.isLambdaSyncConfig(syncConfig)) {
      role.attachInlinePolicy(
        SyncUtils.createSyncLambdaIAMPolicy(stack, syncConfig.LambdaConflictHandler.name, syncConfig.LambdaConflictHandler.region),
      );
    }
    return role;
  }

  private ensureModelSortDirectionEnum(ctx: TransformerValidationStepContextProvider): void {
    if (!ctx.output.hasType('ModelSortDirection')) {
      const modelSortDirection = makeModelSortDirectionEnumObject();

      ctx.output.addEnum(modelSortDirection);
    }
  }

  private getOptions = (options: ModelTransformerOptions): ModelTransformerOptions => {
    return {
      EnableDeletionProtection: false,
      ...options,
    };
  };

  private ensureValidSubscriptionName = (name: string): string => {
    if (name.length <= 50) return name;

    return name.slice(0, 45) + md5(name).slice(0, 5);
  };
}
