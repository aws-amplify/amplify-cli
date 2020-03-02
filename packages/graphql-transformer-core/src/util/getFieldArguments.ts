import { getBaseType } from 'graphql-transformer-common';
import { FieldDefinitionNode, TypeNode, ObjectTypeDefinitionNode } from 'graphql';
/**
 * Given a Type returns a plain JS map of its arguments
 * @param arguments The list of argument nodes to reduce.
 */
export function getFieldArguments(type: ObjectTypeDefinitionNode, withBaseType: boolean = true): Record<string, string | TypeNode> {
  return type.fields
    ? type.fields.reduce(
        (acc: {}, arg: FieldDefinitionNode) => ({
          ...acc,
          [arg.name.value]: withBaseType ? getBaseType(arg.type) : arg.type,
        }),
        {},
      )
    : [];
}
