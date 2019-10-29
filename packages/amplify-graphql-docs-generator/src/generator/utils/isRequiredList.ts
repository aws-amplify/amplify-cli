import { GraphQLType, isNonNullType, isListType } from 'graphql';
export default function isRequired(typeObj: GraphQLType): boolean {
  return isNonNullType(typeObj) && isListType(typeObj.ofType);
}
