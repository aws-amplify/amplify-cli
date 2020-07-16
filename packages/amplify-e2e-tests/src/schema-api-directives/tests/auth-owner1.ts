//schema
export const schema = `
# The simplest case
type Post @model @auth(rules: [{allow: owner}]) {
  id: ID!
  title: String!
}

##owner1`;
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
