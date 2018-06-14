"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
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
        kind: 'SchemaDefinition',
        operationTypes: operationTypes
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
        kind: 'ObjectTypeExtensionDefinition',
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
function makeField(name, args, type) {
    return {
        kind: 'FieldDefinition',
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
        kind: 'NonNullType',
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
function makeConnection(type) {
    return {
        kind: 'ObjectTypeDefinition',
        name: {
            kind: 'Name',
            value: util_1.graphqlName(util_1.toUpper(type.name.value) + "Connection")
        },
        fields: [
            makeField("items", [], { kind: 'ListType', type: type }),
            makeField("total", [], { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } }),
            makeField("nextToken", [], { kind: 'NamedType', name: { kind: 'Name', value: 'String' } })
        ],
        directives: [],
        interfaces: []
    };
}
exports.makeConnection = makeConnection;
//# sourceMappingURL=definitions.js.map