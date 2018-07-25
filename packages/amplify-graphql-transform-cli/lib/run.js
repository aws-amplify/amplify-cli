"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const amplify_graphql_transform_1 = require("amplify-graphql-transform");
const amplify_graphql_dynamodb_transformer_1 = require("amplify-graphql-dynamodb-transformer");
const amplify_graphql_elasticsearch_transformer_1 = require("amplify-graphql-elasticsearch-transformer");
const fs = require("fs");
const validSchema = `
type Post @model @searchable {
    id: ID!
    title: String!
    upvotes: Int
    downvotes: Int
    percantageUp: Float
    comments: [String]
    isPublished: Boolean
}`;
const transformer = new amplify_graphql_transform_1.default({
    transformers: [
        new amplify_graphql_dynamodb_transformer_1.default(),
        new amplify_graphql_elasticsearch_transformer_1.AppSyncSearchableTransformer()
    ]
});
const out = transformer.transform(validSchema);
fs.writeFile('cf.out.json', JSON.stringify(out, null, 4), (err) => {
    if (err) {
        throw err;
    }
    console.log('SUCCESS!');
});
//# sourceMappingURL=run.js.map