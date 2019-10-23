import { GraphQLType, isNonNullType, isListType } from 'graphql';
export default function isRequired(typeObj: GraphQLType): boolean {
  if (isNonNullType(typeObj) && isListType(typeObj.ofType)) {
    // See if it's a Non-null List of Non-null Types
    return isRequired(typeObj.ofType.ofType);
  }
  if (isListType(typeObj)) {
    // See if it's a Nullable List of Non-null Types
    return isNonNullType(typeObj.ofType);
  }
  return isNonNullType(typeObj);
}
