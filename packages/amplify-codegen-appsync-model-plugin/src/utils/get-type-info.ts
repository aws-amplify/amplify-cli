import { TypeNode, GraphQLSchema } from 'graphql';
import { TypeInfo } from '../visitors/appsync-visitor';
export function getTypeInfo(typeNode: TypeNode, schema: GraphQLSchema): TypeInfo {
  if (typeNode.kind === 'NamedType') {
    return {
      type: typeNode.name.value,
      isNullable: true,
      isList: false,
      baseType: schema.getType(typeNode.name.value),
    };
  } else if (typeNode.kind === 'NonNullType') {
    return {
      ...getTypeInfo(typeNode.type, schema),
      isNullable: false,
    };
  } else if (typeNode.kind === 'ListType') {
    return {
      ...getTypeInfo(typeNode.type, schema),
      isList: true,
      isNullable: true,
    };
  }
  return {
    isList: false,
    isNullable: false,
    type: typeNode,
  };
}
