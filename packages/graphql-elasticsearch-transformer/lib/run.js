"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_transform_1 = require("graphql-transform");
var _1 = require("./");
var graphql_dynamodb_transformer_1 = require("graphql-dynamodb-transformer");
var graphql_appsync_transformer_1 = require("graphql-appsync-transformer");
var fs = require("fs");
var validSchema = "\ntype Post @model @searchable {\n    id: ID!\n    title: String!\n    upvotes: Int\n    downvotes: Int\n    percantageUp: Float\n    comments: [String]\n    isPublished: Boolean\n}";
var transformer = new graphql_transform_1.default({
    transformers: [
        new graphql_appsync_transformer_1.AppSyncTransformer(),
        new graphql_dynamodb_transformer_1.AppSyncDynamoDBTransformer(),
        new _1.AppSyncSearchableTransformer()
    ]
});
var out = transformer.transform(validSchema);
fs.writeFile('cf.out.json', JSON.stringify(out, null, 4), function (err) {
    if (err) {
        throw err;
    }
    console.log('SUCCESS!');
});
//# sourceMappingURL=run.js.map