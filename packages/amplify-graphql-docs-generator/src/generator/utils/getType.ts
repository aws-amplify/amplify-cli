import { GraphQLList, GraphQLNonNull, GraphQLType } from 'graphql';

import { GQLConcreteType } from '../types';

export default function getType(typeObj: GraphQLType): GQLConcreteType {
  if (typeObj instanceof GraphQLList || typeObj instanceof GraphQLNonNull) {
    return getType(typeObj.ofType);
  }
  return typeObj;
}
