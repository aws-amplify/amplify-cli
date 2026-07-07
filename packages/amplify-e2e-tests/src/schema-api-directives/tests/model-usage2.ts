//schema
export const schema = `
type Post @model(queries: { get: "post" }, mutations: null, subscriptions: null) {
  id: ID!
  title: String!
  tags: [String!]!
}

##model/usage2`;
//mutations
export const mutation = `
mutation CreatePost {
    createPost(input: {
      id: "1",
      title: "title1",
      tags: ["tag1"]
    }) {
      id
      title
      tags
      createdAt
      updatedAt
    }
}`;
export const expected_result_mutation = {
  graphQLErrors: [
    {
      message: 'Schema is not configured for mutations.',
    },
  ],
};
