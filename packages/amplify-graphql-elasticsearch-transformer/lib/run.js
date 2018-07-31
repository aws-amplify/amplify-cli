"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var amplify_graphql_transform_1 = require("amplify-graphql-transform");
var _1 = require("./");
var amplify_graphql_dynamodb_transformer_1 = require("amplify-graphql-dynamodb-transformer");
var amplify_graphql_file_transformer_1 = require("amplify-graphql-file-transformer");
var fs = require("fs");
var validSchema = "\ntype Post @model @searchable {\n    id: ID!\n    title: String!\n    upvotes: Int\n    downvotes: Int\n    percantageUp: Float\n    comments: [String]\n    isPublished: Boolean\n}";
var transformer = new amplify_graphql_transform_1.default({
    transformers: [
        new amplify_graphql_file_transformer_1.AppSyncFileTransformer(),
        new amplify_graphql_dynamodb_transformer_1.AppSyncDynamoDBTransformer(),
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