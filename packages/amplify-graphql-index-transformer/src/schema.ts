import assert from 'assert';
import { makeModelSortDirectionEnumObject } from '@aws-amplify/graphql-model-transformer';
import { TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import {
  EnumTypeDefinitionNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  Kind,
  ObjectTypeDefinitionNode,
} from 'graphql';
import {
  blankObject,
  blankObjectExtension,
  extensionWithFields,
  getBaseType,
  isListType,
  isScalar,
  makeCompositeKeyConditionInputForKey,
  makeCompositeKeyInputForKey,
  makeConnectionField,
  makeField,
  makeInputValueDefinition,
  makeListType,
  makeNamedType,
  makeNonNullType,
  makeScalarKeyConditionForType,
  ModelResourceIDs,
  toCamelCase,
  toUpper,
  unwrapNonNull,
  withNamedNodeNamed,
  wrapNonNull,
} from 'graphql-transformer-common';
import { IndexDirectiveConfiguration, PrimaryKeyDirectiveConfiguration } from './types';
import { lookupResolverName } from './utils';

export function addKeyConditionInputs(
  config: PrimaryKeyDirectiveConfiguration | IndexDirectiveConfiguration,
  ctx: TransformerContextProvider,
): void {
  const { object, sortKey } = config;

  if (sortKey.length > 1) {
    const indexKeyName = (config as IndexDirectiveConfiguration).name;
    const keyName = toUpper(indexKeyName ?? 'Primary');
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
  if (resolverField) {
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
}

export function updateListField(config: PrimaryKeyDirectiveConfiguration, ctx: TransformerContextProvider): void {
  const resolverName = lookupResolverName(config, ctx, 'list');
  let query = ctx.output.getQuery();

  if (!(resolverName && query)) {
    return;
  }

  const { sortKey } = config;
  let listField = query.fields!.find((field: FieldDefinitionNode) => field.name.value === resolverName) as FieldDefinitionNode;
  if (listField) {
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
    ensureModelSortDirectionEnum(ctx);

    listField = { ...listField, arguments: args };
    query = {
      ...query,
      fields: query.fields!.map((field: FieldDefinitionNode) => {
        return field.name.value === listField.name.value ? listField : field;
      }),
    };
    ctx.output.updateObject(query);
  }
}

export function updateInputObjects(config: PrimaryKeyDirectiveConfiguration, ctx: TransformerContextProvider): void {
  const { object, modelDirective } = config;
  let shouldMakeCreate = true;
  let shouldMakeUpdate = true;
  let shouldMakeDelete = true;

  // Check if @model changes the default behavior.
  for (const argument of modelDirective.arguments!) {
    const arg = argument as any;

    if (arg.name.value === 'mutations') {
      if (arg.value.kind === Kind.NULL) {
        shouldMakeCreate = false;
        shouldMakeUpdate = false;
        shouldMakeDelete = false;
      } else if (Array.isArray(arg.value.fields)) {
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

export function updateMutationConditionInput(
  config: PrimaryKeyDirectiveConfiguration | IndexDirectiveConfiguration,
  ctx: TransformerContextProvider,
): void {
  const { field, sortKeyFields, object } = config;
  const tableXMutationConditionInputName = ModelResourceIDs.ModelConditionInputTypeName(object.name.value);
  const tableXMutationConditionInput = ctx.output.getType(tableXMutationConditionInputName) as InputObjectTypeDefinitionNode;

  if (!tableXMutationConditionInput) {
    return;
  }

  const indexName = (config as IndexDirectiveConfiguration).name;
  const fieldNames = new Set(indexName ? ['id'] : ['id', field.name.value, ...sortKeyFields]);
  const updatedInput = {
    ...tableXMutationConditionInput,
    fields: tableXMutationConditionInput.fields!.filter(field => {
      return !fieldNames.has(field.name.value);
    }),
  };

  ctx.output.putType(updatedInput);
}

function createHashField(config: PrimaryKeyDirectiveConfiguration | IndexDirectiveConfiguration): InputValueDefinitionNode {
  const { field } = config;

  return makeInputValueDefinition(field.name.value, makeNamedType(getBaseType(field.type)));
}

function createSimpleSortField(
  config: PrimaryKeyDirectiveConfiguration | IndexDirectiveConfiguration,
  ctx: TransformerContextProvider,
): InputValueDefinitionNode {
  const { sortKey } = config;
  assert(sortKey.length === 1);
  const key = sortKey[0];
  const baseType = getBaseType(key.type);
  const resolvedTypeIfEnum = (ctx.output.getType(baseType) as EnumTypeDefinitionNode) ? 'String' : undefined;
  const resolvedType = resolvedTypeIfEnum ?? baseType;

  return makeInputValueDefinition(key.name.value, makeNamedType(ModelResourceIDs.ModelKeyConditionInputTypeName(resolvedType)));
}

function createCompositeSortField(
  config: PrimaryKeyDirectiveConfiguration | IndexDirectiveConfiguration,
  ctx: TransformerContextProvider,
): InputValueDefinitionNode {
  const { object, sortKeyFields } = config;
  assert(sortKeyFields.length > 1);
  const compositeSortKeyName = toCamelCase(sortKeyFields);
  const indexKeyName = (config as IndexDirectiveConfiguration).name;
  const keyName = toUpper(indexKeyName ?? 'Primary');

  return makeInputValueDefinition(
    compositeSortKeyName,
    makeNamedType(ModelResourceIDs.ModelCompositeKeyConditionInputTypeName(object.name.value, keyName)),
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

export function ensureQueryField(config: IndexDirectiveConfiguration, ctx: TransformerContextProvider): void {
  const { object, queryField, sortKey } = config;

  if (!queryField) {
    return;
  }
  // add query field to metadata
  const keyName = `${object.name.value}:indicies`;
  let indicies: Set<string>;
  if (!ctx.metadata.has(keyName)) {
    indicies = new Set([queryField]);
  } else {
    indicies = ctx.metadata.get<Set<string>>(keyName)!;
    indicies.add(queryField);
  }
  ctx.metadata.set(keyName, indicies);

  const args = [createHashField(config)];

  if (sortKey.length === 1) {
    args.push(createSimpleSortField(config, ctx));
  } else if (sortKey.length > 1) {
    args.push(createCompositeSortField(config, ctx));
  }

  args.push(makeInputValueDefinition('sortDirection', makeNamedType('ModelSortDirection')));

  const queryFieldObj = makeConnectionField(queryField, object.name.value, args);

  ctx.output.addQueryFields([queryFieldObj]);
  ensureModelSortDirectionEnum(ctx);
  generateFilterInputs(config, ctx);
  generateModelXConnectionType(config, ctx);
}

function generateModelXConnectionType(config: IndexDirectiveConfiguration, ctx: TransformerContextProvider): void {
  const { object } = config;
  const tableXConnectionName = ModelResourceIDs.ModelConnectionTypeName(object.name.value);

  if (ctx.output.hasType(tableXConnectionName)) {
    return;
  }

  const connectionType = blankObject(tableXConnectionName);
  let connectionTypeExtension = blankObjectExtension(tableXConnectionName);

  connectionTypeExtension = extensionWithFields(connectionTypeExtension, [
    makeField('items', [], makeListType(makeNamedType(tableXConnectionName))),
  ]);
  connectionTypeExtension = extensionWithFields(connectionTypeExtension, [makeField('nextToken', [], makeNamedType('String'))]);

  ctx.output.addObject(connectionType);
  ctx.output.addObjectExtension(connectionTypeExtension);
}

function ensureModelSortDirectionEnum(ctx: TransformerContextProvider): void {
  if (!ctx.output.hasType('ModelSortDirection')) {
    const modelSortDirection = makeModelSortDirectionEnumObject();

    ctx.output.addEnum(modelSortDirection);
  }
}

function generateFilterInputs(config: IndexDirectiveConfiguration, ctx: TransformerContextProvider): void {
  // Create the ModelXFilterInput
  const tableXQueryFilterInput = makeModelXFilterInputObject(config, ctx);

  if (!ctx.output.hasType(tableXQueryFilterInput.name.value)) {
    ctx.output.addInput(tableXQueryFilterInput);
  }
}

function makeModelXFilterInputObject(config: IndexDirectiveConfiguration, ctx: TransformerContextProvider): InputObjectTypeDefinitionNode {
  const supportsConditions = true;
  const { object } = config;
  const name = ModelResourceIDs.ModelFilterInputTypeName(object.name.value);
  const fields = object
    .fields!.filter((field: FieldDefinitionNode) => {
      const fieldType = ctx.output.getType(getBaseType(field.type));

      return isScalar(field.type) || (fieldType && fieldType.kind === Kind.ENUM_TYPE_DEFINITION);
    })
    .map((field: FieldDefinitionNode) => {
      const baseType = getBaseType(field.type);
      const fieldType = ctx.output.getType(baseType);
      const isList = isListType(field.type);
      const isEnumType = fieldType && fieldType.kind === Kind.ENUM_TYPE_DEFINITION;
      const filterTypeName =
        isEnumType && isList
          ? ModelResourceIDs.ModelFilterListInputTypeName(baseType, !supportsConditions)
          : ModelResourceIDs.ModelScalarFilterInputTypeName(baseType, !supportsConditions);

      return {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: field.name,
        type: makeNamedType(filterTypeName),
        directives: [],
      };
    });

  fields.push(
    {
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: {
        kind: 'Name',
        value: 'and',
      },
      type: makeListType(makeNamedType(name)) as any,
      directives: [],
    },
    {
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: {
        kind: 'Name',
        value: 'or',
      },
      type: makeListType(makeNamedType(name)) as any,
      directives: [],
    },
    {
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: {
        kind: 'Name',
        value: 'not',
      },
      type: makeNamedType(name),
      directives: [],
    },
  );

  return {
    kind: 'InputObjectTypeDefinition',
    name: {
      kind: 'Name',
      value: name,
    },
    fields,
    directives: [],
  };
}
