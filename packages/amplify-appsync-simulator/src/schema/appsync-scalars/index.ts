import { GraphQLInt, GraphQLScalarType, GraphQLError, Kind, StringValueNode } from 'graphql';
import * as GraphQLJSON from 'graphql-type-json';
import { isValidNumber } from 'libphonenumber-js';

import { GraphQLDate, GraphQLTime, GraphQLDateTime } from 'graphql-iso-date';

import { EmailAddressResolver, URLResolver } from 'graphql-scalars';

const IPV4_REGEX = /^(?:(?:(?:0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(?:0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?)$/;
const IPV6_REGEX = /^(?:(?:(?:[0-9A-Fa-f]{1,4}:){6}(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(?:0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|::(?:[0-9A-Fa-f]{1,4}:){5}(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(?:0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(?:[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){4}(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(?:0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(?:(?:[0-9A-Fa-f]{1,4}:){0,1}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){3}(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(?:0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(?:(?:[0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){2}(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(?:0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(?:(?:[0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}:(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(?:0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(?:(?:[0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(?:0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(?:(?:[0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})?::)(?:\/(?:0?0?[0-9]|0?[1-9][0-9]|1[01][0-9]|12[0-8]))?)$/;

const phoneValidator = (ast, options) => {
  const { country = 'US' } = options;
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
  constructor(options = { name: null, description: null }) {
    const { name, description } = options;
    super({
      name,
      description,
      serialize: value => {
        const ast = {
          kind: Kind.STRING,
          value,
        };
        return phoneValidator(ast, options);
      },
      parseValue: value => {
        const ast = {
          kind: Kind.STRING,
          value,
        };
        return phoneValidator(ast, options);
      },
      parseLiteral: ast => phoneValidator(ast, options),
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
  },
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
  },
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
  },
});

const AWSTimestamp = new GraphQLScalarType({
  name: 'AWSTimestamp',
  description: 'The AWSTimestamp scalar type represents the number of seconds that have elapsed \
since 1970-01-01T00:00Z. Timestamps are serialized and deserialized as numbers. Negative values \
are also accepted and these represent the number of seconds till 1970-01-01T00:00Z.',
  serialize(value) {
    return GraphQLInt.serialize(value);
  },
  parseValue(value) {
    return GraphQLInt.parseValue(value) ? value : undefined;
  },
  parseLiteral(value) {
    return GraphQLInt.parseLiteral(value) ? (value as StringValueNode).value : undefined;
  },
});

// Unified the code for both types from graphql-scalars library.
const validateIPAddress = (value) => {
  if (typeof value !== 'string') {
    throw new TypeError(`Value is not string: ${value}`);
  }
  if (!(IPV4_REGEX.test(value))) {
    throw new TypeError(`Value is not a valid IPv4 address: ${value}`);
  }
  if (!(IPV6_REGEX.test(value))) {
    throw new TypeError(`Value is not a valid IPv6 address: ${value}`);
  }
  return value;
};

const AWSIPAddress = new GraphQLScalarType({
  name: 'AWSIPAddress',
  description: 'The AWSIPAddress scalar type represents a valid IPv4 or IPv6 address string.',
  serialize(value) {
    return validateIPAddress(value);
  },
  parseValue(value) {
    return validateIPAddress(value);
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
        throw new GraphQLError(`Can only validate strings as IPv4 or IPv6 addresses but got a: ${ast.kind}`);
    }
    return validateIPAddress(ast.value);
  }
});

export const scalars = {
  AWSJSON: GraphQLJSON,
  AWSDate,
  AWSTime,
  AWSDateTime,
  AWSPhone,
  AWSEmail: EmailAddressResolver,
  AWSURL: URLResolver,
  AWSTimestamp,
  AWSIPAddress
};

export function wrapSchema(schemaString) {
  const scalarStrings = Object.keys(scalars)
    .map(scalarKey => `scalar ${scalarKey}\n`)
    .join('');

  return scalarStrings + schemaString;
}
