import { URL } from 'url';
import { GraphQLInt, GraphQLScalarType, GraphQLError, Kind, StringValueNode, ValueNode } from 'graphql';
import { isValidNumber } from 'libphonenumber-js';
import * as net from 'net';

import { GraphQLDate, GraphQLTime, GraphQLDateTime } from 'graphql-iso-date';

const EMAIL_ADDRESS_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Some of the custom scalars in this file are inspired by the graphql-scalars npm module.

const phoneValidator = (ast, options) => {
  const { country = 'US' } = options;
  const { kind, value } = ast;
  if (kind !== Kind.STRING) {
    throw new GraphQLError(`Query error: Can only parse strings got a: ${kind}`, [ast]);
  }

  const isValid = isValidNumber(value, country);
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
  description:
    'The AWSTimestamp scalar type represents the number of seconds that have elapsed \
since 1970-01-01T00:00Z. Timestamps are serialized and deserialized as numbers. Negative values \
are also accepted and these represent the number of seconds till 1970-01-01T00:00Z.',
  serialize(value) {
    return GraphQLInt.serialize(value);
  },
  parseValue(value) {
    return GraphQLInt.parseValue(value) ? value : undefined;
  },
  parseLiteral(value: ValueNode) {
    if (value.kind !== Kind.INT) {
      throw new GraphQLError(`Can only validate integers but received: ${value.kind}`);
    }

    return Number.parseInt(value.value, 10);
  },
});

// Unified the code for both types from graphql-scalars library.
const validateIPAddress = value => {
  if (typeof value !== 'string') {
    throw new TypeError(`Value is not string: ${value}`);
  }
  if (net.isIPv4(value) || net.isIPv6(value)) {
    return value;
  }

  throw new TypeError(`Value is not a valid IP address: ${value}`);
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
  },
});

const parseJson = (value: string) => {
  if (typeof value !== 'string') {
    throw new GraphQLError(`Unable to parse ${value} as valid JSON.`);
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    throw new TypeError(`Unable to parse ${value} as valid JSON.`);
  }
};

const AWSJSON = new GraphQLScalarType({
  name: 'AWSJSON',
  description: 'The AWSJSON scalar type represents a valid json object serialized as a string.',
  serialize(value) {
    return JSON.stringify(value);
  },
  parseValue(value) {
    return parseJson(value);
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(`Unable to parse ${ast.kind} as valid JSON.`);
    }

    return parseJson(ast.value);
  },
});

const validateEmail = value => {
  if (typeof value !== 'string') {
    throw new TypeError(`Value is not string: ${value}`);
  }

  if (!EMAIL_ADDRESS_REGEX.test(value)) {
    throw new TypeError(`Value is not a valid email address: ${value}`);
  }

  return value;
};

const AWSEmail = new GraphQLScalarType({
  name: 'AWSEmail',
  description:
    'A field whose value conforms to the standard internet email address format as specified in RFC822: https://www.w3.org/Protocols/rfc822/.',
  serialize: validateEmail,
  parseValue: validateEmail,
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(`Can only validate strings as email addresses but got a: ${ast.kind}`);
    }

    return validateEmail(ast.value);
  },
});

const parseUrlValue = value => (value ? new URL(value.toString()) : value);

const AWSURL = new GraphQLScalarType({
  name: 'AWSURL',
  description: 'A field whose value conforms to the standard URL format as specified in RFC3986: https://www.ietf.org/rfc/rfc3986.txt.',
  serialize(value) {
    if (value) {
      return new URL(value.toString()).toString();
    }

    return value;
  },
  parseValue: parseUrlValue,
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(`Can only validate strings as URLs but got a: ${ast.kind}`);
    }

    return parseUrlValue(ast.value);
  },
});

export const scalars = {
  AWSJSON,
  AWSDate,
  AWSTime,
  AWSDateTime,
  AWSPhone: new AWSPhone({ name: 'AWSPhone', description: 'AWSPhone' }),
  AWSEmail,
  AWSURL,
  AWSTimestamp,
  AWSIPAddress,
};

export function wrapSchema(schemaString) {
  const scalarStrings = Object.keys(scalars)
    .map(scalarKey => `scalar ${scalarKey}\n`)
    .join('');

  return scalarStrings + schemaString;
}
