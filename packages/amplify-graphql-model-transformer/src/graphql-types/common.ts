import { TransformerContextProvider, TransformerTransformSchemaStepContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import {
  DirectiveNode,
  EnumTypeDefinitionNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  Kind,
  NamedTypeNode,
  ObjectTypeDefinitionNode,
  TypeDefinitionNode,
} from 'graphql';
import {
  blankObjectExtension,
  DEFAULT_SCALARS,
  extendFieldWithDirectives,
  extensionWithDirectives,
  getBaseType,
  makeArgument,
  makeDirective,
  makeField,
  makeNamedType,
  makeValueNode,
  ModelResourceIDs,
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
  API_KEY_DIRECTIVE,
} from '../definitions';
import {
  EnumWrapper,
  FieldWrapper,
  InputFieldWrapper,
  InputObjectDefinitionWrapper,
  ObjectDefinitionWrapper,
} from '../wrappers/object-definition-wrapper';

/**
 * Creates the condition/filter input for a model
 * @param ctx TransformerContext
 * @param name model name
 * @param object ModelObjectDefinition
 */
export const makeConditionFilterInput = (
  ctx: TransformerTransformSchemaStepContextProvider,
  name: string,
  object: ObjectTypeDefinitionNode,
): InputObjectDefinitionWrapper => {
  const supportsConditions = true;
  const input = InputObjectDefinitionWrapper.create(name);
  const wrappedObject = new ObjectDefinitionWrapper(object);
  for (let field of wrappedObject.fields) {
    const fieldType = ctx.output.getType(field.getTypeName());
    const isEnumType = fieldType && fieldType.kind === Kind.ENUM_TYPE_DEFINITION;
    if (field.isScalar() || isEnumType) {
      const conditionTypeName =
        isEnumType && field.isList()
          ? ModelResourceIDs.ModelFilterListInputTypeName(field.getTypeName(), !supportsConditions)
          : ModelResourceIDs.ModelFilterScalarInputTypeName(field.getTypeName(), !supportsConditions);
      const inputField = InputFieldWrapper.create(field.name, conditionTypeName, true);
      input.addField(inputField);
    }
  }

  // additional conditions of list type
  for (let additionalField of ['and', 'or']) {
    const inputField = InputFieldWrapper.create(additionalField, name, true, true);
    input.addField(inputField);
  }
  // additional conditions of non-list type
  for (let additionalField of ['not']) {
    const inputField = InputFieldWrapper.create(additionalField, name, true, false);
    input.addField(inputField);
  }
  return input;
};

export const addModelConditionInputs = (ctx: TransformerTransformSchemaStepContextProvider): void => {
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
 * @param typeName Name of the scalar type
 * @param includeFilter add filter suffix to input
 */
export function generateModelScalarFilterInputName(typeName: string, includeFilter: boolean): string {
  const nameOverride = DEFAULT_SCALARS[typeName];
  if (nameOverride) {
    return `Model${nameOverride}${includeFilter ? 'Filter' : ''}Input`;
  }
  return `Model${typeName}${includeFilter ? 'Filter' : ''}Input`;
}

export const createEnumModelFilters = (
  ctx: TransformerTransformSchemaStepContextProvider,
  type: ObjectTypeDefinitionNode,
): InputObjectTypeDefinitionNode[] => {
  // add enum type if present
  const typeWrapper = new ObjectDefinitionWrapper(type);
  const enumFields = typeWrapper.fields.filter(field => {
    const typeName = field.getTypeName();
    const typeObj = ctx.output.getType(typeName);
    return typeObj && typeObj.kind === 'EnumTypeDefinition';
  });

  return enumFields.map(field => makeEnumFilterInput(field));
};

/**
 * Generate Scalar Condition/Filter input for known scalar types
 * @param type scalar type name
 * @param supportsConditions add filter suffix to input
 */
export function makeModelScalarFilterInputObject(type: string, supportsConditions: boolean): InputObjectTypeDefinitionNode {
  const name = generateModelScalarFilterInputName(type, !supportsConditions);
  const conditions = getScalarConditions(type);
  const scalarConditionInput = InputObjectDefinitionWrapper.create(name);
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
    const field = InputFieldWrapper.create(condition, typeName, true);
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

function makeFunctionInputFields(typeName: string): InputFieldWrapper[] {
  const functions = getFunctionListForType(typeName);
  const fields = new Array<InputFieldWrapper>();

  if (functions.has('attributeExists')) {
    fields.push(InputFieldWrapper.create('attributeExists', 'Boolean', true));
  }

  if (functions.has('attributeType')) {
    fields.push(InputFieldWrapper.create('attributeType', 'ModelAttributeTypes', true));
  }

  if (functions.has('size')) {
    fields.push(InputFieldWrapper.create('size', 'ModelSizeInput', true));
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
  const input = InputObjectDefinitionWrapper.create(name);

  for (let condition of SIZE_CONDITIONS) {
    const field = InputFieldWrapper.create(condition, 'Int', true);
    if (condition === 'between') field.wrapListType();
    input.addField(field);
  }
  return input.serialize();
}

export function makeEnumFilterInput(fieldWrapper: FieldWrapper): InputObjectTypeDefinitionNode {
  const supportsConditions = true;
  const conditionTypeName = fieldWrapper.isList()
    ? ModelResourceIDs.ModelFilterListInputTypeName(fieldWrapper.getTypeName(), !supportsConditions)
    : ModelResourceIDs.ModelFilterScalarInputTypeName(fieldWrapper.getTypeName(), !supportsConditions);

  const input = InputObjectDefinitionWrapper.create(conditionTypeName);
  ['eq', 'ne'].forEach(fieldName => {
    const field = InputFieldWrapper.create(fieldName, fieldWrapper.getTypeName(), true, fieldWrapper.isList());
    input.addField(field);
  });

  if (fieldWrapper.isList()) {
    ['contains', 'notContains'].forEach(fieldName => {
      const field = InputFieldWrapper.create(fieldName, fieldWrapper.getTypeName(), true);
      input.addField(field);
    });
  }
  return input.serialize();
}

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

export const extendTypeWithDirectives = (
  ctx: TransformerTransformSchemaStepContextProvider,
  typeName: string,
  directives: Array<DirectiveNode>,
): void => {
  let objectTypeExtension = blankObjectExtension(typeName);
  objectTypeExtension = extensionWithDirectives(objectTypeExtension, directives);
  ctx.output.addObjectExtension(objectTypeExtension);
};

export function makeModelSortDirectionEnumObject(): EnumTypeDefinitionNode {
  const name = 'ModelSortDirection';
  return EnumWrapper.create(name, ['ASC', 'DESC']).serialize();
}
// the smaller version of it's @auth equivalent since we only support
// apikey as the only global auth rule
export const propagateApiKeyToNestedTypes = (
  ctx: TransformerContextProvider,
  def: ObjectTypeDefinitionNode,
  seenNonModelTypes: Set<string>,
) => {
  const nonModelTypePredicate = (fieldType: TypeDefinitionNode): TypeDefinitionNode | undefined => {
    if (fieldType) {
      if (fieldType.kind !== 'ObjectTypeDefinition') {
        return undefined;
      }
      const typeModel = fieldType.directives!.find(dir => dir.name.value === 'model');
      return typeModel !== undefined ? undefined : fieldType;
    }
    return fieldType;
  };
  const nonModelFieldTypes = def
    .fields!.map(f => ctx.output.getType(getBaseType(f.type)) as TypeDefinitionNode)
    .filter(nonModelTypePredicate);
  for (const nonModelFieldType of nonModelFieldTypes) {
    const nonModelName = nonModelFieldType.name.value;
    const hasSeenType = seenNonModelTypes.has(nonModelName);
    const hasApiKey = nonModelFieldType.directives?.some(dir => dir.name.value === API_KEY_DIRECTIVE) ?? false;
    if (!hasSeenType && !hasApiKey) {
      seenNonModelTypes.add(nonModelName);
      extendTypeWithDirectives(ctx, nonModelName, [makeDirective(API_KEY_DIRECTIVE, [])]);
      propagateApiKeyToNestedTypes(ctx, nonModelFieldType as ObjectTypeDefinitionNode, seenNonModelTypes);
    }
  }
};
