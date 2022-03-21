import assert from 'assert';
import { makeModelSortDirectionEnumObject } from '@aws-amplify/graphql-model-transformer';
import { TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import {
  DirectiveNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  Kind,
  ListValueNode,
  NamedTypeNode,
  ObjectTypeDefinitionNode,
  StringValueNode,
} from 'graphql';
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
  toPascalCase,
  toUpper,
  wrapNonNull,
} from 'graphql-transformer-common';
import { getSortKeyFieldNames } from '@aws-amplify/graphql-transformer-core/lib/utils/schema-utils';
import {
  BelongsToDirectiveConfiguration,
  HasManyDirectiveConfiguration,
  HasOneDirectiveConfiguration,
  ManyToManyDirectiveConfiguration,
} from './types';
import { getConnectionAttributeName } from './utils';

/**
 * extendTypeWithConnection
 */
export const extendTypeWithConnection = (config: HasManyDirectiveConfiguration, ctx: TransformerContextProvider): void => {
  const { field, object } = config;

  generateModelXConnectionType(config, ctx);

  // Extensions are not allowed to re-declare fields so we must replace it in place.
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
};

const generateModelXConnectionType = (
  config: HasManyDirectiveConfiguration | HasOneDirectiveConfiguration,
  ctx: TransformerContextProvider,
): void => {
  const { relatedType } = config;
  const tableXConnectionName = ModelResourceIDs.ModelConnectionTypeName(relatedType.name.value);

  if (ctx.output.hasType(tableXConnectionName)) {
    return;
  }

  const connectionType = blankObject(tableXConnectionName);
  let connectionTypeExtension = blankObjectExtension(tableXConnectionName);

  connectionTypeExtension = extensionWithFields(connectionTypeExtension, [
    makeField('items', [], makeNonNullType(makeListType(makeNamedType(relatedType.name.value)))),
  ]);
  connectionTypeExtension = extensionWithFields(connectionTypeExtension, [makeField('nextToken', [], makeNamedType('String'))]);

  ctx.output.addObject(connectionType);
  ctx.output.addObjectExtension(connectionTypeExtension);
};

const generateFilterAndKeyConditionInputs = (config: HasManyDirectiveConfiguration, ctx: TransformerContextProvider): void => {
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
};

const ensureModelSortDirectionEnum = (ctx: TransformerContextProvider): void => {
  if (!ctx.output.hasType('ModelSortDirection')) {
    const modelSortDirection = makeModelSortDirectionEnumObject();
    ctx.output.addEnum(modelSortDirection);
  }
};

/**
 * ensureHasOneConnectionField
 */
export const ensureHasOneConnectionField = (config: HasOneDirectiveConfiguration, ctx: TransformerContextProvider): void => {
  const { field, fieldNodes, object } = config;

  // If fields were explicitly provided to the directive, there is nothing else to do here.
  if (fieldNodes.length > 0) {
    return;
  }

  const connectionAttributeName = getConnectionAttributeName(object.name.value, field.name.value);

  const typeObject = ctx.output.getType(object.name.value) as ObjectTypeDefinitionNode;
  if (typeObject) {
    ctx.output.putType({
      ...typeObject,
      fields: [
        ...typeObject.fields!,
        ...getTypeFieldsWithConnectionField([...typeObject.fields!], connectionAttributeName, isNonNullType(field.type)),
      ],
    });
  }

  const createInputName = ModelResourceIDs.ModelCreateInputObjectName(object.name.value);
  const createInput = ctx.output.getType(createInputName) as InputObjectTypeDefinitionNode;

  if (createInput) {
    ctx.output.putType({
      ...createInput,
      fields: [
        ...createInput.fields!,
        ...getInputFieldsWithConnectionField([...createInput.fields!], connectionAttributeName, isNonNullType(field.type)),
      ],
    });
  }

  const updateInputName = ModelResourceIDs.ModelUpdateInputObjectName(object.name.value);
  const updateInput = ctx.output.getType(updateInputName) as InputObjectTypeDefinitionNode;

  if (updateInput) {
    ctx.output.putType({
      ...updateInput,
      fields: [
        ...updateInput.fields!,
        ...getInputFieldsWithConnectionField([...updateInput.fields!], connectionAttributeName, isNonNullType(field.type)),
      ],
    });
  }

  const filterInputName = toPascalCase(['Model', object.name.value, 'FilterInput']);
  const filterInput = ctx.output.getType(filterInputName) as InputObjectTypeDefinitionNode;
  if (filterInput) {
    ctx.output.putType({
      ...filterInput,
      fields: [
        ...filterInput.fields!,
        ...getFilterConnectionInputFieldsWithConnectionField([...filterInput.fields!], connectionAttributeName),
      ],
    });
  }

  const conditionInputName = toPascalCase(['Model', object.name.value, 'ConditionInput']);
  const conditionInput = ctx.output.getType(conditionInputName) as InputObjectTypeDefinitionNode;
  if (conditionInput) {
    ctx.output.putType({
      ...conditionInput,
      fields: [
        ...filterInput.fields!,
        ...getFilterConnectionInputFieldsWithConnectionField([...conditionInput.fields!], connectionAttributeName),
      ],
    });
  }
  config.connectionFields.push(connectionAttributeName);
};

