import assert from 'assert';
import { TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import {
  EnumTypeDefinitionNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  ObjectTypeDefinitionNode,
} from 'graphql';
import {
  getBaseType,
  makeCompositeKeyConditionInputForKey,
  makeCompositeKeyInputForKey,
  makeInputValueDefinition,
  makeNamedType,
  makeNonNullType,
  makeScalarKeyConditionForType,
  ModelResourceIDs,
  toCamelCase,
  unwrapNonNull,
  withNamedNodeNamed,
  wrapNonNull,
} from 'graphql-transformer-common';
import { PrimaryKeyDirectiveConfiguration } from './types';
import { lookupResolverName } from './utils';

export function addKeyConditionInputs(config: PrimaryKeyDirectiveConfiguration, ctx: TransformerContextProvider): void {
  const { object, sortKey } = config;

  if (sortKey.length > 1) {
    const keyName = 'Primary';
    const keyConditionInput = makeCompositeKeyConditionInputForKey(object.name.value, keyName, sortKey);

    if (!ctx.output.getType(keyConditionInput.name.value)) {
      ctx.output.addInput(keyConditionInput);
    }

    const compositeKeyInput = makeCompositeKeyInputForKey(object.name.value, keyName, sortKey);

    if (!ctx.output.getType(compositeKeyInput.name.value)) {
      ctx.output.addInput(compositeKeyInput);
    }
  } else if (sortKey.length === 1) {
    const sortKeyField = sortKey[0];
    const typeResolver = (baseType: string) => {
      const resolvedEnumType = ctx.output.getType(baseType) as EnumTypeDefinitionNode;

      return resolvedEnumType ? 'String' : undefined;
    };
    const sortKeyConditionInput = makeScalarKeyConditionForType(sortKeyField.type, typeResolver as (baseType: string) => string);
    assert(sortKeyConditionInput);

    if (!ctx.output.getType(sortKeyConditionInput.name.value)) {
      ctx.output.addInput(sortKeyConditionInput);
    }
  }
}

export function removeAutoCreatedPrimaryKey(config: PrimaryKeyDirectiveConfiguration, ctx: TransformerContextProvider): void {
  const { object } = config;
  const schemaHasIdField = object?.fields?.some(f => f.name.value === 'id');

  if (schemaHasIdField) {
    return;
  }

  const obj = ctx.output.getObject(object.name.value) as ObjectTypeDefinitionNode;
  const fields = obj.fields!.filter((f: FieldDefinitionNode) => f.name.value !== 'id');
  const newObj: ObjectTypeDefinitionNode = {
    ...obj,
    fields,
  };

  ctx.output.updateObject(newObj);
}

export function updateGetField(config: PrimaryKeyDirectiveConfiguration, ctx: TransformerContextProvider): void {
  const resolverName = lookupResolverName(config, ctx, 'get');
  let query = ctx.output.getQuery();

  if (!(resolverName && query)) {
    return;
  }

  const { field, sortKey } = config;
  let resolverField = query.fields!.find((field: FieldDefinitionNode) => field.name.value === resolverName) as FieldDefinitionNode;
  assert(resolverField);
  const args = [
    makeInputValueDefinition(field.name.value, makeNonNullType(makeNamedType(getBaseType(field.type)))),
    ...sortKey.map(keyField => {
      return makeInputValueDefinition(keyField.name.value, makeNonNullType(makeNamedType(getBaseType(keyField.type))));
    }),
  ];

  resolverField = { ...resolverField, arguments: args };
  query = {
    ...query,
    fields: query.fields!.map((field: FieldDefinitionNode) => {
      return field.name.value === resolverField.name.value ? resolverField : field;
    }),
  };
  ctx.output.updateObject(query);
}

export function updateListField(config: PrimaryKeyDirectiveConfiguration, ctx: TransformerContextProvider): void {
  const resolverName = lookupResolverName(config, ctx, 'list');
  let query = ctx.output.getQuery();

  if (!(resolverName && query)) {
    return;
  }

  const { sortKey } = config;
  let listField = query.fields!.find((field: FieldDefinitionNode) => field.name.value === resolverName) as FieldDefinitionNode;
  assert(listField);

  const args = [createHashField(config)];

  if (sortKey.length === 1) {
    args.push(createSimpleSortField(config, ctx));
  } else if (sortKey.length > 1) {
    args.push(createCompositeSortField(config, ctx));
  }

  if (Array.isArray(listField.arguments)) {
    args.push(...listField.arguments);
  }

  args.push(makeInputValueDefinition('sortDirection', makeNamedType('ModelSortDirection')));

  listField = { ...listField, arguments: args };
  query = {
    ...query,
    fields: query.fields!.map((field: FieldDefinitionNode) => {
      return field.name.value === listField.name.value ? listField : field;
    }),
  };
  ctx.output.updateObject(query);
}

export function updateInputObjects(config: PrimaryKeyDirectiveConfiguration, ctx: TransformerContextProvider): void {
  const { object, modelDirective } = config;
  let shouldMakeCreate = true;
  let shouldMakeUpdate = true;
  let shouldMakeDelete = true;

  // Check if @model changes the default behavior.
  for (const argument of modelDirective.arguments!) {
    const arg = argument as any;

    if (arg.name.value === 'mutations' && Array.isArray(arg.value.fields)) {
      for (const argField of arg.value.fields) {
        const op = argField.name.value;
        const val = !!argField.value.value;

        if (op === 'create') {
          shouldMakeCreate = val;
        } else if (op === 'update') {
          shouldMakeUpdate = val;
        } else if (op === 'delete') {
          shouldMakeDelete = val;
        }
      }

      break;
    }
  }

  const hasIdField = object.fields!.some((f: FieldDefinitionNode) => f.name.value === 'id');

  if (!hasIdField) {
    const createInput = ctx.output.getType(ModelResourceIDs.ModelCreateInputObjectName(object.name.value)) as InputObjectTypeDefinitionNode;

    if (createInput && shouldMakeCreate) {
      ctx.output.putType(replaceCreateInput(createInput));
    }
  }

  const updateInput = ctx.output.getType(ModelResourceIDs.ModelUpdateInputObjectName(object.name.value)) as InputObjectTypeDefinitionNode;

  if (updateInput && shouldMakeUpdate) {
    ctx.output.putType(replaceUpdateInput(config, updateInput));
  }

  const deleteInput = ctx.output.getType(ModelResourceIDs.ModelDeleteInputObjectName(object.name.value)) as InputObjectTypeDefinitionNode;

  if (deleteInput && shouldMakeDelete) {
    ctx.output.putType(replaceDeleteInput(config, deleteInput));
  }
}

export function updateMutationConditionInput(config: PrimaryKeyDirectiveConfiguration, ctx: TransformerContextProvider): void {
  const { field, sortKeyFields, object } = config;
  const tableXMutationConditionInputName = ModelResourceIDs.ModelConditionInputTypeName(object.name.value);
  const tableXMutationConditionInput = ctx.output.getType(tableXMutationConditionInputName) as InputObjectTypeDefinitionNode;

  if (!tableXMutationConditionInput) {
    return;
  }

  const fieldNames = new Set(['id', field.name.value, ...sortKeyFields]);
  const updatedInput = {
    ...tableXMutationConditionInput,
    fields: tableXMutationConditionInput.fields!.filter(field => {
      return !fieldNames.has(field.name.value);
    }),
  };

  ctx.output.putType(updatedInput);
}

function createHashField(config: PrimaryKeyDirectiveConfiguration): InputValueDefinitionNode {
  const { field } = config;

  return makeInputValueDefinition(field.name.value, makeNamedType(getBaseType(field.type)));
}

function createSimpleSortField(config: PrimaryKeyDirectiveConfiguration, ctx: TransformerContextProvider): InputValueDefinitionNode {
  const { sortKey } = config;
  assert(sortKey.length === 1);
  const key = sortKey[0];
  const baseType = getBaseType(key.type);
  const resolvedTypeIfEnum = (ctx.output.getType(baseType) as EnumTypeDefinitionNode) ? 'String' : undefined;
  const resolvedType = resolvedTypeIfEnum ?? baseType;

  return makeInputValueDefinition(key.name.value, makeNamedType(ModelResourceIDs.ModelKeyConditionInputTypeName(resolvedType)));
}

function createCompositeSortField(config: PrimaryKeyDirectiveConfiguration, ctx: TransformerContextProvider): InputValueDefinitionNode {
  const { object, sortKeyFields } = config;
  assert(sortKeyFields.length > 1);
  const compositeSortKeyName = toCamelCase(sortKeyFields);

  return makeInputValueDefinition(
    compositeSortKeyName,
    makeNamedType(ModelResourceIDs.ModelCompositeKeyConditionInputTypeName(object.name.value, 'Primary')),
  );
}

function replaceCreateInput(input: InputObjectTypeDefinitionNode): InputObjectTypeDefinitionNode {
  return { ...input, fields: input.fields!.filter(f => f.name.value !== 'id') };
}

function replaceUpdateInput(config: PrimaryKeyDirectiveConfiguration, input: InputObjectTypeDefinitionNode): InputObjectTypeDefinitionNode {
  const { field, object, sortKey } = config;
  const schemaHasIdField = object.fields!.some(f => f.name.value === 'id');
  const keyFields = [field, ...sortKey];
  const inputFields = input.fields!.filter(f => {
    if (!schemaHasIdField && f.name.value === 'id') {
      return false;
    }

    return true;
  });

  return {
    ...input,
    fields: inputFields.map(f => {
      if (keyFields.find(k => k.name.value === f.name.value)) {
        return makeInputValueDefinition(f.name.value, wrapNonNull(withNamedNodeNamed(f.type, getBaseType(f.type))));
      }

      if (f.name.value === 'id') {
        return makeInputValueDefinition(f.name.value, unwrapNonNull(withNamedNodeNamed(f.type, getBaseType(f.type))));
      }

      return f;
    }),
  };
}

function replaceDeleteInput(config: PrimaryKeyDirectiveConfiguration, input: InputObjectTypeDefinitionNode): InputObjectTypeDefinitionNode {
  const { field, sortKey } = config;
  const primaryKeyFields = [field, ...sortKey].map((keyField: FieldDefinitionNode) => {
    return makeInputValueDefinition(keyField.name.value, makeNonNullType(makeNamedType(getBaseType(keyField.type))));
  });
  const existingFields = input.fields!.filter(
    f => !(primaryKeyFields.some(pf => pf.name.value === f.name.value) || (getBaseType(f.type) === 'ID' && f.name.value === 'id')),
  );

  return { ...input, fields: [...primaryKeyFields, ...existingFields] };
}
