//schema
export const schema = `
# The long form way
type Post
  @model
  @auth(
    rules: [
      {allow: owner, ownerField: "owner", operations: [create, update, delete, read]},
    ])
{
  id: ID!
  title: String!
  owner: String
}

##owner2`;
//mutations
export const mutation = `
mutation CreatePost(
    $input: CreatePostInput!
    $condition: ModelPostConditionInput
  ) {
    createPost(input: $input, condition: $condition) {
      id
      title
      createdAt
      updatedAt
      owner
    }
}`;
export const input_mutation = {
  input: {
    id: '1',
    title: 'title1',
  },
};
export const expected_result_mutation = {
  data: {
    createPost: {
      id: '1',
      title: 'title1',
      createdAt: '<check-defined>',
      updatedAt: '<check-defined>',
      owner: 'user1',
    },
  },
};
