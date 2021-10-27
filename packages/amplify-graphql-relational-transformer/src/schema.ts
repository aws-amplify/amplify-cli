import assert from 'assert';
import { makeModelSortDirectionEnumObject } from '@aws-amplify/graphql-model-transformer';
import { TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { DirectiveNode, FieldDefinitionNode, InputObjectTypeDefinitionNode, Kind, ObjectTypeDefinitionNode } from 'graphql';
import {
  blankObject,
  blankObjectExtension,
  extensionWithFields,
  getBaseType,
  isListType,
  isNonNullType,
  isScalar,
  makeField,
  makeInputValueDefinition,
  makeListType,
  makeNamedType,
  makeNonNullType,
  makeScalarKeyConditionForType,
  ModelResourceIDs,
  toCamelCase,
  toUpper,
} from 'graphql-transformer-common';
import { HasManyDirectiveConfiguration, HasOneDirectiveConfiguration, ManyToManyDirectiveConfiguration } from './types';
import { getConnectionAttributeName } from './utils';

export function extendTypeWithConnection(config: HasManyDirectiveConfiguration, ctx: TransformerContextProvider) {
  const { field, object } = config;

  generateModelXConnectionType(config, ctx);

  // Extensions are not allowed to redeclare fields so we must replace it in place.
  const type = ctx.output.getType(object.name.value) as ObjectTypeDefinitionNode;

  assert(type?.kind === Kind.OBJECT_TYPE_DEFINITION || type?.kind === Kind.INTERFACE_TYPE_DEFINITION);

  const newFields = type.fields!.map((f: FieldDefinitionNode) => {
    if (f.name.value === field.name.value) {
      return makeModelConnectionField(config);
    }

    return f;
  });
  const updatedType = {
    ...type,
    fields: newFields,
  };

  ctx.output.putType(updatedType);
  ensureModelSortDirectionEnum(ctx);
  generateFilterAndKeyConditionInputs(config, ctx);
}

function generateModelXConnectionType(
  config: HasManyDirectiveConfiguration | HasOneDirectiveConfiguration,
  ctx: TransformerContextProvider,
): void {
  const { relatedType } = config;
  const tableXConnectionName = ModelResourceIDs.ModelConnectionTypeName(relatedType.name.value);

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

function generateFilterAndKeyConditionInputs(config: HasManyDirectiveConfiguration, ctx: TransformerContextProvider) {
  const { relatedTypeIndex } = config;
  const tableXQueryFilterInput = makeModelXFilterInputObject(config, ctx);

  if (!ctx.output.hasType(tableXQueryFilterInput.name.value)) {
    ctx.output.addInput(tableXQueryFilterInput);
  }

  if (relatedTypeIndex.length === 2) {
    const sortKeyType = relatedTypeIndex[1].type;
    const baseType = getBaseType(sortKeyType);
    const namedType = makeNamedType(baseType);
    const sortKeyConditionInput = makeScalarKeyConditionForType(namedType);

    if (!ctx.output.hasType(sortKeyConditionInput.name.value)) {
      ctx.output.addInput(sortKeyConditionInput);
    }
  }
}

function ensureModelSortDirectionEnum(ctx: TransformerContextProvider): void {
  if (!ctx.output.hasType('ModelSortDirection')) {
    const modelSortDirection = makeModelSortDirectionEnumObject();

    ctx.output.addEnum(modelSortDirection);
  }
}

export function ensureHasOneConnectionField(config: HasOneDirectiveConfiguration, ctx: TransformerContextProvider) {
  const { field, fieldNodes, object } = config;

  // If fields were explicitly provided to the directive, there is nothing else to do here.
  if (fieldNodes.length > 0) {
    return;
  }

  // Update the create and update input objects for this type.
  const connectionAttributeName = getConnectionAttributeName(object.name.value, field.name.value);
  const createInputName = ModelResourceIDs.ModelCreateInputObjectName(object.name.value);
  const createInput = ctx.output.getType(createInputName) as InputObjectTypeDefinitionNode;

  if (createInput) {
    const updated = updateCreateInputWithConnectionField(createInput, connectionAttributeName, isNonNullType(field.type));

    ctx.output.putType(updated);
  }

  const updateInputName = ModelResourceIDs.ModelUpdateInputObjectName(object.name.value);
  const updateInput = ctx.output.getType(updateInputName) as InputObjectTypeDefinitionNode;

  if (updateInput) {
    const updated = updateUpdateInputWithConnectionField(updateInput, connectionAttributeName);

    ctx.output.putType(updated);
  }

  config.connectionFields.push(connectionAttributeName);
}

export function ensureHasManyConnectionField(
  config: HasManyDirectiveConfiguration | ManyToManyDirectiveConfiguration,
  ctx: TransformerContextProvider,
) {
  const { field, fieldNodes, object, relatedType } = config;

  // If fields were explicitly provided to the directive, there is nothing else to do here.
  if (fieldNodes.length > 0) {
    return;
  }

  // Update the create and update input objects for this type.
  const connectionAttributeName = getConnectionAttributeName(object.name.value, field.name.value);
  const createInputName = ModelResourceIDs.ModelCreateInputObjectName(relatedType.name.value);
  const createInput = ctx.output.getType(createInputName) as InputObjectTypeDefinitionNode;

  if (createInput) {
    const updated = updateCreateInputWithConnectionField(createInput, connectionAttributeName, isNonNullType(field.type));

    ctx.output.putType(updated);
  }

  const updateInputName = ModelResourceIDs.ModelUpdateInputObjectName(relatedType.name.value);
  const updateInput = ctx.output.getType(updateInputName) as InputObjectTypeDefinitionNode;

  if (updateInput) {
    const updated = updateUpdateInputWithConnectionField(updateInput, connectionAttributeName);

    ctx.output.putType(updated);
  }

  let connectionFieldName = 'id';

  for (const field of object.fields!) {
    for (const directive of field.directives!) {
      if (directive.name.value === 'primaryKey') {
        connectionFieldName = field.name.value;
        break;
      }
    }
  }

  config.connectionFields.push(connectionFieldName);
}

function updateCreateInputWithConnectionField(
  input: InputObjectTypeDefinitionNode,
  connectionFieldName: string,
  nonNull: boolean = false,
): InputObjectTypeDefinitionNode {
  const keyFieldExists = input.fields!.some(f => f.name.value === connectionFieldName);

  // If the key field already exists then do not change the input.
  if (keyFieldExists) {
    return input;
  }

  const updatedFields = [
    ...input.fields!,
    makeInputValueDefinition(connectionFieldName, nonNull ? makeNonNullType(makeNamedType('ID')) : makeNamedType('ID')),
  ];

  return {
    ...input,
    fields: updatedFields,
  };
}

function updateUpdateInputWithConnectionField(
  input: InputObjectTypeDefinitionNode,
  connectionFieldName: string,
): InputObjectTypeDefinitionNode {
  const keyFieldExists = input.fields!.some(f => f.name.value === connectionFieldName);

  // If the key field already exists then do not change the input.
  if (keyFieldExists) {
    return input;
  }

  const updatedFields = [...input.fields!, makeInputValueDefinition(connectionFieldName, makeNamedType('ID'))];

  return {
    ...input,
    fields: updatedFields,
  };
}

function makeModelConnectionField(config: HasManyDirectiveConfiguration): FieldDefinitionNode {
  const { field, fields, indexName, relatedType, relatedTypeIndex } = config;
  const args = [
    makeInputValueDefinition('filter', makeNamedType(ModelResourceIDs.ModelFilterInputTypeName(relatedType.name.value))),
    makeInputValueDefinition('sortDirection', makeNamedType('ModelSortDirection')),
    makeInputValueDefinition('limit', makeNamedType('Int')),
    makeInputValueDefinition('nextToken', makeNamedType('String')),
  ];

  // Add sort key input if necessary.
  if (fields.length < 2 && relatedTypeIndex.length > 1) {
    let fieldName;
    let namedType;

    if (relatedTypeIndex.length === 2) {
      const sortKeyField = relatedTypeIndex[1];
      const baseType = getBaseType(sortKeyField.type);

      fieldName = sortKeyField.name.value;
      namedType = makeNamedType(ModelResourceIDs.ModelKeyConditionInputTypeName(baseType));
    } else {
      const sortKeyFieldNames = relatedTypeIndex.slice(1).map(field => field.name.value);

      fieldName = toCamelCase(sortKeyFieldNames);
      namedType = makeNamedType(
        ModelResourceIDs.ModelCompositeKeyConditionInputTypeName(relatedType.name.value, toUpper(indexName ?? 'Primary')),
      );
    }

    args.unshift(makeInputValueDefinition(fieldName, namedType));
  }

  return makeField(
    field.name.value,
    args,
    makeNamedType(ModelResourceIDs.ModelConnectionTypeName(relatedType.name.value)),
    field.directives! as DirectiveNode[],
  );
}

function makeModelXFilterInputObject(
  config: HasManyDirectiveConfiguration,
  ctx: TransformerContextProvider,
): InputObjectTypeDefinitionNode {
  const { relatedType } = config;
  const name = ModelResourceIDs.ModelFilterInputTypeName(relatedType.name.value);
  const fields = relatedType
    .fields!.filter((field: FieldDefinitionNode) => {
      const fieldType = ctx.output.getType(getBaseType(field.type));

      return isScalar(field.type) || (fieldType && fieldType.kind === Kind.ENUM_TYPE_DEFINITION);
    })
    .map((field: FieldDefinitionNode) => {
      const baseType = getBaseType(field.type);
      const isList = isListType(field.type);
      let filterTypeName = baseType;

      if (isScalar(field.type) || isList) {
        filterTypeName = isList
          ? ModelResourceIDs.ModelFilterListInputTypeName(baseType, true)
          : ModelResourceIDs.ModelScalarFilterInputTypeName(baseType, false);
      }

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

export function getPartitionKeyField(object: ObjectTypeDefinitionNode): FieldDefinitionNode {
  const fieldMap = new Map<string, FieldDefinitionNode>();
  let name = 'id';

  for (const field of object.fields!) {
    fieldMap.set(field.name.value, field);

    for (const directive of field.directives!) {
      if (directive.name.value === 'primaryKey') {
        name = field.name.value;
        break;
      }
    }
  }

  return fieldMap.get(name)!;
}
