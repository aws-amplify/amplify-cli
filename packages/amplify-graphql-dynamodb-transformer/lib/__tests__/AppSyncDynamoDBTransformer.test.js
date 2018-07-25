"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var amplify_graphql_transform_1 = require("amplify-graphql-transform");
var amplify_graphql_transformer_common_1 = require("amplify-graphql-transformer-common");
var AppSyncDynamoDBTransformer_1 = require("../AppSyncDynamoDBTransformer");
test('Test AppSyncDynamoDBTransformer validation happy case', function () {
    var validSchema = "\n    type Post @model {\n        id: ID!\n        title: String!\n        createdAt: String\n        updatedAt: String\n    }\n    ";
    var transformer = new amplify_graphql_transform_1.default({
        transformers: [
            new AppSyncDynamoDBTransformer_1.AppSyncDynamoDBTransformer()
        ]
    });
    var out = transformer.transform(validSchema);
    expect(out).toBeDefined();
});
test('Test AppSyncDynamoDBTransformer with query overrides', function () {
    var validSchema = "type Post @model(queries: { get: \"customGetPost\", list: \"customListPost\", query: \"customQueryPost\" }) {\n        id: ID!\n        title: String!\n        createdAt: String\n        updatedAt: String\n    }\n    ";
    var transformer = new amplify_graphql_transform_1.default({
        transformers: [
            new AppSyncDynamoDBTransformer_1.AppSyncDynamoDBTransformer()
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
    expectFields(queryType, ['customGetPost']);
    expectFields(queryType, ['customListPost']);
    expectFields(queryType, ['customQueryPost']);
});
test('Test AppSyncDynamoDBTransformer with mutation overrides', function () {
    var validSchema = "type Post @model(mutations: { create: \"customCreatePost\", update: \"customUpdatePost\", delete: \"customDeletePost\" }) { \n        id: ID!\n        title: String!\n        createdAt: String\n        updatedAt: String\n    }\n    ";
    var transformer = new amplify_graphql_transform_1.default({
        transformers: [
            new AppSyncDynamoDBTransformer_1.AppSyncDynamoDBTransformer()
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
    expectFields(mutationType, ['customCreatePost', 'customUpdatePost', 'customDeletePost']);
});
test('Test AppSyncDynamoDBTransformer with only create mutations', function () {
    var validSchema = "type Post @model(mutations: { create: \"customCreatePost\" }) { \n        id: ID!\n        title: String!\n        createdAt: String\n        updatedAt: String\n    }\n    ";
    var transformer = new amplify_graphql_transform_1.default({
        transformers: [
            new AppSyncDynamoDBTransformer_1.AppSyncDynamoDBTransformer()
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
test('Test AppSyncDynamoDBTransformer with multiple model directives', function () {
    var validSchema = "\n    type Post @model {\n        id: ID!\n        title: String!\n        createdAt: String\n        updatedAt: String\n    }\n\n    type User @model {\n        id: ID!\n        name: String!\n    }\n    ";
    var transformer = new amplify_graphql_transform_1.default({
        transformers: [
            new AppSyncDynamoDBTransformer_1.AppSyncDynamoDBTransformer()
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
    expectFields(queryType, ['listPost']);
    expectFields(queryType, ['listUser']);
    var stringInputType = getInputType(parsed, 'TableStringFilterInput');
    expect(stringInputType).toBeDefined();
    var booleanInputType = getInputType(parsed, 'TableBooleanFilterInput');
    expect(booleanInputType).toBeDefined();
    var intInputType = getInputType(parsed, 'TableIntFilterInput');
    expect(intInputType).toBeDefined();
    var floatInputType = getInputType(parsed, 'TableFloatFilterInput');
    expect(floatInputType).toBeDefined();
    var idInputType = getInputType(parsed, 'TableIDFilterInput');
    expect(idInputType).toBeDefined();
    var postInputType = getInputType(parsed, 'TablePostFilterInput');
    expect(postInputType).toBeDefined();
    var userInputType = getInputType(parsed, 'TableUserFilterInput');
    expect(userInputType).toBeDefined();
    expect(verifyInputCount(parsed, 'TableStringFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableBooleanFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableIntFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableFloatFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableIDFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TablePostFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableUserFilterInput', 1)).toBeTruthy;
});
test('Test AppSyncDynamoDBTransformer with query filter', function () {
    var validSchema = "\n    type Post @model {\n        id: ID!\n        title: String!\n        createdAt: String\n        updatedAt: String\n    }";
    var transformer = new amplify_graphql_transform_1.default({
        transformers: [
            new AppSyncDynamoDBTransformer_1.AppSyncDynamoDBTransformer()
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
    expectFields(queryType, ['listPost']);
    expectFields(queryType, ['queryPost']);
    var connectionType = getObjectType(parsed, 'TablePostConnectionType');
    expect(connectionType).toBeDefined;
    expect(verifyInputCount(parsed, 'TableStringFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableBooleanFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableIntFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableFloatFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableIDFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TablePostFilterInput', 1)).toBeTruthy;
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
//# sourceMappingURL=AppSyncDynamoDBTransformer.test.js.map