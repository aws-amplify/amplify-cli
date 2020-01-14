import { GraphQLType, isNonNullType, isListType } from 'graphql';

export default function isList(typeObj: GraphQLType): boolean {
  if (isNonNullType(typeObj)) {
    return isList(typeObj.ofType);
  }
  return isListType(typeObj);
}
