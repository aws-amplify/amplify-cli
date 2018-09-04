import GraphQLTransform from "graphql-transformer-core";
import { CustomTransformer } from "./CustomTransformer";
import AppSyncTransformer from 'graphql-appsync-transformer';

import fs = require('fs');

const validSchema = `type Post @model(queries: { get: "customGetPost", list: "customListPost", query: "customQueryPost" }) {
    id: ID!
    title: String!
    upvotes: Int
    downvotes: Int
    percantageUp: Float
    comments: [String]
    isPublished: Boolean
}

type User @model {
    id: ID!
    name: String!
}
`;

// const transformer = new GraphQLTransform({
//     transformers: [
//         new AppSyncTransformer(),
//         new DynamoDBModelTransformer()
//     ]
// });
// const out = transformer.transform(validSchema);
// fs.writeFile('cf.out.json', JSON.stringify(out, null, 4), (err) => {
//     if (err) {
//         throw err;
//     }
//     console.log('SUCCESS!');
// });
