import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLID,
  GraphQLScalarType,
  GraphQLString,
  GraphQLType,
  isNonNullType,
  isListType,
} from 'graphql'

import * as t from 'babel-types';

import { CompilerOptions } from '../compiler';

const builtInScalarMap = {
  [GraphQLString.name]: t.stringTypeAnnotation(),
  [GraphQLInt.name]: t.numberTypeAnnotation(),
  [GraphQLFloat.name]: t.numberTypeAnnotation(),
  [GraphQLBoolean.name]: t.booleanTypeAnnotation(),
  [GraphQLID.name]: t.stringTypeAnnotation(),
}

export function createTypeAnnotationFromGraphQLTypeFunction(
  compilerOptions: CompilerOptions
): Function {
  return function typeAnnotationFromGraphQLType(type: GraphQLType, {
    nullable
  }: { nullable: boolean } = {
    nullable: true
  }): t.FlowTypeAnnotation {
    if (isNonNullType(type)) {
      return typeAnnotationFromGraphQLType(
        type.ofType,
        { nullable: false }
      );
    }

    if (isListType(type)) {
      const typeAnnotation = t.arrayTypeAnnotation(
        typeAnnotationFromGraphQLType(type.ofType)
      );

      if (nullable) {
        return t.nullableTypeAnnotation(typeAnnotation);
      } else {
        return typeAnnotation;
      }
    }

    let typeAnnotation;
    if (type instanceof GraphQLScalarType) {
      const builtIn = builtInScalarMap[type.name]
      if (builtIn) {
        typeAnnotation = builtIn;
      } else {
        if (compilerOptions.passthroughCustomScalars) {
          typeAnnotation = t.anyTypeAnnotation();
        } else {
          typeAnnotation = t.genericTypeAnnotation(
            t.identifier(type.name)
          );
        }
      }
    } else {
      typeAnnotation = t.genericTypeAnnotation(
        t.identifier(type.name)
      );
    }

    if (nullable) {
      return t.nullableTypeAnnotation(typeAnnotation);
    } else {
      return typeAnnotation;
    }
  }
}
