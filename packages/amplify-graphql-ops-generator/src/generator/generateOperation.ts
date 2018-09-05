import { GraphQLField, GraphQLSchema } from "graphql";

import { getArgs } from "./getArgs";
import { getBody } from "./getBody";
import { GQLTemplateGenericOp, GQLTemplateArgDeclaration, GQLTemplateOpBody } from "./types";

export function generateOperation(
  operation: GraphQLField<any, any>,
  schema: GraphQLSchema
): GQLTemplateGenericOp {
  const args: Array<GQLTemplateArgDeclaration> = getArgs(operation.args);
  const body: GQLTemplateOpBody = getBody(operation, schema);
  return {
    args,
    body
  };
}
