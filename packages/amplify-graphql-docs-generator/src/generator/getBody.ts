import { GraphQLField, GraphQLSchema } from 'graphql';

import getFields from './getFields';
import { GQLTemplateOpBody, GQLTemplateArgInvocation, GQLTemplateField, GQLDocsGenOptions } from './types';

export default function getBody(
  op: GraphQLField<any, any>,
  schema: GraphQLSchema,
  maxDepth: number = 3,
  options: GQLDocsGenOptions
): GQLTemplateOpBody {
  const args: Array<GQLTemplateArgInvocation> = op.args.map(arg => ({
    name: arg.name,
    value: `\$${arg.name}`,
  }));
  const fields: GQLTemplateField = getFields(op, schema, maxDepth, options);
  return {
    args,
    ...fields,
  };
}
