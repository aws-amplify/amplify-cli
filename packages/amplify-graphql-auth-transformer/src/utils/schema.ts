import { ModelDirectiveConfiguration, SubscriptionLevel } from '@aws-amplify/graphql-model-transformer';
import { DirectiveWrapper, InvalidDirectiveError, TransformerContractError } from '@aws-amplify/graphql-transformer-core';
import {
  QueryFieldType,
  MutationFieldType,
  TransformerTransformSchemaStepContextProvider,
  TransformerContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { DynamoDbDataSource } from '@aws-cdk/aws-appsync';
import { ObjectTypeDefinitionNode, FieldDefinitionNode, DirectiveNode, NamedTypeNode } from 'graphql';
import {
  blankObjectExtension,
  extendFieldWithDirectives,
  extensionWithDirectives,
  graphqlName,
  isListType,
  makeInputValueDefinition,
  makeNamedType,
  ModelResourceIDs,
  plurality,
  toCamelCase,
  toUpper,
} from 'graphql-transformer-common';
import { RELATIONAL_DIRECTIVES } from './constants';
import { RelationalPrimaryMapConfig, RoleDefinition, SearchableConfig } from './definitions';
import md5 from 'md5';

export const collectFieldNames = (object: ObjectTypeDefinitionNode): Array<string> => {
  return object.fields!.map((field: FieldDefinitionNode) => field.name.value);
};

export const fieldIsList = (fields: ReadonlyArray<FieldDefinitionNode>, fieldName: string) => {
  return fields.some(field => field.name.value === fieldName && isListType(field.type));
};

export const getModelConfig = (directive: DirectiveNode, typeName: string, isDataStoreEnabled = false): ModelDirectiveConfiguration => {
  const directiveWrapped: DirectiveWrapper = new DirectiveWrapper(directive);
  const options = directiveWrapped.getArguments<ModelDirectiveConfiguration>({
    queries: {
      get: toCamelCase(['get', typeName]),
      list: toCamelCase(['list', plurality(typeName, true)]),
      ...(isDataStoreEnabled ? { sync: toCamelCase(['sync', plurality(typeName, true)]) } : undefined),
    },
    mutations: {
      create: toCamelCase(['create', typeName]),
      update: toCamelCase(['update', typeName]),
      delete: toCamelCase(['delete', typeName]),
    },
    subscriptions: {
      level: SubscriptionLevel.on,
      onCreate: [ensureValidSubscriptionName(toCamelCase(['onCreate', typeName]))],
      onDelete: [ensureValidSubscriptionName(toCamelCase(['onDelete', typeName]))],
      onUpdate: [ensureValidSubscriptionName(toCamelCase(['onUpdate', typeName]))],
    },
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  });
  return options;
};

export const getSearchableConfig = (directive: DirectiveNode, typeName: string): SearchableConfig | null => {
  const directiveWrapped: DirectiveWrapper = new DirectiveWrapper(directive);
  const options = directiveWrapped.getArguments<SearchableConfig>({
    queries: {
      search: graphqlName(`search${plurality(toUpper(typeName), true)}`),
    },
  });
  return options;
};
/*
 This handles the scenario where a @auth field is also included in the keyschema of a related @model
 since a filter expression cannot contain partition key or sort key attributes. We need to run auth on the query expression
 https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html#Query.FilterExpression
 @hasMany
 - we get the keyschema (default or provided index) and then check that against the fields provided in the argument
 - we then create a map of this relation if the field is included in the directive then we use ctx.source.relatedField
   otherwise we use ctx.args.relatedField
 @hasOne, @belongsTo
 - we check the key schema against the fields provided by the directive
 - if they don't have the same length then we throw an error
 - All of the fields specified are checked against the ctx.source.relatedField
   since this isn't a many relational we don't need to get values from ctx.args
 */
export const getRelationalPrimaryMap = (
  ctx: TransformerContextProvider,
  def: ObjectTypeDefinitionNode,
  field: FieldDefinitionNode,
  relatedModel: ObjectTypeDefinitionNode,
): RelationalPrimaryMapConfig => {
  const relationalDirective = field.directives.find(dir => RELATIONAL_DIRECTIVES.includes(dir.name.value));
  const directiveWrapped: DirectiveWrapper = new DirectiveWrapper(relationalDirective);
  const primaryFieldMap = new Map();
  if (relationalDirective.name.value === 'hasMany') {
    const args = directiveWrapped.getArguments({
      indexName: undefined,
      fields: undefined,
    });
    // we only generate a primary map if a index name or field is specified
    // if both are undefined then @hasMany will create a new gsi with a new readonly field
    // we don't need a primary map since this readonly field is not a auth field
    if (args.indexName || args.fields) {
      // get related types keyschema
      const fields = args.fields ? args.fields : [getTable(ctx, def).keySchema.find((att: any) => att.keyType === 'HASH').attributeName];
      const relatedTable = args.indexName
        ? (getTable(ctx, relatedModel)
            .globalSecondaryIndexes.find((gsi: any) => gsi.indexName === args.indexName)
            .keySchema.map((att: any) => att.attributeName) as Array<string>)
        : (getTable(ctx, relatedModel).keySchema.map((att: any) => att.attributeName) as Array<string>);
      relatedTable.forEach((att, idx) => {
        primaryFieldMap.set(att, {
          claim: fields[idx] ? 'source' : 'args',
          field: fields[idx] ?? att,
        });
      });
    }
  } // manyToMany doesn't need a primaryMap since it will create it's own gsis
  // to the join table between related @models
  else if (relationalDirective.name.value !== 'manyToMany') {
    const args = directiveWrapped.getArguments({
      fields: [toCamelCase([def.name.value, field.name.value, 'id'])],
    });
    // get related types keyschema
    const relatedPrimaryFields = getTable(ctx, relatedModel).keySchema.map((att: any) => att.attributeName) as Array<string>;
    // the fields provided by the directive (implicit/explicit) need to match the total amount of fields used for the primary key in the related table
    // otherwise the get request is incomplete
    if (args.fields.length !== relatedPrimaryFields.length) {
      throw new InvalidDirectiveError(
        `Invalid @${relationalDirective.name.value} on ${def.name.value}:${field.name.value}. Provided fields do not match the size of primary key(s) for ${relatedModel.name.value}`,
      );
    }
    relatedPrimaryFields.forEach((field, idx) => {
      primaryFieldMap.set(field, {
        claim: 'source',
        field: args.fields[idx],
      });
    });
  }
  return primaryFieldMap;
};

export const hasRelationalDirective = (field: FieldDefinitionNode): boolean => {
  return field.directives && field.directives.some(dir => RELATIONAL_DIRECTIVES.includes(dir.name.value));
};

export const getTable = (ctx: TransformerContextProvider, def: ObjectTypeDefinitionNode): any => {
  try {
    const dbSource = ctx.dataSources.get(def) as DynamoDbDataSource;
    const tableName = ModelResourceIDs.ModelTableResourceID(def.name.value);
    return dbSource.ds.stack.node.findChild(tableName) as any;
  } catch (err) {
    throw new TransformerContractError(`Could not load primary fields of @model: ${def.name.value}`);
  }
};

export const extendTypeWithDirectives = (
  ctx: TransformerTransformSchemaStepContextProvider,
  typeName: string,
  directives: Array<DirectiveNode>,
): void => {
  let objectTypeExtension = blankObjectExtension(typeName);
  objectTypeExtension = extensionWithDirectives(objectTypeExtension, directives);
  ctx.output.addObjectExtension(objectTypeExtension);
};

export const addDirectivesToField = (
  ctx: TransformerTransformSchemaStepContextProvider,
  typeName: string,
  fieldName: string,
  directives: Array<DirectiveNode>,
) => {
  const type = ctx.output.getType(typeName) as ObjectTypeDefinitionNode;
  if (type) {
    const field = type.fields?.find(f => f.name.value === fieldName);
    if (field) {
      const newFields = [...type.fields!.filter(f => f.name.value !== field.name.value), extendFieldWithDirectives(field, directives)];

      const newType = {
        ...type,
        fields: newFields,
      };

      ctx.output.putType(newType);
    }
  }
};

export const addSubscriptionArguments = (
  ctx: TransformerTransformSchemaStepContextProvider,
  operationName: string,
  subscriptionRoles: Array<RoleDefinition>,
) => {
  let subscription = ctx.output.getSubscription()!;
  let createField: FieldDefinitionNode = subscription!.fields!.find(field => field.name.value === operationName) as FieldDefinitionNode;
  const subcriptionArgumentList = subscriptionRoles.map(role => {
    return makeInputValueDefinition(role.entity!, makeNamedType('String'));
  });
  createField = {
    ...createField,
    arguments: subcriptionArgumentList,
  };
  subscription = {
    ...subscription,
    fields: subscription!.fields!.map(field => (field.name.value === operationName ? createField : field)),
  };
  ctx.output.putType(subscription);
};

export const addDirectivesToOperation = (
  ctx: TransformerTransformSchemaStepContextProvider,
  typeName: string,
  operationName: string,
  directives: Array<DirectiveNode>,
) => {
  // add directives to the given operation
  addDirectivesToField(ctx, typeName, operationName, directives);

  // add the directives to the result type of the operation
  const type = ctx.output.getType(typeName) as ObjectTypeDefinitionNode;
  if (type) {
    const field = type.fields!.find(f => f.name.value === operationName);

    if (field) {
      const returnFieldType = field.type as NamedTypeNode;

      if (returnFieldType.name) {
        const returnTypeName = returnFieldType.name.value;

        extendTypeWithDirectives(ctx, returnTypeName, directives);
      }
    }
  }
};

export const getQueryFieldNames = (
  modelDirectiveConfig: ModelDirectiveConfiguration,
): Set<{ fieldName: string; typeName: string; type: QueryFieldType }> => {
  const fields: Set<{ fieldName: string; typeName: string; type: QueryFieldType }> = new Set();
  if (modelDirectiveConfig?.queries?.get) {
    fields.add({
      typeName: 'Query',
      fieldName: modelDirectiveConfig.queries.get,
      type: QueryFieldType.GET,
    });
  }

  if (modelDirectiveConfig?.queries?.list) {
    fields.add({
      typeName: 'Query',
      fieldName: modelDirectiveConfig.queries.list,
      type: QueryFieldType.LIST,
    });
  }

  if (modelDirectiveConfig?.queries?.sync) {
    fields.add({
      typeName: 'Query',
      fieldName: modelDirectiveConfig.queries.sync,
      type: QueryFieldType.SYNC,
    });
  }
  return fields;
};

export const getMutationFieldNames = (
  modelDirectiveConfig: ModelDirectiveConfiguration,
): Set<{ fieldName: string; typeName: string; type: MutationFieldType }> => {
  // Todo: get fields names from the directives
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

export const getSubscriptionFieldNames = (
  modelDirectiveConfig: ModelDirectiveConfiguration,
): Set<{
  fieldName: string;
  typeName: string;
}> => {
  const fields: Set<{
    fieldName: string;
    typeName: string;
  }> = new Set();

  if (modelDirectiveConfig?.subscriptions?.level === SubscriptionLevel.on) {
    if (modelDirectiveConfig?.subscriptions?.onCreate && modelDirectiveConfig.mutations?.create) {
      for (const fieldName of modelDirectiveConfig.subscriptions.onCreate) {
        fields.add({
          typeName: 'Subscription',
          fieldName: fieldName,
        });
      }
    }

    if (modelDirectiveConfig?.subscriptions?.onUpdate && modelDirectiveConfig.mutations?.update) {
      for (const fieldName of modelDirectiveConfig.subscriptions.onUpdate) {
        fields.add({
          typeName: 'Subscription',
          fieldName: fieldName,
        });
      }
    }

    if (modelDirectiveConfig?.subscriptions?.onDelete && modelDirectiveConfig.mutations?.delete) {
      for (const fieldName of modelDirectiveConfig.subscriptions.onDelete) {
        fields.add({
          typeName: 'Subscription',
          fieldName: fieldName,
        });
      }
    }
  }

  return fields;
};

const ensureValidSubscriptionName = (name: string): string => {
  if (name.length <= 50) return name;

  return name.slice(0, 45) + md5(name).slice(0, 5);
};
