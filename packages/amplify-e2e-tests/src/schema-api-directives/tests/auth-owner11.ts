/* eslint-disable */
import {
  addApi,
  amplifyPushWithoutCodegen,
  getAmplifyFlutterConfig,
  getConfiguredAppsyncClientCognitoAuth,
  getUserPoolId,
  setupUser,
  signInUser,
  updateAuthAddUserGroups,
} from '@aws-amplify/amplify-e2e-core';
import { Amplify } from 'aws-amplify';
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
  await amplifyPushWithoutCodegen(projectDir);

  const amplifyConfig = getAmplifyFlutterConfig(projectDir);
  const userPoolId = getUserPoolId(projectDir);

  await configureAmplifyForFlutter(amplifyConfig);
  await setupUser(userPoolId, USERNAME, PASSWORD, GROUPNAME);

  const user = await signInUser(USERNAME, PASSWORD);
  const appSyncClient = getConfiguredAppsyncClientCognitoAuth(
    amplifyConfig.aws_appsync_graphqlEndpoint,
    amplifyConfig.aws_appsync_region,
    user,
  );

  await testMutations(testModule, appSyncClient);
  await testQueries(testModule, appSyncClient);
  await testSubscriptions(testModule, appSyncClient);
}

async function configureAmplifyForFlutter(amplifyConfig: any): Promise<void> {
  const config = amplifyConfig.auth.plugins.awsCognitoAuthPlugin;
  const { CredentialsProvider, CognitoUserPool, AppSync } = config;

  amplifyConfig.aws_cognito_identity_pool_id = CredentialsProvider.CognitoIdentity.Default.PoolId;
  amplifyConfig.aws_cognito_region = CredentialsProvider.CognitoIdentity.Default.Region;
  amplifyConfig.aws_user_pools_id = CognitoUserPool.Default.PoolId;
  amplifyConfig.aws_user_pools_web_client_id = CognitoUserPool.Default.AppClientId;
  amplifyConfig.aws_appsync_graphqlEndpoint = AppSync.Default.ApiUrl;
  amplifyConfig.aws_appsync_region = AppSync.Default.Region;
  amplifyConfig.aws_appsync_authenticationType = AppSync.Default.AuthMode;

  Amplify.configure(amplifyConfig);
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
