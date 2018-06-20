import GraphQLTransform from "graphql-transform";
import { AppSyncSearchTransformer } from "./AppSyncSearchTransformer";

import fs = require('fs');

const validSchema = `
type Post {
    id: ID!
    title: String! @search
    rating: Int! @search
    tags: [String] @search
}`;

const transformer = new GraphQLTransform({
    transformers: [new AppSyncSearchTransformer()]
});
const out = transformer.transform(validSchema);
fs.writeFile('cf.out.json', JSON.stringify(out, null, 4), (err) => {
    if (err) {
        throw err;
    }
    console.log('SUCCESS!');
});
