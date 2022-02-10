import { TransformerTransformSchemaStepContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { InputObjectTypeDefinitionNode, ObjectTypeDefinitionNode } from 'graphql';
import { FieldWrapper, ObjectDefinitionWrapper } from '@aws-amplify/graphql-transformer-core';
import { makeConditionFilterInput } from './common';
export const makeListQueryFilterInput = (
  ctx: TransformerTransformSchemaStepContextProvider,
  name: string,
  object: ObjectTypeDefinitionNode,
): InputObjectTypeDefinitionNode => {
  return makeConditionFilterInput(ctx, name, object).serialize();
};

export const makeListQueryModel = (type: ObjectTypeDefinitionNode, modelName: string, isSyncEnabled: boolean): ObjectTypeDefinitionNode => {
  const outputType = ObjectDefinitionWrapper.create(modelName);

  outputType.addField(FieldWrapper.create('items', type.name.value, true, true));
  outputType.addField(FieldWrapper.create('nextToken', 'String', true, false));

  if (isSyncEnabled) {
    outputType.addField(FieldWrapper.create('startedAt', 'AWSTimestamp', true, false));
  }

  return outputType.serialize();
};
