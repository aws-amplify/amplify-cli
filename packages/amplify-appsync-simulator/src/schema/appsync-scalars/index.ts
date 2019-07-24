import { GraphQLScalarType, GraphQLError, Kind, isValueNode, StringValueNode } from 'graphql';
import * as GraphQLJSON from 'graphql-type-json';
import { isValidNumber, getNumberType, CountryCode } from 'libphonenumber-js';

import { GraphQLDate, GraphQLTime, GraphQLDateTime } from 'graphql-iso-date';

import { EmailAddress, URL } from '@okgrow/graphql-scalars';

const phoneValidator = (ast, options) => {
  const { country = 'US'} = options;
  const { kind, value } = ast;
  if (kind !== Kind.STRING) {
    throw new GraphQLError(`Query error: Can only parse strings got a: ${kind}`, [ast]);
  }

  let isValid = isValidNumber(value, country);
  if (!isValid) {
    throw new GraphQLError('Query error: Not a valid phone number', [ast]);
  }

  return value;
};

class AWSPhone extends GraphQLScalarType {
  constructor(options = {name: null, description: null}) {
    const { name, description } = options;
    super({
      name,
      description,
      serialize: value => {
        const ast = {
          kind: Kind.STRING,
          value
        };
        return phoneValidator(ast, options);
      },
      parseValue: value => {
        const ast = {
          kind: Kind.STRING,
          value
        };
        return phoneValidator(ast, options);
      },
      parseLiteral: ast => phoneValidator(ast, options)
    });
  }
}

const AWSDate = new GraphQLScalarType({
  name: 'AWSDate',
  description: GraphQLDate.description,
  serialize(value) {
    return GraphQLDate.serialize(value);
  },
  parseValue(value) {
    return GraphQLDate.parseValue(value) ? value : undefined;
  },
  parseLiteral(value) {
    return GraphQLDate.parseLiteral(value) ? (value as StringValueNode).value : undefined;
  }
});

const AWSTime = new GraphQLScalarType({
  name: 'AWSTime',
  description: GraphQLTime.description,
  serialize(value) {
    return GraphQLTime.serialize(value);
  },
  parseValue(value) {
    return GraphQLTime.parseValue(value) ? value : undefined;
  },
  parseLiteral(value) {
    return GraphQLTime.parseLiteral(value) ? (value as StringValueNode).value : undefined;
  }
});

const AWSDateTime = new GraphQLScalarType({
  name: 'AWSDateTime',
  description: GraphQLDateTime.description,
  serialize(value) {
    return GraphQLDateTime.serialize(value);
  },
  parseValue(value) {
    return GraphQLDateTime.parseValue(value) ? value : undefined;
  },
  parseLiteral(value) {
    return GraphQLDateTime.parseLiteral(value) ? (value as StringValueNode).value : undefined;
  }
});

export const scalars = {
  AWSJSON: GraphQLJSON,
  AWSDate,
  AWSTime,
  AWSDateTime,
  AWSPhone,
  AWSEmail: EmailAddress,
  AWSURL: URL
};

export function wrapSchema(schemaString) {
  const scalarStrings = Object.keys(scalars)
    .map(scalarKey => `scalar ${scalarKey}\n`)
    .join('');

  return scalarStrings + schemaString;
};

