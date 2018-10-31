import { GraphQLType, isNonNullType, isListType } from "graphql";
export default function isRequired(typeObj: GraphQLType): boolean {
  // See if it's a Non-null List of Non-null Types
  if (isNonNullType(typeObj) && isListType(typeObj.ofType)) {
    return isRequired(typeObj.ofType.ofType)
  }
  // See if it's a Nullable List of Non-null Types
  else if (isListType(typeObj)) {
    return isNonNullType(typeObj.ofType);
  }
  return isNonNullType(typeObj);
}
