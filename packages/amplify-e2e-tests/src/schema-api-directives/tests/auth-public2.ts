import { addApi, amplifyPush, configureAmplify, getConfiguredAppsyncClientIAMAuth } from '@aws-amplify/amplify-e2e-core';

import { updateSchemaInTestProject, testMutations, testQueries } from '../common';

export async function runTest(projectDir: string, testModule: any) {
  await addApi(projectDir, {
    IAM: {},
    transformerVersion: 1,
  });
  updateSchemaInTestProject(projectDir, testModule.schema);
  await amplifyPush(projectDir);

  const awsconfig = configureAmplify(projectDir);
  const appSyncClient = getConfiguredAppsyncClientIAMAuth(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region);

  await testMutations(testModule, appSyncClient);
  await testQueries(testModule, appSyncClient);
}

//schema
export const schema = `
# public authorization with provider override
type Post @model @auth(rules: [{allow: public, provider: iam}]) {
  id: ID!
  title: String!
}

##public2`;
//mutations
export const mutation1 = `
mutation CreatePost(
    $input: CreatePostInput!
    $condition: ModelPostConditionInput
  ) {
    createPost(input: $input, condition: $condition) {
      id
      title
      createdAt
      updatedAt
    }
}`;
export const input_mutation1 = {
  input: {
    id: '1',
    title: 'title1',
  },
};
export const expected_result_mutation1 = {
  data: {
    createPost: {
      id: '1',
      title: 'title1',
      createdAt: '<check-defined>',
      updatedAt: '<check-defined>',
    },
  },
};

export const mutation2 = `
mutation UpdatePost(
    $input: UpdatePostInput!
    $condition: ModelPostConditionInput
  ) {
    updatePost(input: $input, condition: $condition) {
      id
      title
      createdAt
      updatedAt
    }
}`;
export const input_mutation2 = {
  input: {
    id: '1',
    title: 'title1-updated',
  },
};
export const expected_result_mutation2 = {
  data: {
    updatePost: {
      id: '1',
      title: 'title1-updated',
      createdAt: '<check-defined>',
      updatedAt: '<check-defined>',
    },
  },
};
