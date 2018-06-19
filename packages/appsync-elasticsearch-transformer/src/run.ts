import GraphQLTransform from "graphql-transform";
import { AppSyncSearchTransformer } from "./AppSyncSearchTransformer";

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
if (out) {
    console.log(out);
}
