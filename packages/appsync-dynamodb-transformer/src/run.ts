import GraphQLTransform from "graphql-transform";
import { AppSyncDynamoDBTransformer } from "./AppSyncDynamoDBTransformer";

const validSchema = `type Post @model {
    id: ID!
    title: String!
    rating: Int!
    tags: [String]
}`;

const transformer = new GraphQLTransform({
    transformers: [new AppSyncDynamoDBTransformer()]
});
const out = transformer.transform(validSchema);
if (out) {
    console.log(out);
}
