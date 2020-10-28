import { runMultiAutTest } from '../common';

export async function runTest(projectDir: string, testModule: any) {
  await runMultiAutTest(projectDir, testModule);
}

//schema
export const schema = `
type Post @model
  @auth (
    rules: [
      # allow all authenticated users ability to create posts
      # allow owners ability to update and delete their posts
      # allow all authenticated users to read posts
      { allow: owner, operations: [create, update, delete] },

      # allow all guest users (not authenticated) to read posts
      { allow: public, operations: [read] }
    ]
  ) {
  id: ID!
  title: String
  owner: String
}

##combingAuthRules1`;
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
