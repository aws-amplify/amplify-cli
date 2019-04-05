import { GraphQLField, GraphQLSchema, GraphQLDirective, } from 'graphql'

import getArgs from './getArgs'
import getBody from './getBody'
import { GQLTemplateGenericOp, GQLTemplateArgDeclaration, GQLTemplateOpBody, GQLDocsGenOptions } from './types'
import getDirectives from './getDirectives';

export default function generateOperation(
  operation: GraphQLField<any, any>,
  schema: GraphQLSchema,
  maxDepth: number = 3,
  options: GQLDocsGenOptions
): GQLTemplateGenericOp {
  const args: Array<GQLTemplateArgDeclaration> = getArgs(operation.args)
  const body: GQLTemplateOpBody = getBody(operation, schema, maxDepth, options)
  const directives = options.renderMultiAuthDirectives ? getDirectives(operation) : [];
  return {
    args,
    body,
    directives,
  }
}
