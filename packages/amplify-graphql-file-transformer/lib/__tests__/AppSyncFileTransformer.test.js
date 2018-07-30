"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var amplify_graphql_transform_1 = require("amplify-graphql-transform");
var amplify_graphql_transformer_common_1 = require("amplify-graphql-transformer-common");
var amplify_graphql_dynamodb_transformer_1 = require("amplify-graphql-dynamodb-transformer");
var amplify_graphql_elasticsearch_transformer_1 = require("amplify-graphql-elasticsearch-transformer");
var AppSyncFileTransformer_1 = require("../AppSyncFileTransformer");
var fs = require("fs");
var path = require("path");
test('Test AppSyncFileTransformer validation happy case', function () {
    var validSchema = "\n    type Post @model @searchable {\n        id: ID!\n        title: String!\n        createdAt: String\n        updatedAt: String\n    }\n    ";
    var directory = './fileTest';
    var transformer = new amplify_graphql_transform_1.default({
        transformers: [
            new AppSyncFileTransformer_1.AppSyncFileTransformer(directory + '//'),
            new amplify_graphql_dynamodb_transformer_1.AppSyncDynamoDBTransformer(),
            new amplify_graphql_elasticsearch_transformer_1.AppSyncSearchableTransformer()
        ]
    });
    var out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    expect(fs.existsSync('./fileTest/schema.graphql')).toBeTruthy;
    expect(fs.existsSync('./fileTest/resolver/Mutation.createPost.request')).toBeTruthy;
    expect(fs.existsSync('./fileTest/resolver/Mutation.createPost.response')).toBeTruthy;
    expect(fs.existsSync('./fileTest/resolver/Query.getPost.request')).toBeTruthy;
    expect(fs.existsSync('./fileTest/resolver/Query.getPost.request')).toBeTruthy;
    expect(fs.existsSync('./fileTest/function/python_streaming_function.py')).toBeTruthy;
    cleanUpFiles(directory);
});
test('Test AppSyncFileTransformer with multiple model directives', function () {
    var validSchema = "\n    type Post @model {\n        id: ID!\n        title: String!\n        createdAt: String\n        updatedAt: String\n    }\n\n    type User @model {\n        id: ID!\n        name: String!\n    }\n    ";
    var directory = './fileTestTwo';
    var transformer = new amplify_graphql_transform_1.default({
        transformers: [
            new AppSyncFileTransformer_1.AppSyncFileTransformer(directory),
            new amplify_graphql_dynamodb_transformer_1.AppSyncDynamoDBTransformer()
        ]
    });
    var out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    var schema = out.Resources[amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID];
    expect(schema).toBeDefined();
    var definitionS3Location = schema.Properties.DefinitionS3Location;
    expect(definitionS3Location).toBeDefined();
    var schemaDefinition = readFile(directory + '/schema.graphql');
    expect(schemaDefinition).toBeDefined();
    var parsed = graphql_1.parse(schemaDefinition);
    var queryType = getObjectType(parsed, 'Query');
    expect(queryType).toBeDefined();
    expectFields(queryType, ['listPost']);
    expectFields(queryType, ['queryPost']);
    expectFields(queryType, ['listUser']);
    expectFields(queryType, ['queryUser']);
    expect(verifyInputCount(parsed, 'TableStringFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableBooleanFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableIntFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableFloatFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableIDFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TablePostFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableUserFilterInput', 1)).toBeTruthy;
    expect(fs.existsSync('./fileTestTwo/schema.graphql')).toBeTruthy;
    expect(fs.existsSync('./fileTestTwo/resolver/Mutation.createPost.request')).toBeTruthy;
    expect(fs.existsSync('./fileTestTwo/resolver/Mutation.createPost.response')).toBeTruthy;
    expect(fs.existsSync('./fileTestTwo/resolver/Mutation.createUser.request')).toBeTruthy;
    expect(fs.existsSync('./fileTestTwo/resolver/Mutation.createUser.response')).toBeTruthy;
    expect(fs.existsSync('./fileTestTwo/resolver/Query.getPost.request')).toBeTruthy;
    expect(fs.existsSync('./fileTestTwo/resolver/Query.getPost.request')).toBeTruthy;
    cleanUpFiles(directory);
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
function cleanUpFiles(directory) {
    var files = fs.readdirSync(directory);
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var file = files_1[_i];
        var dir = path.join(directory, file);
        console.log(file);
        if (!fs.lstatSync(dir).isDirectory()) {
            fs.unlinkSync(dir);
        }
        else {
            cleanUpFiles(dir);
        }
    }
    fs.rmdirSync(directory);
}
function readFile(filePath) {
    return fs.readFileSync(filePath, "utf8");
}
//# sourceMappingURL=AppSyncFileTransformer.test.js.map