"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_transform_1 = require("graphql-transform");
var graphql_transformer_common_1 = require("graphql-transformer-common");
var graphql_dynamodb_transformer_1 = require("graphql-dynamodb-transformer");
var AppSyncAuthTransformer_1 = require("../AppSyncAuthTransformer");
var graphql_appsync_transformer_1 = require("graphql-appsync-transformer");
test('Test AppSyncAuthTransformer validation happy case w/ static groups', function () {
    var validSchema = "\n    type Post @model @auth(allow: groups, groups: [\"Admin\", \"Dev\"]) {\n        id: ID!\n        title: String!\n        createdAt: String\n        updatedAt: String\n    }\n    ";
    var transformer = new graphql_transform_1.default({
        transformers: [
            new graphql_appsync_transformer_1.default(),
            new graphql_dynamodb_transformer_1.AppSyncDynamoDBTransformer(),
            new AppSyncAuthTransformer_1.AppSyncAuthTransformer()
        ]
    });
    var out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    expect(out.Resources[graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual('AMAZON_COGNITO_USER_POOLS');
});
test('Test AppSyncAuthTransformer validation happy case w/ dynamic groups', function () {
    var validSchema = "\n    type Post @model @auth(allow: groups, groupsField: \"groups\") {\n        id: ID!\n        title: String!\n        groups: [String]\n        createdAt: String\n        updatedAt: String\n    }\n    ";
    var transformer = new graphql_transform_1.default({
        transformers: [
            new graphql_appsync_transformer_1.default(),
            new graphql_dynamodb_transformer_1.AppSyncDynamoDBTransformer(),
            new AppSyncAuthTransformer_1.AppSyncAuthTransformer()
        ]
    });
    var out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    expect(out.Resources[graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual('AMAZON_COGNITO_USER_POOLS');
});
test('Test AppSyncAuthTransformer validation happy case w/ dynamic group', function () {
    var validSchema = "\n    type Post @model @auth(allow: groups, groupsField: \"group\") {\n        id: ID!\n        title: String!\n        group: String\n        createdAt: String\n        updatedAt: String\n    }\n    ";
    var transformer = new graphql_transform_1.default({
        transformers: [
            new graphql_appsync_transformer_1.default(),
            new graphql_dynamodb_transformer_1.AppSyncDynamoDBTransformer(),
            new AppSyncAuthTransformer_1.AppSyncAuthTransformer()
        ]
    });
    var out = transformer.transform(validSchema);
    console.log(JSON.stringify(out, null, 4));
    expect(out).toBeDefined();
    expect(out.Resources[graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual('AMAZON_COGNITO_USER_POOLS');
});
test('Test AppSyncAuthTransformer validation @auth on non @model. Should fail.', function () {
    try {
        var validSchema = "\n            type Post @auth(allow: groups, groupsField: \"groups\") {\n                id: ID!\n                title: String!\n                group: String\n                createdAt: String\n                updatedAt: String\n            }\n        ";
        var transformer = new graphql_transform_1.default({
            transformers: [
                new graphql_appsync_transformer_1.default(),
                new graphql_dynamodb_transformer_1.AppSyncDynamoDBTransformer(),
                new AppSyncAuthTransformer_1.AppSyncAuthTransformer()
            ]
        });
        var out = transformer.transform(validSchema);
        expect(true).toEqual(false);
    }
    catch (e) {
        expect(e).toBeDefined();
    }
});
//# sourceMappingURL=AppSyncGroupAuthTransformer.test.js.map