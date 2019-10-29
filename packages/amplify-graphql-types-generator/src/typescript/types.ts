import { LegacyCompilerContext } from '../compiler/legacyIR';

import {
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLID,
  GraphQLScalarType,
  GraphQLType,
  isNonNullType,
  isListType,
} from 'graphql';

const builtInScalarMap = {
  [GraphQLString.name]: 'string',
  [GraphQLInt.name]: 'number',
  [GraphQLFloat.name]: 'number',
  [GraphQLBoolean.name]: 'boolean',
  [GraphQLID.name]: 'string',
};

const appSyncScalars: any = {
  AWSTimestamp: 'number',
};

export function typeNameFromGraphQLType(
  context: LegacyCompilerContext,
  type: GraphQLType,
  bareTypeName?: string | null,
  nullable = true
): string {
  if (isNonNullType(type)) {
    return typeNameFromGraphQLType(context, type.ofType, bareTypeName, false);
  }

  let typeName;
  if (isListType(type)) {
    typeName = `Array< ${typeNameFromGraphQLType(context, type.ofType, bareTypeName, true)} >`;
  } else if (type instanceof GraphQLScalarType) {
    typeName =
      builtInScalarMap[type.name] ||
      appSyncScalars[type.name] ||
      (context.options.passthroughCustomScalars ? context.options.customScalarsPrefix + type.name : builtInScalarMap[GraphQLString.name]);
  } else {
    typeName = bareTypeName || type.name;
  }

  return nullable ? typeName + ' | null' : typeName;
}
