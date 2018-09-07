import { GraphQLField, GraphQLSchema } from 'graphql'

import getFields from './getFields'
import { GQLTemplateOpBody, GQLTemplateArgInvocation, GQLTemplateField } from './types'

export default function getBody(
  op: GraphQLField<any, any>,
  schema: GraphQLSchema,
  maxDepth: number = 3
): GQLTemplateOpBody {
  const args: Array<GQLTemplateArgInvocation> = op.args.map((arg) => ({
    name: arg.name,
    value: `\$${arg.name}`,
  }))
  const fields: GQLTemplateField = getFields(op, schema, maxDepth)
  return {
    args,
    ...fields,
  }
}
