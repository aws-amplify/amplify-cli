import { GraphQLField, GraphQLSchema } from "graphql";

import getFields from "./getFields";
import { GQLTemplateOpBody, GQLTemplateArgInvocation, GQLTemplateField } from "./types";

export function getBody(op: GraphQLField<any, any>, schema: GraphQLSchema): GQLTemplateOpBody {
  const args: Array<GQLTemplateArgInvocation> = op.args.map(arg => ({
    name: arg.name,
    value: `\$${arg.name}`
  }));
  const fields: GQLTemplateField = getFields(op, schema);
  return {
    args,
    ...fields
  };
}
