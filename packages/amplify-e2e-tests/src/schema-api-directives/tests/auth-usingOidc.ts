import {
  addApi,
  addAuthWithDefault,
  amplifyPush,
  amplifyPushWithoutCodegen,
  configureAmplify,
  getAppClientIDWeb,
  getConfiguredAppsyncClientIAMAuth,
  getConfiguredAppsyncClientOIDCAuth,
  getUserPoolId,
  getUserPoolIssUrl,
  setupUser,
  signInUser,
  updateAuthAddUserGroups,
} from '@aws-amplify/amplify-e2e-core';

import { testMutation, updateSchemaInTestProject } from '../common';

const GROUPNAME = 'Admin';
const USERNAME = 'user1';
const PASSWORD = 'user1Password';

export async function runTest(projectDir: string, testModule: any) {
  await addAuthWithDefault(projectDir); //will use the cognito user pool as oidc provider
  await updateAuthAddUserGroups(projectDir, [GROUPNAME]);
  await amplifyPushWithoutCodegen(projectDir);

  await addApi(projectDir, {
    'OpenID Connect': {
      oidcProviderName: 'awscognitouserpool',
      oidcProviderDomain: getUserPoolIssUrl(projectDir),
      oidcClientId: getAppClientIDWeb(projectDir),
      ttlaIssueInMillisecond: '3600000',
      ttlaAuthInMillisecond: '3600000',
    },
    IAM: {},
    transformerVersion: 1,
  });

  updateSchemaInTestProject(projectDir, testModule.schema);
  await amplifyPush(projectDir);
  const awsconfig = configureAmplify(projectDir);

  const userPoolId = getUserPoolId(projectDir);
  await setupUser(userPoolId, USERNAME, PASSWORD, GROUPNAME);

  const appSyncClientIAM = getConfiguredAppsyncClientIAMAuth(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region);
  const user = await signInUser(USERNAME, PASSWORD);
  const appSyncClientOIDC = getConfiguredAppsyncClientOIDCAuth(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, user);

  //test create post mutation with private iam provider
  await testMutation(appSyncClientIAM, createPostMutation, undefined, expected_result_createPostMutation);

  //test create profile mutation with oidc provider
  await testMutation(appSyncClientOIDC, createProfileMutation, undefined, expected_result_createProfileMutation);
}

//schema
export const schema = `
# private authorization with provider override
#error: InvalidDirectiveError: @auth directive with 'private' strategy only supports 'userPools' (default) and 'iam' providers,
#but found 'oidc' assigned.
#change: changed type Post's @auth provider from oidc to iam
type Post @model @auth(rules: [{allow: private, provider: iam}]) {
  id: ID!
  title: String!
}

# owner authorization with provider override
type Profile @model @auth(rules: [{allow: owner, provider: oidc, identityClaim: "sub"}]) {
  id: ID!
  displayNAme: String!
}

##authUsingOidc`;

const createPostMutation = `
mutation CreatePost {
  createPost(input:{
    id: "1",
    title: "title1"
  }) {
    id
    title
    createdAt
    updatedAt
  }
}
`;

const expected_result_createPostMutation = {
  data: {
    createPost: {
      id: '1',
      title: 'title1',
      createdAt: '<check-defined>',
      updatedAt: '<check-defined>',
    },
  },
};

const createProfileMutation = `
mutation CreateProfile{
  createProfile(input: {
    id: "1",
    displayNAme: "displayName1"
  }) {
    id
    displayNAme
    createdAt
    updatedAt
    owner
  }
}
`;

const expected_result_createProfileMutation = {
  data: {
    createProfile: {
      id: '1',
      displayNAme: 'displayName1',
      createdAt: '<check-defined>',
      updatedAt: '<check-defined>',
      owner: '<check-defined>',
    },
  },
};
