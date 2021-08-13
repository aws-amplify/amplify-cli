import { InvalidDirectiveError, MappingTemplate, TransformerModelBase } from '@aws-amplify/graphql-transformer-core';
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
import * as cdk from '@aws-cdk/core';
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
  plurality,
  ResourceConstants,
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
  makeMutationConditionInput,
  makeUpdateInputField,
} from './graphql-types';
import {
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
import { generateGetRequestTemplate, generateGetResponseTemplate, generateListRequestTemplate } from './resolvers/query';
import {
  DirectiveWrapper,
  FieldWrapper,
  InputObjectDefinitionWrapper,
  ObjectDefinitionWrapper,
} from './wrappers/object-definition-wrapper';

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
    const directiveWrapped: DirectiveWrapper = new DirectiveWrapper(directive);
    const options = directiveWrapped.getArguments({
      queries: {
        get: toCamelCase(['get', typeName]),
        list: toCamelCase(['list', plurality(typeName, true)]),
      },
      mutations: {
        create: toCamelCase(['create', typeName]),
        update: toCamelCase(['update', typeName]),
        delete: toCamelCase(['delete', typeName]),
      },
      subscriptions: {
        level: SubscriptionLevel.public,
        onCreate: [toCamelCase(['onCreate', typeName])],
        onDelete: [toCamelCase(['onDelete', typeName])],
        onUpdate: [toCamelCase(['onUpdate', typeName])],
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
    // Create Non Model input types

    // add the model input conditions
    addModelConditionInputs(ctx);

    for (const type of this.typesWithModelDirective) {
      const def = ctx.output.getObject(type)!;
      // add Non Model type inputs
      this.createNonModelInputs(ctx, def);
      const queryFields = this.getQueryFieldNames(ctx, def!);
      for (const queryField of queryFields.values()) {
        const outputType = this.getOutputType(ctx, def, queryField);
        const args = this.getInputs(ctx, def!, {
          fieldName: queryField.fieldName,
          typeName: queryField.typeName,
          type: queryField.type,
        });
        const getField = makeField(queryField.fieldName, args, makeNamedType(outputType.name.value));
        ctx.output.addQueryFields([getField]);
      }

      const mutationFields = this.getMutationFieldNames(ctx, def!);
      for (const mutationField of mutationFields) {
        const args = this.getInputs(ctx, def!, {
          fieldName: mutationField.fieldName,
          typeName: mutationField.typeName,
          type: mutationField.type,
        });

        const field = makeField(mutationField.fieldName, args, makeNamedType(def!.name.value));
        ctx.output.addMutationFields([field]);
      }

      const subscriptionsFields = this.createSubscriptionFields(ctx, def!);
      ctx.output.addSubscriptionFields(subscriptionsFields);

      // Update the field with auto generatable Fields
      this.addAutoGeneratableFields(ctx, type);
    }
  };

  generateResolvers = (context: TransformerContextProvider): void => {
    for (let type of this.typesWithModelDirective) {
      const def = context.output.getObject(type);
      // add the table
      const tableLogicalName = `${def!.name.value}Table`;
      const tableName = context.resourceHelper.generateResourceName(def!.name.value);
      const stack = context.stackManager.getStackFor(tableLogicalName, def!.name.value);

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

      // Expose a way in context to allow proper resource naming
      const table = new Table(stack, tableLogicalName, {
        tableName,
        partitionKey: {
          name: 'id',
          type: AttributeType.STRING,
        },
        stream: StreamViewType.NEW_AND_OLD_IMAGES,
        encryption: TableEncryption.DEFAULT,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
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
      cfnTable.billingMode = cdk.Fn.conditionIf(
        usePayPerRequestBilling.logicalId,
        'PAY_PER_REQUEST',
        cdk.Fn.ref('AWS::NoValue'),
      ).toString();
      cfnTable.sseSpecification = {
        sseEnabled: cdk.Fn.conditionIf(useSSE.logicalId, true, false),
      };

      // Expose a better API to select what stack this belongs to
      const dataSource = context.api.host.addDynamoDbDataSource(
        `${def!.name.value}DS`,
        table,
        {
          // This name is used by the mock functionality. Changing this can break mock.
          name: `${def!.name.value}Table`,
        },
        stack,
      );
      // add the data source
      context.dataSources.add(def!, dataSource);

      const queryFields = this.getQueryFieldNames(context, def!);
      this.datasourceMap[def!.name.value] = dataSource;
      for (let query of queryFields.values()) {
        let resolver;
        switch (query.type) {
          case QueryFieldType.GET:
            resolver = this.generateGetResolver(context, def!, query.typeName, query.fieldName);
            break;
          case QueryFieldType.LIST:
            resolver = this.generateListResolver(context, def!, query.typeName, query.fieldName);
            break;
          case QueryFieldType.SYNC:
            resolver = this.generateSyncResolver(context, def!, query.typeName, query.fieldName);
            break;
          default:
            throw new Error('Unknown query field type');
        }

        resolver.mapToStack(stack);
        context.resolvers.addResolver(query.typeName, query.fieldName, resolver);
      }

      const mutationFields = this.getMutationFieldNames(context, def!);
      for (let mutation of mutationFields.values()) {
        let resolver;
        switch (mutation.type) {
          case MutationFieldType.CREATE:
            resolver = this.generateCreateResolver(context, def!, mutation.typeName, mutation.fieldName);
            break;
          case MutationFieldType.DELETE:
            resolver = this.generateDeleteResolver(context, def!, mutation.typeName, mutation.fieldName);
            break;
          case MutationFieldType.UPDATE:
            resolver = this.generateUpdateResolver(context, def!, mutation.typeName, mutation.fieldName);
            break;
          default:
            throw new Error('Unknown query field type');
        }
        resolver.mapToStack(stack);
        context.resolvers.addResolver(mutation.typeName, mutation.fieldName, resolver);
      }
    }
  };

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
        MappingTemplate.s3MappingTemplateFromString(generateGetResponseTemplate(), `${typeName}.${fieldName}.res.vtl`),
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
    const dataSource = this.datasourceMap[type.name.value];
    const resolverKey = `List${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateQueryResolver(
        typeName,
        fieldName,
        dataSource,
        MappingTemplate.s3MappingTemplateFromString(generateListRequestTemplate(), `${typeName}.${fieldName}.req.vtl`),
        MappingTemplate.s3MappingTemplateFromString(generateDefaultResponseMappingTemplate(), `${typeName}.${fieldName}.res.vtl`),
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
    const resolverKey = `OnCreate${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateSubscriptionResolver(
        typeName,
        fieldName,
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
  ): TransformerResolverProvider => {
    const resolverKey = `OnUpdate${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateSubscriptionResolver(
        typeName,
        fieldName,
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
  ): TransformerResolverProvider => {
    const resolverKey = `OnDelete${generateResolverKey(typeName, fieldName)}`;
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateSubscriptionResolver(
        typeName,
        fieldName,
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
    ctx: TransformerTransformSchemaStepContextProvider,
    type: ObjectTypeDefinitionNode,
  ): Set<{ fieldName: string; typeName: string; type: QueryFieldType }> => {
    const typeName = type.name.value;
    const fields: Set<{ fieldName: string; typeName: string; type: QueryFieldType }> = new Set();
    const modelDirectiveConfig = this.modelDirectiveConfig.get(type.name.value);
    if (modelDirectiveConfig?.queries?.get) {
      fields.add({
        typeName: 'Query',
        fieldName: modelDirectiveConfig.queries.get || toCamelCase(['get', typeName]),
        type: QueryFieldType.GET,
      });
    }

    if (modelDirectiveConfig?.queries?.list) {
      fields.add({
        typeName: 'Query',
        fieldName: modelDirectiveConfig.queries.list || toCamelCase(['list', typeName]),
        type: QueryFieldType.LIST,
      });
    }
    // check if this API is sync enabled and then if the model is sync enabled
    // fields.add({
    //   typeName: 'Query',
    //   fieldName: camelCase(`sync ${typeName}`),
    //   type: QueryFieldType.SYNC,
    // });
    return fields;
  };

  getMutationFieldNames = (
    ctx: TransformerTransformSchemaStepContextProvider,
    type: ObjectTypeDefinitionNode,
  ): Set<{ fieldName: string; typeName: string; type: MutationFieldType }> => {
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

    const fieldNames: Set<{ fieldName: string; typeName: string; type: MutationFieldType }> = new Set();
    for (let [mutationType, mutationName] of Object.entries(modelDirectiveConfig?.mutations || {})) {
      if (mutationName) {
        fieldNames.add({
          typeName: 'Mutation',
          fieldName: mutationName,
          type: getMutationType(mutationType),
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

  createSubscriptionFields = (ctx: TransformerTransformSchemaStepContextProvider, def: ObjectTypeDefinitionNode): FieldDefinitionNode[] => {
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
  }> => {
    const fields: Set<{
      fieldName: string;
      typeName: string;
      type: SubscriptionFieldType;
    }> = new Set();

    const modelDirectiveConfig = this.modelDirectiveConfig.get(type.name.value);
    if (modelDirectiveConfig?.subscriptions?.level !== SubscriptionLevel.off) {
      if (modelDirectiveConfig?.subscriptions?.onCreate && modelDirectiveConfig.mutations?.create) {
        for (const fieldName of modelDirectiveConfig.subscriptions.onCreate) {
          fields.add({
            typeName: 'Subscription',
            fieldName: fieldName,
            type: SubscriptionFieldType.ON_CREATE,
          });
        }
      }

      if (modelDirectiveConfig?.subscriptions?.onUpdate && modelDirectiveConfig.mutations?.update) {
        for (const fieldName of modelDirectiveConfig.subscriptions.onUpdate) {
          fields.add({
            typeName: 'Subscription',
            fieldName: fieldName,
            type: SubscriptionFieldType.ON_UPDATE,
          });
        }
      }

      if (modelDirectiveConfig?.subscriptions?.onDelete && modelDirectiveConfig.mutations?.delete) {
        for (const fieldName of modelDirectiveConfig.subscriptions.onDelete) {
          fields.add({
            typeName: 'Subscription',
            fieldName: fieldName,
            type: SubscriptionFieldType.ON_DELETE,
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
        const filterInputs = makeListQueryFilterInput(ctx, filterInputName, type);
        for (let input of [filterInputs]) {
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
        return [];

      case MutationFieldType.CREATE:
        const createInputField = makeCreateInputField(
          type,
          this.modelDirectiveConfig.get(type.name.value)!,
          knownModels,
          ctx.inputDocument,
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
        const updateInputField = makeUpdateInputField(
          type,
          this.modelDirectiveConfig.get(type.name.value)!,
          knownModels,
          ctx.inputDocument,
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
      case QueryFieldType.LIST:
        const connectionFieldName = toPascalCase(['Model', type.name.value, 'Connection']);
        outputType = makeListQueryModel(type, connectionFieldName);
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
}
