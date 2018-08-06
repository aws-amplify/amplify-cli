import GraphQLTransform from "graphql-transform";
import { AppSyncTransformer } from "./AppSyncTransformer";
import { AppSyncDynamoDBTransformer } from "graphql-dynamodb-transformer";
import { AppSyncSearchableTransformer } from "graphql-elasticsearch-transformer";

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
        new AppSyncTransformer('./fileTest///'),
        new AppSyncDynamoDBTransformer()
    ]
});
const out = transformer.transform(validSchema);
fs.writeFile('cf.out.json', JSON.stringify(out, null, 4), (err) => {
    if (err) {
        throw err;
    }
    console.log('SUCCESS!');
});
