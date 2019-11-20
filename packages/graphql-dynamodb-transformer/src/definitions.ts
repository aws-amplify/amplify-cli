import {
  ObjectTypeDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  FieldDefinitionNode,
  Kind,
  TypeNode,
  EnumTypeDefinitionNode,
  ObjectTypeExtensionNode,
  NamedTypeNode,
  DirectiveNode,
  InterfaceTypeDefinitionNode,
  EnumValueDefinitionNode,
} from 'graphql';
import {
  wrapNonNull,
  unwrapNonNull,
  makeNamedType,
  toUpper,
  graphqlName,
  makeListType,
  isScalar,
  getBaseType,
  blankObjectExtension,
  extensionWithFields,
  makeField,
  makeInputValueDefinition,
  ModelResourceIDs,
  makeDirective,
  makeArgument,
  makeValueNode,
  withNamedNodeNamed,
  isListType,
} from 'graphql-transformer-common';
import { TransformerContext } from 'graphql-transformer-core';

const STRING_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'contains', 'notContains', 'between', 'beginsWith'];
const ID_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'contains', 'notContains', 'between', 'beginsWith'];
const INT_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'between'];
const FLOAT_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'between'];
const BOOLEAN_CONDITIONS = ['ne', 'eq'];
const SIZE_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'between'];

const STRING_FUNCTIONS = new Set<string>(['attributeExists', 'attributeType', 'size']);
const ID_FUNCTIONS = new Set<string>(['attributeExists', 'attributeType', 'size']);
const INT_FUNCTIONS = new Set<string>(['attributeExists', 'attributeType']);
const FLOAT_FUNCTIONS = new Set<string>(['attributeExists', 'attributeType']);
const BOOLEAN_FUNCTIONS = new Set<string>(['attributeExists', 'attributeType']);

const ATTRIBUTE_TYPES = ['binary', 'binarySet', 'bool', 'list', 'map', 'number', 'numberSet', 'string', 'stringSet', '_null'];

export function getNonModelObjectArray(
  obj: ObjectTypeDefinitionNode,
  ctx: TransformerContext,
  pMap: Map<string, ObjectTypeDefinitionNode>
): ObjectTypeDefinitionNode[] {
  // loop over all fields in the object, picking out all nonscalars that are not @model types
  for (const field of obj.fields) {
    if (!isScalar(field.type)) {
      const def = ctx.getType(getBaseType(field.type));

      if (
        def &&
        def.kind === Kind.OBJECT_TYPE_DEFINITION &&
        !def.directives.find(e => e.name.value === 'model') &&
        pMap.get(def.name.value) === undefined
      ) {
        // recursively find any non @model types referenced by the current
        // non @model type
        pMap.set(def.name.value, def);
        getNonModelObjectArray(def, ctx, pMap);
      }
    }
  }

  return Array.from(pMap.values());
}

export function makeNonModelInputObject(
  obj: ObjectTypeDefinitionNode,
  nonModelTypes: ObjectTypeDefinitionNode[],
  ctx: TransformerContext
): InputObjectTypeDefinitionNode {
  const name = ModelResourceIDs.NonModelInputObjectName(obj.name.value);
  const fields: InputValueDefinitionNode[] = obj.fields
    .filter((field: FieldDefinitionNode) => {
      const fieldType = ctx.getType(getBaseType(field.type));
      if (
        isScalar(field.type) ||
        nonModelTypes.find(e => e.name.value === getBaseType(field.type)) ||
        (fieldType && fieldType.kind === Kind.ENUM_TYPE_DEFINITION)
      ) {
        return true;
      }
      return false;
    })
    .map((field: FieldDefinitionNode) => {
      const type = nonModelTypes.find(e => e.name.value === getBaseType(field.type))
        ? withNamedNodeNamed(field.type, ModelResourceIDs.NonModelInputObjectName(getBaseType(field.type)))
        : field.type;
      return {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: field.name,
        type,
        // TODO: Service does not support new style descriptions so wait.
        // description: field.description,
        directives: [],
      };
    });
  return {
    kind: 'InputObjectTypeDefinition',
    // TODO: Service does not support new style descriptions so wait.
    // description: {
    //     kind: 'StringValue',
    //     value: `Input type for ${obj.name.value} mutations`
    // },
    name: {
      kind: 'Name',
      value: name,
    },
    fields,
    directives: [],
  };
}

