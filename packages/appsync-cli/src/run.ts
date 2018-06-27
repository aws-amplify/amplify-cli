import GraphQLTransform from "graphql-transform";
import DynamoDBTransformer from 'appsync-dynamodb-transformer'
import { AppSyncSearchableTransformer } from 'appsync-elasticsearch-transformer'

import fs = require('fs');

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

const transformer = new GraphQLTransform({
    transformers: [
        new DynamoDBTransformer(),
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
