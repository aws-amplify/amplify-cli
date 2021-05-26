import { TransformerTransformSchemaStepContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { ObjectTypeDefinitionNode, InputObjectTypeDefinitionNode } from 'graphql';
import { toPascalCase } from 'graphql-transformer-common';
import { ModelDirectiveConfiguration } from '../graphql-model-transformer';
import { ObjectDefinationWrapper, InputObjectDefinitionWrapper, InputFieldWraper } from '../wrappers/object-definition-wrapper';
import { makeConditionFilterInput } from './common';

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
  const objectWrapped = new ObjectDefinationWrapper(obj);
  const typeName = objectWrapped.name;
  const name = toPascalCase([`Update`, typeName, 'Input']);
  const hasIdField = objectWrapped.hasField('id');
  const fieldsToRemove = objectWrapped
    .fields!.filter(field => {
      if (knownModelTypes.has(field.getTypeName())) {
        return true;
      }
      return false;
    })
    .map(field => {
      return field.getTypeName();
    });

  const input = InputObjectDefinitionWrapper.fromObject(name, {
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
  const inputField = InputObjectDefinitionWrapper.create(name);
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
  const objectWrapped = new ObjectDefinationWrapper(obj);
  const typeName = objectWrapped.name;
  const name = toPascalCase([`Create`, typeName, 'Input']);
  const hasIdField = objectWrapped.hasField('id');
  const fieldsToRemove = objectWrapped
    .fields!.filter(field => {
      if (knownModelTypes.has(field.getTypeName())) {
        return true;
      }
      return false;
    })
    .map(field => {
      return field.getTypeName();
    });

  const input = InputObjectDefinitionWrapper.fromObject(name, {
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

export const makeMutationConditionInput = (
  ctx: TransformerTransformSchemaStepContextProvider,
  name: string,
  object: ObjectTypeDefinitionNode,
): InputObjectTypeDefinitionNode => {
  const input = makeConditionFilterInput(ctx, name, object);
  const idField = input.fields.find(f => f.name === 'id' && f.getTypeName() === 'ID');
  if (idField) {
    input.removeField(idField);
  }
  return input.serialize();
};