export function makeCreateInputObject(
  obj: ObjectTypeDefinitionNode,
  nonModelTypes: ObjectTypeDefinitionNode[],
  ctx: TransformerContext,
  isSync: boolean = false
): InputObjectTypeDefinitionNode {
  const name = ModelResourceIDs.ModelCreateInputObjectName(obj.name.value);
  const fields: InputValueDefinitionNode[] = obj.fields
    .filter((field: FieldDefinitionNode) => {
      const fieldType = ctx.getType(getBaseType(field.type));
      if (
        isScalar(field.type) ||
        nonModelTypes.find(e => e.name.value === getBaseType(field.type)) ||
        (fieldType && fieldType.kind === Kind.ENUM_TYPE_DEFINITION)
      ) {
        return true;
      }
      return false;
    })
    .map((field: FieldDefinitionNode) => {
      let type: TypeNode;
      if (field.name.value === 'id') {
        // ids are always optional. when provided the value is used.
        // when not provided the value is not used.
        type = {
          kind: Kind.NAMED_TYPE,
          name: {
            kind: Kind.NAME,
            value: 'ID',
          },
        };
      } else {
        type = nonModelTypes.find(e => e.name.value === getBaseType(field.type))
          ? withNamedNodeNamed(field.type, ModelResourceIDs.NonModelInputObjectName(getBaseType(field.type)))
          : field.type;
      }
      return {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: field.name,
        type,
        // TODO: Service does not support new style descriptions so wait.
        // description: field.description,
        directives: [],
      };
    });
  // add the version if this project is a sync project
  if (isSync) {
    fields.push(makeInputValueDefinition('_version', makeNamedType('Int')));
  }
  return {
    kind: 'InputObjectTypeDefinition',
    // TODO: Service does not support new style descriptions so wait.
    // description: {
    //     kind: 'StringValue',
    //     value: `Input type for ${obj.name.value} mutations`
    // },
    name: {
      kind: 'Name',
      value: name,
    },
    fields,
    directives: [],
  };
}

export function makeUpdateInputObject(
  obj: ObjectTypeDefinitionNode,
  nonModelTypes: ObjectTypeDefinitionNode[],
  ctx: TransformerContext,
  isSync: boolean = false
): InputObjectTypeDefinitionNode {
  const name = ModelResourceIDs.ModelUpdateInputObjectName(obj.name.value);
  const fields: InputValueDefinitionNode[] = obj.fields
    .filter(f => {
      const fieldType = ctx.getType(getBaseType(f.type));
      if (
        isScalar(f.type) ||
        nonModelTypes.find(e => e.name.value === getBaseType(f.type)) ||
        (fieldType && fieldType.kind === Kind.ENUM_TYPE_DEFINITION)
      ) {
        return true;
      }
      return false;
    })
    .map((field: FieldDefinitionNode) => {
      let type;
      if (field.name.value === 'id') {
        type = wrapNonNull(field.type);
      } else {
        type = unwrapNonNull(field.type);
      }
      type = nonModelTypes.find(e => e.name.value === getBaseType(field.type))
        ? withNamedNodeNamed(type, ModelResourceIDs.NonModelInputObjectName(getBaseType(field.type)))
        : type;
      return {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: field.name,
        type,
        // TODO: Service does not support new style descriptions so wait.
        // description: field.description,
        directives: [],
      };
    });
  if (isSync) {
    fields.push(makeInputValueDefinition('_version', makeNamedType('Int')));
  }
  return {
    kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
    // TODO: Service does not support new style descriptions so wait.
    // description: {
    //     kind: 'StringValue',
    //     value: `Input type for ${obj.name.value} mutations`
    // },
    name: {
      kind: 'Name',
      value: name,
    },
    fields,
    directives: [],
  };
}

