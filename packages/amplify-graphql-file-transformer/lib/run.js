"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var amplify_graphql_transform_1 = require("amplify-graphql-transform");
var AppSyncFileTransformer_1 = require("./AppSyncFileTransformer");
var amplify_graphql_dynamodb_transformer_1 = require("amplify-graphql-dynamodb-transformer");
var fs = require("fs");
var validSchema = "type Post @model {\n    id: ID!\n    title: String!\n    upvotes: Int\n    downvotes: Int\n    percantageUp: Float\n    comments: [String]\n    isPublished: Boolean\n}";
var transformer = new amplify_graphql_transform_1.default({
    transformers: [
        new AppSyncFileTransformer_1.AppSyncFileTransformer('./fileTest///'),
        new amplify_graphql_dynamodb_transformer_1.AppSyncDynamoDBTransformer()
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