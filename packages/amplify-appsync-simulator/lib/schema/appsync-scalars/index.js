"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapSchema = exports.scalars = void 0;
const url_1 = require("url");
const graphql_1 = require("graphql");
const libphonenumber_js_1 = require("libphonenumber-js");
const net = __importStar(require("net"));
const graphql_iso_date_1 = require("graphql-iso-date");
const EMAIL_ADDRESS_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const phoneValidator = (ast, options) => {
    const { country = 'US' } = options;
    const { kind, value } = ast;
    if (kind !== graphql_1.Kind.STRING) {
        throw new graphql_1.GraphQLError(`Query error: Can only parse strings got a: ${kind}`, [ast]);
    }
    const isValid = (0, libphonenumber_js_1.isValidNumber)(value, country);
    if (!isValid) {
        throw new graphql_1.GraphQLError('Query error: Not a valid phone number', [ast]);
    }
    return value;
};
class AWSPhone extends graphql_1.GraphQLScalarType {
    constructor(options = { name: null, description: null }) {
        const { name, description } = options;
        super({
            name,
            description,
            serialize: (value) => {
                const ast = {
                    kind: graphql_1.Kind.STRING,
                    value,
                };
                return phoneValidator(ast, options);
            },
            parseValue: (value) => {
                const ast = {
                    kind: graphql_1.Kind.STRING,
                    value,
                };
                return phoneValidator(ast, options);
            },
            parseLiteral: (ast) => phoneValidator(ast, options),
        });
    }
}
const AWSDate = new graphql_1.GraphQLScalarType({
    name: 'AWSDate',
    description: graphql_iso_date_1.GraphQLDate.description,
    serialize(value) {
        return graphql_iso_date_1.GraphQLDate.serialize(value);
    },
    parseValue(value) {
        return graphql_iso_date_1.GraphQLDate.parseValue(value) ? value : undefined;
    },
    parseLiteral(value) {
        return graphql_iso_date_1.GraphQLDate.parseLiteral(value) ? value.value : undefined;
    },
});
const AWSTime = new graphql_1.GraphQLScalarType({
    name: 'AWSTime',
    description: graphql_iso_date_1.GraphQLTime.description,
    serialize(value) {
        return graphql_iso_date_1.GraphQLTime.serialize(value);
    },
    parseValue(value) {
        return graphql_iso_date_1.GraphQLTime.parseValue(value) ? value : undefined;
    },
    parseLiteral(value) {
        return graphql_iso_date_1.GraphQLTime.parseLiteral(value) ? value.value : undefined;
    },
});
const AWSDateTime = new graphql_1.GraphQLScalarType({
    name: 'AWSDateTime',
    description: graphql_iso_date_1.GraphQLDateTime.description,
    serialize(value) {
        return graphql_iso_date_1.GraphQLDateTime.serialize(value);
    },
    parseValue(value) {
        return graphql_iso_date_1.GraphQLDateTime.parseValue(value) ? value : undefined;
    },
    parseLiteral(value) {
        return graphql_iso_date_1.GraphQLDateTime.parseLiteral(value) ? value.value : undefined;
    },
});
const AWSTimestamp = new graphql_1.GraphQLScalarType({
    name: 'AWSTimestamp',
    description: 'The AWSTimestamp scalar type represents the number of seconds that have elapsed \
since 1970-01-01T00:00Z. Timestamps are serialized and deserialized as numbers. Negative values \
are also accepted and these represent the number of seconds till 1970-01-01T00:00Z.',
    serialize(value) {
        return graphql_1.GraphQLInt.serialize(value);
    },
    parseValue(value) {
        return graphql_1.GraphQLInt.parseValue(value) ? value : undefined;
    },
    parseLiteral(value) {
        if (value.kind !== graphql_1.Kind.INT) {
            throw new graphql_1.GraphQLError(`Can only validate integers but received: ${value.kind}`);
        }
        return Number.parseInt(value.value, 10);
    },
});
const validateIPAddress = (value) => {
    if (typeof value !== 'string') {
        throw new TypeError(`Value is not string: ${value}`);
    }
    if (net.isIPv4(value) || net.isIPv6(value)) {
        return value;
    }
    throw new TypeError(`Value is not a valid IP address: ${value}`);
};
const AWSIPAddress = new graphql_1.GraphQLScalarType({
    name: 'AWSIPAddress',
    description: 'The AWSIPAddress scalar type represents a valid IPv4 or IPv6 address string.',
    serialize(value) {
        return validateIPAddress(value);
    },
    parseValue(value) {
        return validateIPAddress(value);
    },
    parseLiteral(ast) {
        if (ast.kind !== graphql_1.Kind.STRING) {
            throw new graphql_1.GraphQLError(`Can only validate strings as IPv4 or IPv6 addresses but got a: ${ast.kind}`);
        }
        return validateIPAddress(ast.value);
    },
});
const parseJson = (value) => {
    if (typeof value !== 'string') {
        throw new graphql_1.GraphQLError(`Unable to parse ${value} as valid JSON.`);
    }
    try {
        return JSON.parse(value);
    }
    catch (error) {
        throw new TypeError(`Unable to parse ${value} as valid JSON.`);
    }
};
const AWSJSON = new graphql_1.GraphQLScalarType({
    name: 'AWSJSON',
    description: 'The AWSJSON scalar type represents a valid json object serialized as a string.',
    serialize(value) {
        return JSON.stringify(value);
    },
    parseValue(value) {
        return parseJson(value);
    },
    parseLiteral(ast) {
        if (ast.kind !== graphql_1.Kind.STRING) {
            throw new graphql_1.GraphQLError(`Unable to parse ${ast.kind} as valid JSON.`);
        }
        return parseJson(ast.value);
    },
});
const validateEmail = (value) => {
    if (typeof value !== 'string') {
        throw new TypeError(`Value is not string: ${value}`);
    }
    if (!EMAIL_ADDRESS_REGEX.test(value)) {
        throw new TypeError(`Value is not a valid email address: ${value}`);
    }
    return value;
};
const AWSEmail = new graphql_1.GraphQLScalarType({
    name: 'AWSEmail',
    description: 'A field whose value conforms to the standard internet email address format as specified in RFC822: https://www.w3.org/Protocols/rfc822/.',
    serialize: validateEmail,
    parseValue: validateEmail,
    parseLiteral(ast) {
        if (ast.kind !== graphql_1.Kind.STRING) {
            throw new graphql_1.GraphQLError(`Can only validate strings as email addresses but got a: ${ast.kind}`);
        }
        return validateEmail(ast.value);
    },
});
const parseUrlValue = (value) => (value ? new url_1.URL(value.toString()) : value);
const AWSURL = new graphql_1.GraphQLScalarType({
    name: 'AWSURL',
    description: 'A field whose value conforms to the standard URL format as specified in RFC3986: https://www.ietf.org/rfc/rfc3986.txt.',
    serialize(value) {
        if (value) {
            return new url_1.URL(value.toString()).toString();
        }
        return value;
    },
    parseValue: parseUrlValue,
    parseLiteral(ast) {
        if (ast.kind !== graphql_1.Kind.STRING) {
            throw new graphql_1.GraphQLError(`Can only validate strings as URLs but got a: ${ast.kind}`);
        }
        return parseUrlValue(ast.value);
    },
});
exports.scalars = {
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
function wrapSchema(schemaString) {
    const scalarStrings = Object.keys(exports.scalars)
        .map((scalarKey) => `scalar ${scalarKey}\n`)
        .join('');
    return scalarStrings + schemaString;
}
exports.wrapSchema = wrapSchema;
//# sourceMappingURL=index.js.map