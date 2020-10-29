import { TranformerTransformSchemaStepContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import {
  EnumTypeDefinitionNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  Kind,
  ObjectTypeDefinitionNode,
  TypeDefinitionNode,
} from 'graphql';
import {
  DEFAULT_SCALARS,
  graphqlName,
  makeArgument,
  makeDirective,
  makeField,
  makeNamedType,
  makeValueNode,
  ModelResourceIDs,
  toPascalCase,
} from 'graphql-transformer-common';
import {
  ATTRIBUTE_TYPES,
  BOOLEAN_CONDITIONS,
  BOOLEAN_FUNCTIONS,
  FLOAT_CONDITIONS,
  FLOAT_FUNCTIONS,
  ID_CONDITIONS,
  ID_FUNCTIONS,
  INT_CONDITIONS,
  INT_FUNCTIONS,
  SIZE_CONDITIONS,
  STRING_CONDITIONS,
  STRING_FUNCTIONS,
} from '../definitions';
import { ModelDirectiveConfiguration } from '../graphql-model-transformer';
import { EnumWrapper, InputFieldWraper, InputObjectDefinationWrapper, ObjectDefinationWrapper } from '../wrappers/object-defination-wrapper';

/**
 * Creates the condition input for a model
 * @param ctx TransformerContext
 * @param name model name
 * @param object ModelObjectDefination
 */
export const makeMutationConditionInput = (
  ctx: TranformerTransformSchemaStepContextProvider,
  name: string,
  object: ObjectTypeDefinitionNode,
): InputObjectTypeDefinitionNode => {
  const input = InputObjectDefinationWrapper.create(name);
  const wrappedObject = new ObjectDefinationWrapper(object);
  for (let field of wrappedObject.fields) {
    const fieldType = ctx.output.getType(field.getTypeName());
    const isEnumType = fieldType && fieldType.kind === 'EnumTypeDefinition';
    const idField = field.name === 'id' && field.getTypeName() === 'ID';
    if (!idField && (field.isScalar() || isEnumType)) {
      const fieldTypeName = field.getTypeName();
      const nameOverride = DEFAULT_SCALARS[fieldTypeName] || fieldTypeName;
      const conditionTypeName = isEnumType && field.isList() ? `Model${nameOverride}ListInput` : `Model${nameOverride}Input`;
      const inputField = InputFieldWraper.create(field.name, conditionTypeName, true);
      input.addField(inputField);
    }
  }

  // additional conditions of list type
  for (let additionalField of ['and', 'or']) {
    const inputField = InputFieldWraper.create(additionalField, name, true, true);
    input.addField(inputField);
  }
  // additional conditions of non-list type
  for (let additionalField of ['not']) {
    const inputField = InputFieldWraper.create(additionalField, name, true, false);
    input.addField(inputField);
  }
  return input.serialize();
};

export const addModelConditionInputs = (ctx: TranformerTransformSchemaStepContextProvider): void => {
  const conditionsInput: TypeDefinitionNode[] = ['String', 'Int', 'Float', 'Boolean', 'ID'].map(scalarName =>
    makeModelScalarFilterInputObject(scalarName, true),
  );
  conditionsInput.push(makeAttributeTypeEnum());
  conditionsInput.push(makeSizeInputType());
  conditionsInput.forEach(input => {
    const inputName = input.name.value;
    if (!ctx.output.getType(inputName)) {
      ctx.output.addType(input);
    }
  });
};

/**
 *
 * @param typeName Name of the scarlar type
 * @param includeFilter add filter suffix to input
 */
export function generateModelScalarFilterInputName(typeName: string, includeFilter: Boolean): string {
  const nameOverride = DEFAULT_SCALARS[typeName];
  if (nameOverride) {
    return `Model${nameOverride}${includeFilter ? 'Filter' : ''}Input`;
  }
  return `Model${typeName}${includeFilter ? 'Filter' : ''}Input`;
}
export const createEnumModelFilters = (
  ctx: TranformerTransformSchemaStepContextProvider,
  type: ObjectTypeDefinitionNode,
): InputObjectTypeDefinitionNode[] => {
  // add enum type if present
  const typeWrapper = new ObjectDefinationWrapper(type);
  const enumFields = typeWrapper.fields.filter(field => {
    const typeName = field.getTypeName();
    const typeObj = ctx.output.getType(typeName);
    return typeObj && typeObj.kind === 'EnumTypeDefinition';
  });
  return enumFields.map(field => makeEnumFilterInput(field.getTypeName()));
};

/**
 * Generate Scalar Condition/Filter input for known scalar types
 * @param type scalar type name
 * @param supportsConditions add filter suffix to input
 */
export function makeModelScalarFilterInputObject(type: string, supportsConditions: Boolean): InputObjectTypeDefinitionNode {
  const name = ModelResourceIDs.ModelFilterScalarInputTypeName(type, !supportsConditions);
  const conditions = getScalarConditions(type);
  const scalarConditionInput = InputObjectDefinationWrapper.create(name);
  for (let condition of conditions) {
    let typeName;
    switch (condition) {
      case 'and':
      case 'or':
        typeName = name;
        break;
      default:
        typeName = type;
    }
    const field = InputFieldWraper.create(condition, typeName, true);
    if (condition === 'between') {
      field.wrapListType();
    }
    scalarConditionInput.addField(field);
  }
  makeFunctionInputFields(type).map(f => scalarConditionInput.addField(f));
  return scalarConditionInput.serialize();
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

function makeFunctionInputFields(typeName: string): InputFieldWraper[] {
  const functions = getFunctionListForType(typeName);
  const fields = new Array<InputFieldWraper>();

  if (functions.has('attributeExists')) {
    fields.push(InputFieldWraper.create('attributeExists', 'Boolean', true));
  }

  if (functions.has('attributeType')) {
    fields.push(InputFieldWraper.create('attributeType', 'ModelAttributeTypes', true));
  }

  if (functions.has('size')) {
    fields.push(InputFieldWraper.create('size', 'ModelSizeInput', true));
  }

  return fields;
}

export function makeAttributeTypeEnum(): EnumTypeDefinitionNode {
  return EnumWrapper.create('ModelAttributeTypes', ATTRIBUTE_TYPES).serialize();
}

export function makeSubscriptionField(fieldName: string, returnTypeName: string, mutations: string[]): FieldDefinitionNode {
  return makeField(fieldName, [], makeNamedType(returnTypeName), [
    makeDirective('aws_subscribe', [makeArgument('mutations', makeValueNode(mutations))]),
  ]);
}

export function makeSizeInputType(): InputObjectTypeDefinitionNode {
  const name = 'ModelSizeInput';
  const input = InputObjectDefinationWrapper.create(name);

  for (let condition of SIZE_CONDITIONS) {
    const field = InputFieldWraper.create(condition, 'Int', true);
    if (condition === 'between') field.wrapListType();
    input.addField(field);
  }
  return input.serialize();
}

export function makeEnumFilterInput(name: string): InputObjectTypeDefinitionNode {
  const inputName = toPascalCase(['Model', name, 'Input']);
  const input = InputObjectDefinationWrapper.create(inputName);
  ['eq', 'ne'].forEach(fieldName => {
    const field = InputFieldWraper.create(fieldName, name, true);
    input.addField(field);
  });
  return input.serialize();
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
