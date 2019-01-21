import GraphQLTransform from "graphql-transformer-core";
import { ViewerTransformer } from "./ViewerTransformer";
import AppSyncTransformer from 'graphql-appsync-transformer';
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer';

import fs = require('fs');

const validSchema = `
type User @model @viewer {
    id: ID!
    name: String!
}
`;

const transformer = new GraphQLTransform({
    transformers: [
        new AppSyncTransformer(),
        new DynamoDBModelTransformer(),
        new ViewerTransformer()
    ]
});
const out = transformer.transform(validSchema);
fs.writeFile('cf.out.json', JSON.stringify(out, null, 4), (err) => {
    if (err) {
        throw err;
    }
    console.log('SUCCESS!');
});
