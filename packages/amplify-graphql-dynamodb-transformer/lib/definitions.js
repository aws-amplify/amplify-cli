"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var amplify_graphql_transformer_common_1 = require("amplify-graphql-transformer-common");
var STRING_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'contains', 'notContains', 'between', 'beginsWith'];
var ID_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'contains', 'notContains', 'between', 'beginsWith'];
var INT_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'contains', 'notContains', 'between'];
var FLOAT_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'contains', 'notContains', 'between'];
var BOOLEAN_CONDITIONS = ['ne', 'eq'];
function makeCreateInputObject(obj) {
    var name = amplify_graphql_transformer_common_1.graphqlName("Create" + amplify_graphql_transformer_common_1.toUpper(obj.name.value) + 'Input');
    var fields = obj.fields
        .filter(function (field) { return field.name.value !== 'id'; })
        .map(function (field) { return ({
        kind: graphql_1.Kind.INPUT_VALUE_DEFINITION,
        name: field.name,
        type: field.type,
        // TODO: Service does not support new style descriptions so wait.
        // description: field.description,
        directives: []
    }); });
    return {
        kind: 'InputObjectTypeDefinition',
        // TODO: Service does not support new style descriptions so wait.
        // description: {
        //     kind: 'StringValue',
        //     value: `Input type for ${obj.name.value} mutations`
        // },
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
    var name = amplify_graphql_transformer_common_1.graphqlName('Update' + amplify_graphql_transformer_common_1.toUpper(obj.name.value) + 'Input');
    var fields = obj.fields
        .map(function (field) { return ({
        kind: graphql_1.Kind.INPUT_VALUE_DEFINITION,
        name: field.name,
        type: field.name.value === 'id' ?
            amplify_graphql_transformer_common_1.wrapNonNull(field.type) :
            amplify_graphql_transformer_common_1.unwrapNonNull(field.type),
        // TODO: Service does not support new style descriptions so wait.
        // description: field.description,
        directives: []
    }); });
    return {
        kind: graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION,
        // TODO: Service does not support new style descriptions so wait.
        // description: {
        //     kind: 'StringValue',
        //     value: `Input type for ${obj.name.value} mutations`
        // },
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
    var name = amplify_graphql_transformer_common_1.graphqlName('Delete' + amplify_graphql_transformer_common_1.toUpper(obj.name.value) + 'Input');
    return {
        kind: graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION,
        // TODO: Service does not support new style descriptions so wait.
        // description: {
        //     kind: 'StringValue',
        //     value: `Input type for ${obj.name.value} delete mutations`
        // },
        name: {
            kind: 'Name',
            value: name
        },
        fields: [{
                kind: graphql_1.Kind.INPUT_VALUE_DEFINITION,
                name: { kind: 'Name', value: 'id' },
                type: amplify_graphql_transformer_common_1.makeNamedType('ID'),
                // TODO: Service does not support new style descriptions so wait.
                // description: {
                //     kind: 'StringValue',
                //     value: `The id of the ${obj.name.value} to delete.`
                // },
                directives: []
            }],
        directives: []
    };
}
exports.makeDeleteInputObject = makeDeleteInputObject;
function makeTableXFilterInputObject(obj) {
    var name = amplify_graphql_transformer_common_1.graphqlName("Table" + obj.name.value + "FilterInput");
    var fields = obj.fields
        .filter(function (field) { return amplify_graphql_transformer_common_1.isScalar(field.type) === true; })
        .map(function (field) { return ({
        kind: graphql_1.Kind.INPUT_VALUE_DEFINITION,
        name: field.name,
        type: amplify_graphql_transformer_common_1.makeNamedType('Table' + amplify_graphql_transformer_common_1.getBaseType(field.type) + 'FilterInput'),
        // TODO: Service does not support new style descriptions so wait.
        // description: field.description,
        directives: []
    }); });
    fields.push({
        kind: graphql_1.Kind.INPUT_VALUE_DEFINITION,
        name: {
            kind: 'Name',
            value: 'and'
        },
        type: amplify_graphql_transformer_common_1.makeListType(amplify_graphql_transformer_common_1.makeNamedType(name)),
        // TODO: Service does not support new style descriptions so wait.
        // description: field.description,
        directives: []
    }, {
        kind: graphql_1.Kind.INPUT_VALUE_DEFINITION,
        name: {
            kind: 'Name',
            value: 'or'
        },
        type: amplify_graphql_transformer_common_1.makeListType(amplify_graphql_transformer_common_1.makeNamedType(name)),
        // TODO: Service does not support new style descriptions so wait.
        // description: field.description,
        directives: []
    }, {
        kind: graphql_1.Kind.INPUT_VALUE_DEFINITION,
        name: {
            kind: 'Name',
            value: 'not'
        },
        type: amplify_graphql_transformer_common_1.makeNamedType(name),
        // TODO: Service does not support new style descriptions so wait.
        // description: field.description,
        directives: []
    });
    return {
        kind: 'InputObjectTypeDefinition',
        // TODO: Service does not support new style descriptions so wait.
        // description: {
        //     kind: 'StringValue',
        //     value: `Input type for ${obj.name.value} mutations`
        // },
        name: {
            kind: 'Name',
            value: name
        },
        fields: fields,
        directives: []
    };
}
exports.makeTableXFilterInputObject = makeTableXFilterInputObject;
function makeTableSortDirectionEnumObject() {
    var name = amplify_graphql_transformer_common_1.graphqlName('TableSortDirection');
    return {
        kind: graphql_1.Kind.ENUM_TYPE_DEFINITION,
        name: {
            kind: 'Name',
            value: name
        },
        values: [
            {
                kind: graphql_1.Kind.ENUM_VALUE_DEFINITION,
                name: { kind: 'Name', value: 'ASC' },
                directives: []
            },
            {
                kind: graphql_1.Kind.ENUM_VALUE_DEFINITION,
                name: { kind: 'Name', value: 'DESC' },
                directives: []
            }
        ],
        directives: []
    };
}
exports.makeTableSortDirectionEnumObject = makeTableSortDirectionEnumObject;
function makeTableScalarFilterInputObject(type) {
    var name = amplify_graphql_transformer_common_1.graphqlName("Table" + type + "FilterInput");
    var conditions = getScalarConditions(type);
    var fields = conditions
        .map(function (condition) { return ({
        kind: graphql_1.Kind.INPUT_VALUE_DEFINITION,
        name: { kind: "Name", value: condition },
        type: getScalarFilterInputType(condition, type, name),
        // TODO: Service does not support new style descriptions so wait.
        // description: field.description,
        directives: []
    }); });
    return {
        kind: graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION,
        // TODO: Service does not support new style descriptions so wait.
        // description: {
        //     kind: 'StringValue',
        //     value: `Input type for ${obj.name.value} mutations`
        // },
        name: {
            kind: 'Name',
            value: name
        },
        fields: fields,
        directives: []
    };
}
exports.makeTableScalarFilterInputObject = makeTableScalarFilterInputObject;
function getScalarFilterInputType(condition, type, filterInputName) {
    switch (condition) {
        case 'between':
            return amplify_graphql_transformer_common_1.makeListType(amplify_graphql_transformer_common_1.makeNamedType(type));
        case 'and':
        case 'or':
            return amplify_graphql_transformer_common_1.makeNamedType(filterInputName);
        default:
            return amplify_graphql_transformer_common_1.makeNamedType(type);
    }
}
function getScalarConditions(type) {
    switch (type) {
        case 'String':
            return STRING_CONDITIONS;
        case 'ID':
            return ID_CONDITIONS;
        case 'Int':
            return INT_CONDITIONS;
        case 'Float':
            return FLOAT_CONDITIONS;
        case 'Boolean':
            return BOOLEAN_CONDITIONS;
        default:
            throw 'Valid types are String, ID, Int, Float, Boolean';
    }
}
//# sourceMappingURL=definitions.js.map