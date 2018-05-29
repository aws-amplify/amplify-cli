"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
function makeCreateInputObject(obj) {
    var name = util_1.graphqlName("Create" + util_1.toUpper(obj.name.value) + 'Input');
    var fields = obj.fields
        .filter(function (field) { return field.name.value !== 'id'; })
        .map(function (field) { return ({
        kind: 'InputValueDefinition',
        name: field.name,
        type: field.type,
        description: field.description,
        directives: []
    }); });
    return {
        kind: 'InputObjectTypeDefinition',
        description: "Input type for " + obj.name.value + " mutations",
        name: {
            kind: 'Name',
            value: name
        },
        fields: fields,
        directives: []
    };
}
exports.makeCreateInputObject = makeCreateInputObject;
function makeUpdateInputObject(obj) {
    var name = util_1.graphqlName('Update' + util_1.toUpper(obj.name.value) + 'Input');
    var fields = obj.fields
        .map(function (field) { return ({
        kind: 'InputValueDefinition',
        name: field.name,
        type: field.name.value === 'id' ?
            wrapNonNull(field.type) :
            unwrapNonNull(field.type),
        description: field.description,
        directives: []
    }); });
    return {
        kind: 'InputObjectTypeDefinition',
        description: "Input type for " + obj.name.value + " mutations",
        name: {
            kind: 'Name',
            value: name
        },
        fields: fields,
        directives: []
    };
}
exports.makeUpdateInputObject = makeUpdateInputObject;
function makeDeleteInputObject(obj) {
    var name = util_1.graphqlName('Delete' + util_1.toUpper(obj.name.value) + 'Input');
    return {
        kind: 'InputObjectTypeDefinition',
        description: "Input type for " + obj.name.value + " delete mutations",
        name: {
            kind: 'Name',
            value: name
        },
        fields: [{
                kind: 'InputValueDefinition',
                name: { kind: 'Name', value: 'id' },
                type: makeNamedType('ID'),
                description: "The id of the " + obj.name.value + " to delete.",
                directives: []
            }],
        directives: []
    };
}
exports.makeDeleteInputObject = makeDeleteInputObject;
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
//# sourceMappingURL=definitions.js.map