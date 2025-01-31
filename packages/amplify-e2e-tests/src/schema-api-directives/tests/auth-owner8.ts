/* eslint-disable */
import {
  addApi,
  amplifyPush,
  configureAmplify,
  getConfiguredAppsyncClientCognitoAuth,
  getUserPoolId,
  setupUser,
  signInUser,
  updateAuthAddUserGroups,
} from '@aws-amplify/amplify-e2e-core';
import { testMutations, testQueries, testSubscriptions, updateSchemaInTestProject } from '../common';

const GROUPNAME = 'Admin';
const USERNAME = 'user1';
const PASSWORD = 'user1Password';

export async function runTest(projectDir: string, testModule: any) {
  await addApi(projectDir, {
    'Amazon Cognito User Pool': {},
    transformerVersion: 2,
  });
  updateSchemaInTestProject(projectDir, testModule.schema);

  await updateAuthAddUserGroups(projectDir, [GROUPNAME]);
  await amplifyPush(projectDir);
  const awsconfig = configureAmplify(projectDir);

  const userPoolId = getUserPoolId(projectDir);
  await setupUser(userPoolId, USERNAME, PASSWORD, GROUPNAME);

  const user = await signInUser(USERNAME, PASSWORD);
  const appSyncClient = getConfiguredAppsyncClientCognitoAuth(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, user);

  await testMutations(testModule, appSyncClient);
  await testQueries(testModule, appSyncClient);
  await testSubscriptions(testModule, appSyncClient);
}

// schema

export const schema = `
# The simplest case
type Post @model @auth(rules: [{allow: owner}]) {
  id: ID!
  title: String!
}
##owner1`;

// mutations

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
      owner: USERNAME,
    },
  },
};

// queries

export const query = `
 query GetPost {
    getPost(id: "1") {
      id
      title
      owner
    }
  }`;

export const expected_result_query = {
  data: {
    getPost: {
      id: '1',
      title: 'title1',
      owner: USERNAME,
    },
  },
};
/* eslint-enable */
