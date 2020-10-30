import { TranformerTransformSchemaStepContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { outputFile } from 'fs-extra';
import { InputObjectTypeDefinitionNode, ObjectTypeDefinitionNode } from 'graphql';
import { FieldWrapper, ObjectDefinationWrapper } from '../wrappers/object-defination-wrapper';
import { generateModelScalarFilterInputName, makeConditionFilterInput } from './common';
export const makeListQueryFilterInput = (
  ctx: TranformerTransformSchemaStepContextProvider,
  name: string,
  object: ObjectTypeDefinitionNode,
): InputObjectTypeDefinitionNode => {
  return makeConditionFilterInput(ctx, name, object).serialize();
};

export const makeListQueryModel = (type: ObjectTypeDefinitionNode, modelName: string): ObjectTypeDefinitionNode => {
  const outPutType = ObjectDefinationWrapper.create(modelName);

  outPutType.addField(FieldWrapper.create('items', type.name.value, true, true));
  outPutType.addField(FieldWrapper.create('nextToken', 'String', true, false));

  return outPutType.serialize();
};
