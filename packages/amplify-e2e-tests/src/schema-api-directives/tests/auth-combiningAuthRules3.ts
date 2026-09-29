import { runMultiAutTest } from '../common';

export async function runTest(projectDir: string, testModule: any) {
  await runMultiAutTest(projectDir, testModule);
}

//schema
export const schema = `
type Post @model @auth (rules: [{ allow: private }]) {
  id: ID!
  title: String
  owner: String
  secret: String
    @auth (rules: [{ allow: private, provider: iam, operations: [create, update] }])
}

##combiningAuthRules3`;
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
    owner: 'user1',
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
