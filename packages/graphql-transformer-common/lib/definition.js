"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var SCALARS = {
    String: true,
    Int: true,
    Float: true,
    Boolean: true,
    ID: true
};
function isScalar(type) {
    if (type.kind === graphql_1.Kind.NON_NULL_TYPE) {
        return isScalar(type.type);
    }
    else if (type.kind === graphql_1.Kind.LIST_TYPE) {
        return isScalar(type.type);
    }
    else {
        return Boolean(SCALARS[type.name.value]);
    }
}
exports.isScalar = isScalar;
function getBaseType(type) {
    if (type.kind === graphql_1.Kind.NON_NULL_TYPE) {
        return getBaseType(type.type);
    }
    else if (type.kind === graphql_1.Kind.LIST_TYPE) {
        return getBaseType(type.type);
    }
    else {
        return type.name.value;
    }
}
exports.getBaseType = getBaseType;
function unwrapNonNull(type) {
    if (type.kind === 'NonNullType') {
        return unwrapNonNull(type.type);
    }
    return type;
}
exports.unwrapNonNull = unwrapNonNull;
function wrapNonNull(type) {
    if (type.kind !== 'NonNullType') {
        return makeNonNullType(type);
    }
    return type;
}
exports.wrapNonNull = wrapNonNull;
function makeOperationType(operation, type) {
    return {
        kind: 'OperationTypeDefinition',
        operation: operation,
        type: {
            kind: 'NamedType',
            name: {
                kind: 'Name',
                value: type
            }
        }
    };
}
exports.makeOperationType = makeOperationType;
function makeSchema(operationTypes) {
    return {
        kind: graphql_1.Kind.SCHEMA_DEFINITION,
        operationTypes: operationTypes,
        directives: []
    };
}
exports.makeSchema = makeSchema;
function blankObject(name) {
    return {
        kind: 'ObjectTypeDefinition',
        name: {
            kind: 'Name',
            value: name
        },
        fields: [],
        directives: [],
        interfaces: []
    };
}
exports.blankObject = blankObject;
function blankObjectExtension(name) {
    return {
        kind: graphql_1.Kind.OBJECT_TYPE_EXTENSION,
        name: {
            kind: 'Name',
            value: name
        },
        fields: [],
        directives: [],
        interfaces: []
    };
}
exports.blankObjectExtension = blankObjectExtension;
function extensionWithFields(object, fields) {
    return __assign({}, object, { fields: object.fields.concat(fields) });
}
exports.extensionWithFields = extensionWithFields;
function makeField(name, args, type) {
    return {
        kind: graphql_1.Kind.FIELD_DEFINITION,
        name: {
            kind: 'Name',
            value: name
        },
        arguments: args,
        type: type,
        directives: []
    };
}
exports.makeField = makeField;
function makeArg(name, type) {
    return {
        kind: 'InputValueDefinition',
        name: {
            kind: 'Name',
            value: name
        },
        type: type,
        directives: []
    };
}
exports.makeArg = makeArg;
function makeNamedType(name) {
    return {
        kind: 'NamedType',
        name: {
            kind: 'Name',
            value: name
        }
    };
}
exports.makeNamedType = makeNamedType;
function makeNonNullType(type) {
    return {
        kind: graphql_1.Kind.NON_NULL_TYPE,
        type: type
    };
}
exports.makeNonNullType = makeNonNullType;
function makeListType(type) {
    return {
        kind: 'ListType',
        type: type
    };
}
exports.makeListType = makeListType;
//# sourceMappingURL=definition.js.map