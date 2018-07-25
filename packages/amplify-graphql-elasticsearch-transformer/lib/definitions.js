"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var amplify_graphql_transformer_common_1 = require("amplify-graphql-transformer-common");
var STRING_CONDITIONS = ['eq', 'match', 'matchPhrase', 'matchPhrasePrefix', 'multiMatch', 'exists', 'wildcard', 'regexp'];
var ID_CONDITIONS = ['eq', 'match', 'matchPhrase', 'matchPhrasePrefix', 'multiMatch', 'exists', 'wildcard', 'regexp'];
var INT_CONDITIONS = ['gt', 'lt', 'gte', 'lte', 'eq', 'range'];
var FLOAT_CONDITIONS = ['gt', 'lt', 'gte', 'lte', 'eq', 'range'];
var BOOLEAN_CONDITIONS = ['eq', 'ne'];
function makeSearchableScalarInputObject(type) {
    var name = amplify_graphql_transformer_common_1.graphqlName("Searchable" + type + "FilterInput");
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
exports.makeSearchableScalarInputObject = makeSearchableScalarInputObject;
function makeSearchableXFilterInputObject(obj) {
    var name = amplify_graphql_transformer_common_1.graphqlName("Searchable" + obj.name.value + "FilterInput");
    var fields = obj.fields
        .filter(function (field) { return amplify_graphql_transformer_common_1.isScalar(field.type) === true; })
        .map(function (field) { return ({
        kind: graphql_1.Kind.INPUT_VALUE_DEFINITION,
        name: field.name,
        type: amplify_graphql_transformer_common_1.makeNamedType('Searchable' + amplify_graphql_transformer_common_1.getBaseType(field.type) + 'FilterInput'),
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
        kind: graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION,
        name: {
            kind: 'Name',
            value: name
        },
        fields: fields,
        directives: []
    };
}
exports.makeSearchableXFilterInputObject = makeSearchableXFilterInputObject;
function makeSearchableSortDirectionEnumObject() {
    var name = amplify_graphql_transformer_common_1.graphqlName("SearchableSortDirection");
    return {
        kind: graphql_1.Kind.ENUM_TYPE_DEFINITION,
        name: {
            kind: 'Name',
            value: name
        },
        values: [
            {
                kind: graphql_1.Kind.ENUM_VALUE_DEFINITION,
                name: { kind: 'Name', value: 'asc' },
                directives: []
            },
            {
                kind: graphql_1.Kind.ENUM_VALUE_DEFINITION,
                name: { kind: 'Name', value: 'desc' },
                directives: []
            }
        ],
        directives: []
    };
}
exports.makeSearchableSortDirectionEnumObject = makeSearchableSortDirectionEnumObject;
function makeSearchableXSortableFieldsEnumObject(obj) {
    var name = amplify_graphql_transformer_common_1.graphqlName("Searchable" + obj.name.value + "SortableFields");
    var values = obj.fields
        .filter(function (field) { return amplify_graphql_transformer_common_1.isScalar(field.type) === true; })
        .map(function (field) { return ({
        kind: graphql_1.Kind.ENUM_VALUE_DEFINITION,
        name: field.name,
        directives: []
    }); });
    return {
        kind: graphql_1.Kind.ENUM_TYPE_DEFINITION,
        name: {
            kind: 'Name',
            value: name
        },
        values: values,
        directives: []
    };
}
exports.makeSearchableXSortableFieldsEnumObject = makeSearchableXSortableFieldsEnumObject;
function makeSearchableXSortInputObject(obj) {
    var name = amplify_graphql_transformer_common_1.graphqlName("Searchable" + obj.name.value + "SortInput");
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
        fields: [
            {
                kind: graphql_1.Kind.INPUT_VALUE_DEFINITION,
                name: { kind: 'Name', value: 'field' },
                type: amplify_graphql_transformer_common_1.makeNamedType("Searchable" + obj.name.value + "SortableFields"),
                // TODO: Service does not support new style descriptions so wait.
                // description: {
                //     kind: 'StringValue',
                //     value: `The id of the ${obj.name.value} to delete.`
                // },
                directives: []
            },
            {
                kind: graphql_1.Kind.INPUT_VALUE_DEFINITION,
                name: { kind: 'Name', value: 'direction' },
                type: amplify_graphql_transformer_common_1.makeNamedType('SearchableSortDirection'),
                // TODO: Service does not support new style descriptions so wait.
                // description: {
                //     kind: 'StringValue',
                //     value: `The id of the ${obj.name.value} to delete.`
                // },
                directives: []
            }
        ],
        directives: []
    };
}
exports.makeSearchableXSortInputObject = makeSearchableXSortInputObject;
function getScalarFilterInputType(condition, type, filterInputName) {
    switch (condition) {
        case 'range':
            return amplify_graphql_transformer_common_1.makeListType(amplify_graphql_transformer_common_1.makeNamedType(type));
        case 'exists':
            return amplify_graphql_transformer_common_1.makeNamedType('Boolean');
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