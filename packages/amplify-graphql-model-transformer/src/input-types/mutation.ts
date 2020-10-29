import { ObjectTypeDefinitionNode, InputObjectTypeDefinitionNode, FieldDefinitionNode } from 'graphql';
import { toPascalCase, getBaseType } from 'graphql-transformer-common';
import { ModelDirectiveConfiguration } from '../graphql-model-transformer';
import { ObjectDefinationWrapper, InputObjectDefinationWrapper, InputFieldWraper } from '../wrappers/object-defination-wrapper';

/**
 * Generate input used for update mutation
 * @param obj type with model directive
 * @param modelDirectiveConfig directive configuration
 * @param knownModelTypes list of all the known models
 */
export const makeUpdateInputField = (
  obj: ObjectTypeDefinitionNode,
  modelDirectiveConfig: ModelDirectiveConfiguration,
  knownModelTypes: Set<string>,
): InputObjectTypeDefinitionNode => {
  // sync related things
  const objectWrpped = new ObjectDefinationWrapper(obj);
  const typeName = objectWrpped.name;
  const name = toPascalCase([`Update`, typeName, 'Input']);
  const hasIdField = objectWrpped.hasField('id');
  const fieldsToRemove = objectWrpped
    .fields!.filter(field => {
      if (knownModelTypes.has(field.getTypeName())) {
        return true;
      }
      return false;
    })
    .map(field => {
      return field.getTypeName();
    });

  const input = InputObjectDefinationWrapper.fromObject(name, {
    ...obj,
    fields: obj.fields?.filter(f => !fieldsToRemove.includes(f.name.value)),
  });

  // make all the fields optional
  input.fields.forEach(f => f.makeNullable());

  // Add id field and make it optional
  if (!hasIdField) {
    input.addField(InputFieldWraper.create('id', 'ID', false));
  } else {
    const idField = input.fields.find(f => f.name === 'id');
    if (idField) {
      idField.makeNonNullable();
    }
  }

  // Make createdAt and updatedAt field Optionals if present
  for (let timeStampFieldName of Object.values(modelDirectiveConfig?.timestamps || {})) {
    if (input.hasField(timeStampFieldName!)) {
      const timestampField = input.getField(timeStampFieldName!);
      if (['String', 'AWSDateTime'].includes(timestampField.getTypeName())) {
        timestampField.makeNullable();
      }
    }
  }
  return input.serialize();
};

/**
 * Generate input used for delete mutation
 * @param type GraphQL type with model directive
 */
export const makeDeleteInputField = (type: ObjectTypeDefinitionNode): InputObjectTypeDefinitionNode => {
  const name = toPascalCase(['Delete', type.name.value, 'input']);
  const inputField = InputObjectDefinationWrapper.create(name);
  const idField = InputFieldWraper.create('id', 'ID', false, false);
  inputField.addField(idField);
  return inputField.serialize();
};

/**
 * Generate input for Create mutation
 * @param obj type with model directive
 * @param modelDirectiveConfig model directive configuration
 * @param knownModelTypes List of all the types with model directive
 */
export const makeCreateInputField = (
  obj: ObjectTypeDefinitionNode,
  modelDirectiveConfig: ModelDirectiveConfiguration,
  knownModelTypes: Set<string>,
): InputObjectTypeDefinitionNode => {
  // sync related things
  const objectWrpped = new ObjectDefinationWrapper(obj);
  const typeName = objectWrpped.name;
  const name = toPascalCase([`Create`, typeName, 'Input']);
  const hasIdField = objectWrpped.hasField('id');
  const fieldsToRemove = objectWrpped
    .fields!.filter(field => {
      if (knownModelTypes.has(field.getTypeName())) {
        return true;
      }
      return false;
    })
    .map(field => {
      return field.getTypeName();
    });

  const input = InputObjectDefinationWrapper.fromObject(name, {
    ...obj,
    fields: obj.fields?.filter(f => !fieldsToRemove.includes(f.name.value)),
  });

  // Add id field and make it optional
  if (!hasIdField) {
    input.addField(InputFieldWraper.create('id', 'ID'));
  } else {
    const idField = input.fields.find(f => f.name === 'id');
    if (idField) {
      idField.makeNullable();
    }
  }
  // Make createdAt and updatedAt field Optionals if present
  for (let timeStampFieldName of Object.values(modelDirectiveConfig?.timestamps || {})) {
    if (input.hasField(timeStampFieldName!)) {
      const timestampField = input.getField(timeStampFieldName!);
      if (['String', 'AWSDateTime'].includes(timestampField.getTypeName())) {
        timestampField.makeNullable();
      }
    }
  }
  return input.serialize();
};
