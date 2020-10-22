import {
  ObjectTypeDefinitionNode,
  DirectiveDefinitionNode,
  InputValueDefinitionNode,
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
import { TransformerModelBase } from '@aws-amplify/graphql-transformer-core';
import {
  TranformerTransformSchemaStepContextProvider,
  TransformerPrepareStepContextProvider,
  TransformerSchemaVisitStepContextProvider,
  TransformerValidationStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { makeField, makeInputValueDefinition, makeNamedType, makeNonNullType } from 'graphql-transformer-common';
import { RemovalPolicy } from '@aws-cdk/core';

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
    const resolverKey = this.generateResolverKey(typeName, fieldName);
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateQueryResolver(
        typeName,
        fieldName,
        dataSource,
        'Get Request Template',
        'GetResponseTemplate',
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
    const resolverKey = this.generateResolverKey(typeName, fieldName);
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateQueryResolver(typeName, fieldName, dataSource, '{}', '{}');
    }
    return this.resolverMap[resolverKey];
  };

  generateUpdateResolver = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
  ): TransformerResolverProvider => {
    const dataSource = this.datasourceMap[typeName];
    const resolverKey = this.generateResolverKey(typeName, fieldName);
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateQueryResolver(typeName, fieldName, dataSource, '{}', '{}');
    }
    return this.resolverMap[resolverKey];
  };

  object = (definition: ObjectTypeDefinitionNode): void => {
    // todo: get model configuration with default values and store it in the map
    const typeName = definition.name.value;
    this.typesWithModelDirective.add(typeName);
  };

  validate = () => {};
  prepare = () => {};

  transformSchema = (context: TranformerTransformSchemaStepContextProvider): void => {
    for (let type of this.typesWithModelDirective) {
      const def = context.output.getObject(type);
      const queryFields = this.getQueryFieldNames(context, def!);
      for (let queryField of queryFields.values()) {
        const args = this.getInputs(context, def!, {
          fieldName: queryField.fieldName,
          typeName: queryField.typeName,
          type: queryField.type,
        });
        const field = makeField(queryField.fieldName, args, makeNamedType(def!.name.value));
        context.output.addQueryFields([field]);
      }
    }
  };

  generateResolvers = (context: TransformerContextProvider): void => {
    for (let type of this.typesWithModelDirective) {
      const def = context.output.getObject(type);
      const queryFields = this.getQueryFieldNames(context, def!);

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
    }
  };
  generateDeleteResolver = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
  ): TransformerResolverProvider => {
    const dataSource = this.datasourceMap[typeName];
    const resolverKey = this.generateResolverKey(typeName, fieldName);
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateQueryResolver(typeName, fieldName, dataSource, '{}', '{}');
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
    const resolverKey = this.generateResolverKey(typeName, fieldName);
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateQueryResolver(typeName, fieldName, dataSource, '{}', '{}');
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
    const resolverKey = this.generateResolverKey(typeName, fieldName);
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateQueryResolver(typeName, fieldName, dataSource, '{}', '{}');
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
    const resolverKey = this.generateResolverKey(typeName, fieldName);
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateQueryResolver(typeName, fieldName, dataSource, '{}', '{}');
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
    const resolverKey = this.generateResolverKey(typeName, fieldName);
    if (!this.resolverMap[resolverKey]) {
      this.resolverMap[resolverKey] = ctx.resolvers.generateQueryResolver(typeName, fieldName, dataSource, '{}', '{}');
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
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
  ): Set<{ fieldName: string; typeName: string; type: MutationFieldType }> => {
    // Todo: get fields names from the directives
    const fieldNames: Set<{ fieldName: string; typeName: string; type: MutationFieldType }> = new Set();
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
    switch (operation.type) {
      case QueryFieldType.GET:
        return [makeInputValueDefinition('id', makeNonNullType(makeNamedType('ID')))];

      case QueryFieldType.LIST:
        return [];
      case QueryFieldType.SYNC:
        return [];
    }
    return [];
  };

  private generateResolverKey = (typeName: string, fieldName: string): string => {
    return `${typeName}.${fieldName}`;
  };
}
