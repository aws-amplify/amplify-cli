"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_transform_1 = require("graphql-transform");
var AppSyncDynamoDBTransformer_1 = require("./AppSyncDynamoDBTransformer");
var graphql_appsync_transformer_1 = require("graphql-appsync-transformer");
var fs = require("fs");
var validSchema = "type Post @model(queries: { get: \"customGetPost\", list: \"customListPost\", query: \"customQueryPost\" }) {\n    id: ID!\n    title: String!\n    upvotes: Int\n    downvotes: Int\n    percantageUp: Float\n    comments: [String]\n    isPublished: Boolean\n}\n\ntype User @model {\n    id: ID!\n    name: String!\n}\n";
var transformer = new graphql_transform_1.default({
    transformers: [
        new graphql_appsync_transformer_1.default(),
        new AppSyncDynamoDBTransformer_1.AppSyncDynamoDBTransformer()
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