export function makeDeleteInputObject(obj: ObjectTypeDefinitionNode, isSync: boolean = false): InputObjectTypeDefinitionNode {
  const name = ModelResourceIDs.ModelDeleteInputObjectName(obj.name.value);
  const fields: InputValueDefinitionNode[] = [
    {
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: { kind: 'Name', value: 'id' },
      type: makeNamedType('ID'),
      // TODO: Service does not support new style descriptions so wait.
      // description: {
      //     kind: 'StringValue',
      //     value: `The id of the ${obj.name.value} to delete.`
      // },
      directives: [],
    },
  ];
  if (isSync) {
    fields.push(makeInputValueDefinition('_version', makeNamedType('Int')));
  }
  return {
    kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
    // TODO: Service does not support new style descriptions so wait.
    // description: {
    //     kind: 'StringValue',
    //     value: `Input type for ${obj.name.value} delete mutations`
    // },
    name: {
      kind: 'Name',
      value: name,
    },
    fields,
    directives: [],
  };
}

export function makeModelXFilterInputObject(
  obj: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
  ctx: TransformerContext,
  supportsConditions: Boolean
): InputObjectTypeDefinitionNode {
  const name = ModelResourceIDs.ModelFilterInputTypeName(obj.name.value);
  const fields: InputValueDefinitionNode[] = obj.fields
    .filter((field: FieldDefinitionNode) => {
      const fieldType = ctx.getType(getBaseType(field.type));
      if (isScalar(field.type) || (fieldType && fieldType.kind === Kind.ENUM_TYPE_DEFINITION)) {
        return true;
      }
    })
    .map((field: FieldDefinitionNode) => {
      const baseType = getBaseType(field.type);
      const fieldType = ctx.getType(baseType);
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
        // TODO: Service does not support new style descriptions so wait.
        // description: field.description,
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
      type: makeListType(makeNamedType(name)),
      // TODO: Service does not support new style descriptions so wait.
      // description: field.description,
      directives: [],
    },
    {
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: {
        kind: 'Name',
        value: 'or',
      },
      type: makeListType(makeNamedType(name)),
      // TODO: Service does not support new style descriptions so wait.
      // description: field.description,
      directives: [],
    },
    {
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: {
        kind: 'Name',
        value: 'not',
      },
      type: makeNamedType(name),
      // TODO: Service does not support new style descriptions so wait.
      // description: field.description,
      directives: [],
    }
  );

  return {
    kind: 'InputObjectTypeDefinition',
    // TODO: Service does not support new style descriptions so wait.
    // description: {
    //     kind: 'StringValue',
    //     value: `Input type for ${obj.name.value} mutations`
    // },
    name: {
      kind: 'Name',
      value: name,
    },
    fields,
    directives: [],
  };
}

