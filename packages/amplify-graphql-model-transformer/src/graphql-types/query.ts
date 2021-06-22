import { TransformerTransformSchemaStepContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { InputObjectTypeDefinitionNode, ObjectTypeDefinitionNode } from 'graphql';
import { FieldWrapper, ObjectDefinationWrapper } from '../wrappers/object-definition-wrapper';
import { makeConditionFilterInput } from './common';
export const makeListQueryFilterInput = (
  ctx: TransformerTransformSchemaStepContextProvider,
  name: string,
  object: ObjectTypeDefinitionNode,
): InputObjectTypeDefinitionNode => {
  return makeConditionFilterInput(ctx, name, object).serialize();
};

export const makeListQueryModel = (type: ObjectTypeDefinitionNode, modelName: string): ObjectTypeDefinitionNode => {
  const outputType = ObjectDefinationWrapper.create(modelName);

  outputType.addField(FieldWrapper.create('items', type.name.value, true, true));
  outputType.addField(FieldWrapper.create('nextToken', 'String', true, false));

  return outputType.serialize();
};