/**
 * If the related type is a hasOne relationship, this creates a hasOne relation going the other way
 *    but using the same foreign key name as the hasOne model
 * If the related type is a hasMany relationship, this function sets the foreign key name to the name of the hasMany foreign key
 *    but does not add additional fields as this will be handled by the hasMany directive
 */
export const ensureBelongsToConnectionField = (config: BelongsToDirectiveConfiguration, ctx: TransformerContextProvider): void => {
  const { relationType, relatedType, relatedField } = config;
  if (relationType === 'hasOne') {
    ensureHasOneConnectionField(config, ctx);
  } else {
    // hasMany
    config.connectionFields.push(getConnectionAttributeName(relatedType.name.value, relatedField.name.value));
    config.connectionFields.push(...getSortKeyFieldNames(relatedType));
  }
};

/**
 * ensureHasManyConnectionField
 */
export const ensureHasManyConnectionField = (
  config: HasManyDirectiveConfiguration | ManyToManyDirectiveConfiguration,
  ctx: TransformerContextProvider,
): void => {
  const {
    field, fieldNodes, object, relatedType,
  } = config;

  // If fields were explicitly provided to the directive, there is nothing else to do here.
  if (fieldNodes.length > 0) {
    return;
  }

  let connectionFieldName = 'id';
  const sortKeyFields = getSortKeyFields(ctx, object);

  object.fields!.forEach(objectField => {
    objectField.directives!.forEach(directive => {
      if (directive.name.value === 'primaryKey') {
        connectionFieldName = objectField.name.value;
      }
    });
  });

  config.connectionFields.push(connectionFieldName, ...sortKeyFields.map(it => it.name.value));

  const connectionAttributeName = getConnectionAttributeName(object.name.value, field.name.value);

  const relatedTypeObject = ctx.output.getType(relatedType.name.value) as ObjectTypeDefinitionNode;
  if (relatedTypeObject) {
    const updatedFields = [...relatedTypeObject.fields!];
    updatedFields.push(...getTypeFieldsWithConnectionField(updatedFields, connectionAttributeName, isNonNullType(field.type)));
    sortKeyFields.forEach(it => {
      updatedFields.push(...getTypeFieldsWithConnectionField(updatedFields,
        getConnectionAttributeName(object.name.value, it.name.value),
        isNonNullType(field.type)));
    });
    ctx.output.putType({
      ...relatedTypeObject,
      fields: updatedFields,
    });
  }

  const createInputName = ModelResourceIDs.ModelCreateInputObjectName(relatedType.name.value);
  const createInput = ctx.output.getType(createInputName) as InputObjectTypeDefinitionNode;

  if (createInput) {
    const updatedFields = [...createInput.fields!];
    updatedFields.push(...getInputFieldsWithConnectionField(updatedFields, connectionAttributeName, isNonNullType(field.type)));
    sortKeyFields.forEach(it => {
      updatedFields.push(...getInputFieldsWithConnectionField(updatedFields,
        getConnectionAttributeName(object.name.value, it.name.value),
        isNonNullType(field.type)));
    });
    ctx.output.putType({
      ...createInput,
      fields: updatedFields,
    });
  }

  const updateInputName = ModelResourceIDs.ModelUpdateInputObjectName(relatedType.name.value);
  const updateInput = ctx.output.getType(updateInputName) as InputObjectTypeDefinitionNode;

  if (updateInput) {
    const updatedFields = [...updateInput.fields!];
    updatedFields.push(...getInputFieldsWithConnectionField(updatedFields, connectionAttributeName, isNonNullType(field.type)));
    sortKeyFields.forEach(it => {
      updatedFields.push(...getInputFieldsWithConnectionField(updatedFields,
        getConnectionAttributeName(object.name.value, it.name.value),
        isNonNullType(field.type)));
    });
    ctx.output.putType({
      ...updateInput,
      fields: updatedFields,
    });
  }

  const filterInputName = toPascalCase(['Model', relatedType.name.value, 'FilterInput']);
  const filterInput = ctx.output.getType(filterInputName) as InputObjectTypeDefinitionNode;
  if (filterInput) {
    const updatedFields = [...filterInput.fields!];
    updatedFields.push(...getFilterConnectionInputFieldsWithConnectionField(updatedFields, connectionAttributeName));
    sortKeyFields.forEach(it => {
      updatedFields.push(...getFilterConnectionInputFieldsWithConnectionField(updatedFields,
        getConnectionAttributeName(object.name.value, it.name.value)));
    });
    ctx.output.putType({
      ...filterInput,
      fields: updatedFields,
    });
  }

  const conditionInputName = toPascalCase(['Model', relatedType.name.value, 'ConditionInput']);
  const conditionInput = ctx.output.getType(conditionInputName) as InputObjectTypeDefinitionNode;
  if (conditionInput) {
    const updatedFields = [...conditionInput.fields!];
    updatedFields.push(...getFilterConnectionInputFieldsWithConnectionField(updatedFields, connectionAttributeName));
    sortKeyFields.forEach(it => {
      updatedFields.push(...getFilterConnectionInputFieldsWithConnectionField(updatedFields,
        getConnectionAttributeName(object.name.value, it.name.value)));
    });
    ctx.output.putType({
      ...conditionInput,
      fields: updatedFields,
    });
  }
};

