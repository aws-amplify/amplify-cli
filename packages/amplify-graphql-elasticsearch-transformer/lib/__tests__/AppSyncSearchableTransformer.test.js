"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var amplify_graphql_transform_1 = require("amplify-graphql-transform");
var amplify_graphql_transformer_common_1 = require("amplify-graphql-transformer-common");
var amplify_graphql_dynamodb_transformer_1 = require("amplify-graphql-dynamodb-transformer");
var AppSyncSearchableTransformer_1 = require("../AppSyncSearchableTransformer");
test('Test AppSyncSearchableTransformer validation happy case', function () {
    var validSchema = "\n    type Post @model @searchable {\n        id: ID!\n        title: String!\n        createdAt: String\n        updatedAt: String\n    }\n    ";
    var transformer = new amplify_graphql_transform_1.default({
        transformers: [
            new amplify_graphql_dynamodb_transformer_1.default(),
            new AppSyncSearchableTransformer_1.AppSyncSearchableTransformer()
        ]
    });
    var out = transformer.transform(validSchema);
    expect(out).toBeDefined();
});
test('Test AppSyncSearchableTransformer with query overrides', function () {
    var validSchema = "type Post @model @searchable(queries: { search: \"customSearchPost\" }) {\n        id: ID!\n        title: String!\n        createdAt: String\n        updatedAt: String\n    }\n    ";
    var transformer = new amplify_graphql_transform_1.default({
        transformers: [
            new amplify_graphql_dynamodb_transformer_1.default(),
            new AppSyncSearchableTransformer_1.AppSyncSearchableTransformer()
        ]
    });
    var out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    var schema = out.Resources[amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID];
    expect(schema).toBeDefined();
    var definition = schema.Properties.Definition;
    expect(definition).toBeDefined();
    var parsed = graphql_1.parse(definition);
    var queryType = getObjectType(parsed, 'Query');
    expect(queryType).toBeDefined();
    expectFields(queryType, ['customSearchPost']);
});
test('Test AppSyncSearchableTransformer with only create mutations', function () {
    var validSchema = "type Post @model(mutations: { create: \"customCreatePost\" }) @searchable { \n        id: ID!\n        title: String!\n        createdAt: String\n        updatedAt: String\n    }\n    ";
    var transformer = new amplify_graphql_transform_1.default({
        transformers: [
            new amplify_graphql_dynamodb_transformer_1.default(),
            new AppSyncSearchableTransformer_1.AppSyncSearchableTransformer()
        ]
    });
    var out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    var schema = out.Resources[amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID];
    expect(schema).toBeDefined();
    var definition = schema.Properties.Definition;
    expect(definition).toBeDefined();
    var parsed = graphql_1.parse(definition);
    var mutationType = getObjectType(parsed, 'Mutation');
    expect(mutationType).toBeDefined();
    expectFields(mutationType, ['customCreatePost']);
    doNotExpectFields(mutationType, ['updatePost']);
});
test('Test AppSyncSearchableTransformer with multiple model searchable directives', function () {
    var validSchema = "\n    type Post @model @searchable {\n        id: ID!\n        title: String!\n        createdAt: String\n        updatedAt: String\n    }\n\n    type User @model @searchable {\n        id: ID!\n        name: String!\n    }\n    ";
    var transformer = new amplify_graphql_transform_1.default({
        transformers: [
            new amplify_graphql_dynamodb_transformer_1.default(),
            new AppSyncSearchableTransformer_1.AppSyncSearchableTransformer()
        ]
    });
    var out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    var schema = out.Resources[amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID];
    expect(schema).toBeDefined();
    var definition = schema.Properties.Definition;
    expect(definition).toBeDefined();
    var parsed = graphql_1.parse(definition);
    var queryType = getObjectType(parsed, 'Query');
    expect(queryType).toBeDefined();
    expectFields(queryType, ['searchPost']);
    expectFields(queryType, ['searchUser']);
    var stringInputType = getInputType(parsed, 'SearchableStringFilterInput');
    expect(stringInputType).toBeDefined();
    var booleanInputType = getInputType(parsed, 'SearchableBooleanFilterInput');
    expect(booleanInputType).toBeDefined();
    var intInputType = getInputType(parsed, 'SearchableIntFilterInput');
    expect(intInputType).toBeDefined();
    var floatInputType = getInputType(parsed, 'SearchableFloatFilterInput');
    expect(floatInputType).toBeDefined();
    var idInputType = getInputType(parsed, 'SearchableIDFilterInput');
    expect(idInputType).toBeDefined();
    var postInputType = getInputType(parsed, 'SearchablePostFilterInput');
    expect(postInputType).toBeDefined();
    var userInputType = getInputType(parsed, 'SearchableUserFilterInput');
    expect(userInputType).toBeDefined();
    expect(verifyInputCount(parsed, 'TableStringFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableBooleanFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableIntFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableFloatFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableIDFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TablePostFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableUserFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'SearchableStringFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'SearchableBooleanFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'SearchableIntFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'SearchableFloatFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableIDFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'SearchablePostFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'SearchableUserFilterInput', 1)).toBeTruthy;
});
test('Test AppSyncSearchableTransformer with sort fields', function () {
    var validSchema = "\n    type Post @model @searchable {\n        id: ID!\n        title: String!\n        createdAt: String\n        updatedAt: String\n    }\n    ";
    var transformer = new amplify_graphql_transform_1.default({
        transformers: [
            new amplify_graphql_dynamodb_transformer_1.default(),
            new AppSyncSearchableTransformer_1.AppSyncSearchableTransformer()
        ]
    });
    var out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    var schema = out.Resources[amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID];
    expect(schema).toBeDefined();
    var definition = schema.Properties.Definition;
    expect(definition).toBeDefined();
    var parsed = graphql_1.parse(definition);
    var queryType = getObjectType(parsed, 'Query');
    expect(queryType).toBeDefined();
    expectFields(queryType, ['searchPost']);
    var stringInputType = getInputType(parsed, 'SearchableStringFilterInput');
    expect(stringInputType).toBeDefined();
    var booleanInputType = getInputType(parsed, 'SearchableBooleanFilterInput');
    expect(booleanInputType).toBeDefined();
    var intInputType = getInputType(parsed, 'SearchableIntFilterInput');
    expect(intInputType).toBeDefined();
    var floatInputType = getInputType(parsed, 'SearchableFloatFilterInput');
    expect(floatInputType).toBeDefined();
    var idInputType = getInputType(parsed, 'SearchableIDFilterInput');
    expect(idInputType).toBeDefined();
    var postInputType = getInputType(parsed, 'SearchablePostFilterInput');
    expect(postInputType).toBeDefined();
    var sortInputType = getInputType(parsed, 'SearchablePostSortInput');
    expect(sortInputType).toBeDefined();
    expect(verifyInputCount(parsed, 'TableStringFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableBooleanFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableIntFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableFloatFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableIDFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TablePostFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'SearchableStringFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'SearchableBooleanFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'SearchableIntFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'SearchableFloatFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableIDFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'SearchablePostFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'SearchablePostSortInput', 1)).toBeTruthy;
});
function expectFields(type, fields) {
    var _loop_1 = function (fieldName) {
        var foundField = type.fields.find(function (f) { return f.name.value === fieldName; });
        expect(foundField).toBeDefined();
    };
    for (var _i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
        var fieldName = fields_1[_i];
        _loop_1(fieldName);
    }
}
function doNotExpectFields(type, fields) {
    var _loop_2 = function (fieldName) {
        expect(type.fields.find(function (f) { return f.name.value === fieldName; })).toBeUndefined();
    };
    for (var _i = 0, fields_2 = fields; _i < fields_2.length; _i++) {
        var fieldName = fields_2[_i];
        _loop_2(fieldName);
    }
}
function getObjectType(doc, type) {
    return doc.definitions.find(function (def) { return def.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION && def.name.value === type; });
}
function getInputType(doc, type) {
    return doc.definitions.find(function (def) { return def.kind === graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type; });
}
function verifyInputCount(doc, type, count) {
    return doc.definitions.filter(function (def) { return def.kind === graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type; }).length == count;
}
//# sourceMappingURL=AppSyncSearchableTransformer.test.js.map