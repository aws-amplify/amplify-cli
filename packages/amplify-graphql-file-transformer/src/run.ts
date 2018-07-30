import GraphQLTransform from "amplify-graphql-transform";
import { AppSyncFileTransformer } from "./AppSyncFileTransformer";
import { AppSyncDynamoDBTransformer } from "amplify-graphql-dynamodb-transformer";
import { AppSyncSearchableTransformer } from "amplify-graphql-elasticsearch-transformer";

import fs = require('fs');

const validSchema = `type Post @model {
    id: ID!
    title: String!
    upvotes: Int
    downvotes: Int
    percantageUp: Float
    comments: [String]
    isPublished: Boolean
}`;

const transformer = new GraphQLTransform({
    transformers: [
        new AppSyncFileTransformer('./fileTest///'),
        new AppSyncDynamoDBTransformer(),
        new AppSyncSearchableTransformer()
    ]
});
const out = transformer.transform(validSchema);
fs.writeFile('cf.out.json', JSON.stringify(out, null, 4), (err) => {
    if (err) {
        throw err;
    }
    console.log('SUCCESS!');
});