export function makeModelXConditionInputObject(
  obj: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
  ctx: TransformerContext,
  supportsConditions: Boolean
): InputObjectTypeDefinitionNode {
  const name = ModelResourceIDs.ModelConditionInputTypeName(obj.name.value);
  const fields: InputValueDefinitionNode[] = obj.fields
    .filter((field: FieldDefinitionNode) => {
      const fieldType = ctx.getType(getBaseType(field.type));
      if (isScalar(field.type) || (fieldType && fieldType.kind === Kind.ENUM_TYPE_DEFINITION)) {
        return true;
      }
    })
    .map((field: FieldDefinitionNode) => {
      const baseType = getBaseType(field.type);
      const fieldType = ctx.getType(baseType);
      const isList = isListType(field.type);
      const isEnumType = fieldType && fieldType.kind === Kind.ENUM_TYPE_DEFINITION;
      const conditionTypeName =
        isEnumType && isList
          ? ModelResourceIDs.ModelFilterListInputTypeName(baseType, !supportsConditions)
          : ModelResourceIDs.ModelScalarFilterInputTypeName(baseType, !supportsConditions);

      return {
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: field.name,
        type: makeNamedType(conditionTypeName),
        // TODO: Service does not support new style descriptions so wait.
        // description: field.description,
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
      type: makeListType(makeNamedType(name)),
      // TODO: Service does not support new style descriptions so wait.
      // description: field.description,
      directives: [],
    },
    {
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: {
        kind: 'Name',
        value: 'or',
      },
      type: makeListType(makeNamedType(name)),
      // TODO: Service does not support new style descriptions so wait.
      // description: field.description,
      directives: [],
    },
    {
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: {
        kind: 'Name',
        value: 'not',
      },
      type: makeNamedType(name),
      // TODO: Service does not support new style descriptions so wait.
      // description: field.description,
      directives: [],
    }
  );

  return {
    kind: 'InputObjectTypeDefinition',
    // TODO: Service does not support new style descriptions so wait.
    // description: {
    //     kind: 'StringValue',
    //     value: `Input type for ${obj.name.value} mutations`
    // },
    name: {
      kind: 'Name',
      value: name,
    },
    fields,
    directives: [],
  };
}

export function makeEnumFilterInputObjects(
  obj: ObjectTypeDefinitionNode,
  ctx: TransformerContext,
  supportsConditions: Boolean
): InputObjectTypeDefinitionNode[] {
  return obj.fields
    .filter((field: FieldDefinitionNode) => {
      const fieldType = ctx.getType(getBaseType(field.type));
      return fieldType && fieldType.kind === Kind.ENUM_TYPE_DEFINITION;
    })
    .map((enumField: FieldDefinitionNode) => {
      const typeName = getBaseType(enumField.type);
      const isList = isListType(enumField.type);
      const name = isList
        ? ModelResourceIDs.ModelFilterListInputTypeName(typeName, !supportsConditions)
        : ModelResourceIDs.ModelScalarFilterInputTypeName(typeName, !supportsConditions);
      const fields = [];

      fields.push({
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: {
          kind: 'Name',
          value: 'eq',
        },
        type: isList ? makeListType(makeNamedType(typeName)) : makeNamedType(typeName),
        directives: [],
      });

      fields.push({
        kind: Kind.INPUT_VALUE_DEFINITION,
        name: {
          kind: 'Name',
          value: 'ne',
        },
        type: isList ? makeListType(makeNamedType(typeName)) : makeNamedType(typeName),
        directives: [],
      });

      if (isList) {
        fields.push({
          kind: Kind.INPUT_VALUE_DEFINITION,
          name: {
            kind: 'Name',
            value: 'contains',
          },
          type: makeNamedType(typeName),
          directives: [],
        });

        fields.push({
          kind: Kind.INPUT_VALUE_DEFINITION,
          name: {
            kind: 'Name',
            value: 'notContains',
          },
          type: makeNamedType(typeName),
          directives: [],
        });
      }

      return {
        kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
        name: {
          kind: 'Name',
          value: name,
        },
        fields,
        directives: [],
      } as InputObjectTypeDefinitionNode;
    });
}

export function makeModelSortDirectionEnumObject(): EnumTypeDefinitionNode {
  const name = graphqlName('ModelSortDirection');
  return {
    kind: Kind.ENUM_TYPE_DEFINITION,
    name: {
      kind: 'Name',
      value: name,
    },
    values: [
      {
        kind: Kind.ENUM_VALUE_DEFINITION,
        name: { kind: 'Name', value: 'ASC' },
        directives: [],
      },
      {
        kind: Kind.ENUM_VALUE_DEFINITION,
        name: { kind: 'Name', value: 'DESC' },
        directives: [],
      },
    ],
    directives: [],
  };
}

export function makeModelScalarFilterInputObject(type: string, supportsConditions: Boolean): InputObjectTypeDefinitionNode {
  const name = ModelResourceIDs.ModelFilterScalarInputTypeName(type, !supportsConditions);
  const conditions = getScalarConditions(type);
  const fields: InputValueDefinitionNode[] = conditions.map((condition: string) => ({
    kind: Kind.INPUT_VALUE_DEFINITION,
    name: { kind: 'Name' as 'Name', value: condition },
    type: getScalarFilterInputType(condition, type, name),
    // TODO: Service does not support new style descriptions so wait.
    // description: field.description,
    directives: [],
  }));
  let functionInputFields = [];
  if (supportsConditions) {
    functionInputFields = makeFunctionInputFields(type);
  }
  return {
    kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
    // TODO: Service does not support new style descriptions so wait.
    // description: {
    //     kind: 'StringValue',
    //     value: `Input type for ${obj.name.value} mutations`
    // },
    name: {
      kind: 'Name',
      value: name,
    },
    fields: [...fields, ...functionInputFields],
    directives: [],
  };
}

function getScalarFilterInputType(condition: string, type: string, filterInputName: string): TypeNode {
  switch (condition) {
    case 'between':
      return makeListType(makeNamedType(type));
    case 'and':
    case 'or':
      return makeNamedType(filterInputName);
    default:
      return makeNamedType(type);
  }
}

function getScalarConditions(type: string): string[] {
  switch (type) {
    case 'String':
      return STRING_CONDITIONS;
    case 'ID':
      return ID_CONDITIONS;
    case 'Int':
      return INT_CONDITIONS;
    case 'Float':
      return FLOAT_CONDITIONS;
    case 'Boolean':
      return BOOLEAN_CONDITIONS;
    default:
      throw new Error('Valid types are String, ID, Int, Float, Boolean');
  }
}

function makeSizeInputType(): InputObjectTypeDefinitionNode {
  const name = ModelResourceIDs.ModelSizeInputTypeName();
  const fields: InputValueDefinitionNode[] = SIZE_CONDITIONS.map((condition: string) => ({
    kind: Kind.INPUT_VALUE_DEFINITION,
    name: { kind: 'Name' as 'Name', value: condition },
    type: getScalarFilterInputType(condition, 'Int', '' /* unused */),
    // TODO: Service does not support new style descriptions so wait.
    // description: field.description,
    directives: [],
  }));
  return {
    kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
    // TODO: Service does not support new style descriptions so wait.
    // description: {
    //     kind: 'StringValue',
    //     value: `Input type for ${obj.name.value} mutations`
    // },
    name: {
      kind: 'Name',
      value: name,
    },
    fields,
    directives: [],
  };
}

function getFunctionListForType(typeName: string): Set<string> {
  switch (typeName) {
    case 'String':
      return STRING_FUNCTIONS;
    case 'ID':
      return ID_FUNCTIONS;
    case 'Int':
      return INT_FUNCTIONS;
    case 'Float':
      return FLOAT_FUNCTIONS;
    case 'Boolean':
      return BOOLEAN_FUNCTIONS;
    default:
      throw new Error('Valid types are String, ID, Int, Float, Boolean');
  }
}

function makeFunctionInputFields(typeName: string): InputValueDefinitionNode[] {
  const functions = getFunctionListForType(typeName);
  const fields = new Array<InputValueDefinitionNode>();

  if (functions.has('attributeExists')) {
    fields.push({
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: { kind: 'Name' as 'Name', value: 'attributeExists' },
      type: makeNamedType('Boolean'),
      // TODO: Service does not support new style descriptions so wait.
      // description: field.description,
      directives: [],
    });
  }

  if (functions.has('attributeType')) {
    fields.push({
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: { kind: 'Name' as 'Name', value: 'attributeType' },
      type: makeNamedType(ModelResourceIDs.ModelAttributeTypesName()),
      // TODO: Service does not support new style descriptions so wait.
      // description: field.description,
      directives: [],
    });
  }

  if (functions.has('size')) {
    fields.push({
      kind: Kind.INPUT_VALUE_DEFINITION,
      name: { kind: 'Name' as 'Name', value: 'size' },
      type: makeNamedType(ModelResourceIDs.ModelSizeInputTypeName()),
      // TODO: Service does not support new style descriptions so wait.
      // description: field.description,
      directives: [],
    });
  }

  return fields;
}

export function makeAttributeTypeEnum(): EnumTypeDefinitionNode {
  const makeEnumValue = (enumValue: string): EnumValueDefinitionNode => ({
    kind: Kind.ENUM_VALUE_DEFINITION,
    name: { kind: 'Name' as 'Name', value: enumValue },
    directives: [],
  });

  return {
    kind: Kind.ENUM_TYPE_DEFINITION,
    name: { kind: 'Name' as 'Name', value: ModelResourceIDs.ModelAttributeTypesName() },
    values: ATTRIBUTE_TYPES.map(t => makeEnumValue(t)),
    directives: [],
  };
}

export function makeModelConnectionType(typeName: string, isSync: Boolean = false): ObjectTypeExtensionNode {
  const connectionName = ModelResourceIDs.ModelConnectionTypeName(typeName);
  let connectionTypeExtension = blankObjectExtension(connectionName);
  connectionTypeExtension = extensionWithFields(connectionTypeExtension, [makeField('items', [], makeListType(makeNamedType(typeName)))]);
  connectionTypeExtension = extensionWithFields(connectionTypeExtension, [makeField('nextToken', [], makeNamedType('String'))]);
  if (isSync) {
    connectionTypeExtension = extensionWithFields(connectionTypeExtension, [makeField('startedAt', [], makeNamedType('AWSTimestamp'))]);
  }
  return connectionTypeExtension;
}

export function makeSubscriptionField(fieldName: string, returnTypeName: string, mutations: string[]): FieldDefinitionNode {
  return makeField(fieldName, [], makeNamedType(returnTypeName), [
    makeDirective('aws_subscribe', [makeArgument('mutations', makeValueNode(mutations))]),
  ]);
}

export type SortKeyFieldInfoTypeName = 'Composite' | string;

export interface SortKeyFieldInfo {
  // The name of the sort key field.
  fieldName: string;
  // The GraphQL type of the sort key field.
  typeName: SortKeyFieldInfoTypeName;
  // Name of the model this field is on.
  model?: string;
  // The name of the key  that this sortKey is on.
  keyName?: string;
}

export function makeModelConnectionField(
  fieldName: string,
  returnTypeName: string,
  sortKeyInfo?: SortKeyFieldInfo,
  directives?: DirectiveNode[]
): FieldDefinitionNode {
  const args = [
    makeInputValueDefinition('filter', makeNamedType(ModelResourceIDs.ModelFilterInputTypeName(returnTypeName))),
    makeInputValueDefinition('sortDirection', makeNamedType('ModelSortDirection')),
    makeInputValueDefinition('limit', makeNamedType('Int')),
    makeInputValueDefinition('nextToken', makeNamedType('String')),
  ];
  if (sortKeyInfo) {
    let namedType: NamedTypeNode;
    if (sortKeyInfo.typeName === 'Composite') {
      namedType = makeNamedType(ModelResourceIDs.ModelCompositeKeyConditionInputTypeName(sortKeyInfo.model, toUpper(sortKeyInfo.keyName)));
    } else {
      namedType = makeNamedType(ModelResourceIDs.ModelKeyConditionInputTypeName(sortKeyInfo.typeName));
    }

    args.unshift(makeInputValueDefinition(sortKeyInfo.fieldName, namedType));
  }
  return makeField(fieldName, args, makeNamedType(ModelResourceIDs.ModelConnectionTypeName(returnTypeName)), directives);
}

export function makeScalarFilterInputs(supportsConditions: Boolean): InputObjectTypeDefinitionNode[] {
  const inputs = [
    makeModelScalarFilterInputObject('String', supportsConditions),
    makeModelScalarFilterInputObject('ID', supportsConditions),
    makeModelScalarFilterInputObject('Int', supportsConditions),
    makeModelScalarFilterInputObject('Float', supportsConditions),
    makeModelScalarFilterInputObject('Boolean', supportsConditions),
  ];

  if (supportsConditions) {
    inputs.push(makeSizeInputType());
  }

  return inputs;
}
