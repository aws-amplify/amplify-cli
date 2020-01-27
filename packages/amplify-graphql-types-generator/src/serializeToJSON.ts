import {
  isType,
  isEnumType,
  isUnionType,
  isInputObjectType,
  isObjectType,
  isInterfaceType,
  isScalarType,
  GraphQLType,
  GraphQLScalarType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLInterfaceType,
} from 'graphql';

import { LegacyCompilerContext } from './compiler/legacyIR';

export default function serializeToJSON(context: LegacyCompilerContext) {
  return serializeAST(
    {
      operations: Object.values(context.operations),
      fragments: Object.values(context.fragments),
      typesUsed: context.typesUsed.map(serializeType),
    },
    '\t',
  );
}

export function serializeAST(ast: any, space?: string) {
  return JSON.stringify(
    ast,
    function(_, value) {
      if (isType(value)) {
        return String(value);
      } else {
        return value;
      }
    },
    space,
  );
}

function serializeType(type: GraphQLType) {
  if (isEnumType(type)) {
    return serializeEnumType(type);
  } else if (isUnionType(type)) {
    return serializeUnionType(type);
  } else if (isInputObjectType(type)) {
    return serializeInputObjectType(type);
  } else if (isObjectType(type)) {
    return serializeObjectType(type);
  } else if (isInterfaceType(type)) {
    return serializeInterfaceType(type);
  } else if (isScalarType(type)) {
    return serializeScalarType(type);
  } else {
    throw new Error(`Unexpected GraphQL type: ${type}`);
  }
}

function serializeEnumType(type: GraphQLEnumType) {
  const { name, description } = type;
  const values = type.getValues();

  return {
    kind: 'EnumType',
    name,
    description,
    values: values.map(value => ({
      name: value.name,
      description: value.description,
      isDeprecated: value.isDeprecated,
      deprecationReason: value.deprecationReason,
    })),
  };
}

function serializeUnionType(type: GraphQLUnionType) {
  const { name, description } = type;
  const types = type.getTypes();

  return {
    kind: 'UnionType',
    name,
    description,
    types: types.map(type => ({
      name: type.name,
      description: type.description,
    })),
  };
}

function serializeInputObjectType(type: GraphQLInputObjectType) {
  const { name, description } = type;
  const fields = Object.values(type.getFields());

  return {
    kind: 'InputObjectType',
    name,
    description,
    fields: fields.map(field => ({
      name: field.name,
      type: String(field.type),
      description: field.description,
      defaultValue: field.defaultValue,
    })),
  };
}

function serializeObjectType(type: GraphQLObjectType) {
  const { name, description } = type;
  const ifaces = Object.values(type.getInterfaces());
  const fields = Object.values(type.getFields());

  return {
    kind: 'ObjectType',
    name,
    description,
    ifaces: ifaces.map(iface => ({
      name: iface.name,
      description: iface.description,
    })),
    fields: fields.map(field => ({
      name: field.name,
      type: String(field.type),
      description: field.description,
    })),
  };
}

function serializeInterfaceType(type: GraphQLInterfaceType) {
  const { name, description } = type;
  const fields = Object.values(type.getFields());

  return {
    kind: 'InterfaceType',
    name,
    description,
    fields: fields.map(field => ({
      name: field.name,
      type: String(field.type),
      description: field.description,
    })),
  };
}

function serializeScalarType(type: GraphQLScalarType) {
  const { name, description } = type;

  return {
    kind: 'ScalarType',
    name,
    description,
  };
}
