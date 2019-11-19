import { GraphQLField, GraphQLSchema } from 'graphql';

import getArgs from './getArgs';
import getBody from './getBody';
import { GQLTemplateGenericOp, GQLTemplateArgDeclaration, GQLTemplateOpBody, GQLDocsGenOptions } from './types';

export default function generateOperation(
  operation: GraphQLField<any, any>,
  schema: GraphQLSchema,
  maxDepth: number = 3,
  addTypename: boolean,
  options: GQLDocsGenOptions
): GQLTemplateGenericOp {
  const args: Array<GQLTemplateArgDeclaration> = getArgs(operation.args);
  const body: GQLTemplateOpBody = getBody(operation, schema, maxDepth, addTypename, options);
  return {
    args,
    body,
  };
}