const getTypeFieldsWithConnectionField = (
  objectFields: FieldDefinitionNode[],
  connectionFieldName: string,
  nonNull = false,
): FieldDefinitionNode[] => {
  const keyFieldExists = objectFields.some(f => f.name.value === connectionFieldName);

  // If the key field already exists then do not change the input.
  if (keyFieldExists) {
    return [];
  }

  return [makeField(connectionFieldName, [], nonNull ? makeNonNullType(makeNamedType('ID')) : makeNamedType('ID'), [])];
};

const getInputFieldsWithConnectionField = (
  inputFields: InputValueDefinitionNode[],
  connectionFieldName: string,
  nonNull = false,
): InputValueDefinitionNode[] => {
  const keyFieldExists = inputFields.some(f => f.name.value === connectionFieldName);

  // If the key field already exists then do not change the input.
  if (keyFieldExists) {
    return [];
  }

  return [makeInputValueDefinition(connectionFieldName, nonNull ? makeNonNullType(makeNamedType('ID')) : makeNamedType('ID'))];
};

const getFilterConnectionInputFieldsWithConnectionField = (
  inputFields: InputValueDefinitionNode[],
  connectionFieldName: string,
): InputValueDefinitionNode[] => {
  const keyFieldExists = inputFields.some(f => f.name.value === connectionFieldName);

  // If the key field already exists then do not change the input.
  if (keyFieldExists) {
    return [];
  }

  return [makeInputValueDefinition(connectionFieldName, makeNamedType('ModelIDInput'))];
};

const makeModelConnectionField = (config: HasManyDirectiveConfiguration): FieldDefinitionNode => {
  const {
    field, fields, indexName, relatedType, relatedTypeIndex,
  } = config;
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
      const sortKeyFieldNames = relatedTypeIndex.slice(1).map(relatedTypeField => relatedTypeField.name.value);

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
};

const makeModelXFilterInputObject = (
  config: HasManyDirectiveConfiguration,
  ctx: TransformerContextProvider,
): InputObjectTypeDefinitionNode => {
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
      const fieldType = ctx.output.getType(getBaseType(field.type));
      let filterTypeName = baseType;

      if (isScalar(field.type) || (fieldType && fieldType.kind === Kind.ENUM_TYPE_DEFINITION)) {
        filterTypeName = ModelResourceIDs.ModelScalarFilterInputTypeName(baseType, false);
      } else if (isList) {
        filterTypeName = ModelResourceIDs.ModelFilterListInputTypeName(baseType, true);
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
      type: makeListType(makeNamedType(name)) as unknown as NamedTypeNode,
      directives: [],
    },
    {
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: {
        kind: 'Name',
        value: 'or',
      },
      type: makeListType(makeNamedType(name)) as unknown as NamedTypeNode,
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
};

/**
 * getPartitionKeyField
 */
export const getPartitionKeyField = (ctx: TransformerContextProvider, object: ObjectTypeDefinitionNode): FieldDefinitionNode => {
  const outputObject = ctx.output.getType(object.name.value) as ObjectTypeDefinitionNode;
  assert(outputObject);
  const fieldMap = new Map<string, FieldDefinitionNode>();
  let name = 'id';

  outputObject.fields!.forEach(field => {
    fieldMap.set(field.name.value, field);

    field.directives!.forEach(directive => {
      if (directive.name.value === 'primaryKey') {
        name = field.name.value;
      }
    });
  });

  return fieldMap.get(name) ?? makeField('id', [], wrapNonNull(makeNamedType('ID')));
};

/**
 * getSortKeyFields
 */
export const getSortKeyFields = (ctx: TransformerContextProvider, object: ObjectTypeDefinitionNode): FieldDefinitionNode[] => {
  const outputObject = ctx.output.getType(object.name.value) as ObjectTypeDefinitionNode;
  assert(outputObject);
  const fieldMap = new Map<string, FieldDefinitionNode>();

  outputObject.fields!.forEach(field => {
    fieldMap.set(field.name.value, field);
  });

  const sortKeyFields: FieldDefinitionNode[] = [];
  outputObject.fields!.forEach(field => {
    field.directives!.forEach(directive => {
      if (directive.name.value === 'primaryKey') {
        const values = directive.arguments?.find(arg => arg.name.value === 'sortKeyFields')?.value as ListValueNode;
        if (values) {
          sortKeyFields.push(...values.values.map(val => fieldMap.get((val as StringValueNode).value)!));
        }
      }
    });
  });

  return sortKeyFields;
};
