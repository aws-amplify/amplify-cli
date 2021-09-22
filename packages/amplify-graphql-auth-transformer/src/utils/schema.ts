import { ModelDirectiveConfiguration, SubscriptionLevel } from '@aws-amplify/graphql-model-transformer';
import {
  QueryFieldType,
  MutationFieldType,
  TransformerTransformSchemaStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { ObjectTypeDefinitionNode, FieldDefinitionNode, DirectiveNode, NamedTypeNode } from 'graphql';
import {
  blankObjectExtension,
  extendFieldWithDirectives,
  extensionWithDirectives,
  isListType,
  makeInputValueDefinition,
  makeNamedType,
  plurality,
  toCamelCase,
} from 'graphql-transformer-common';
import { RoleDefinition } from './definitions';

export const collectFieldNames = (object: ObjectTypeDefinitionNode): Array<string> => {
  return object.fields!.map((field: FieldDefinitionNode) => field.name.value);
};

export const fieldIsList = (fields: ReadonlyArray<FieldDefinitionNode>, fieldName: string) => {
  return fields.some(field => field.name.value === fieldName && isListType(field.type));
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
