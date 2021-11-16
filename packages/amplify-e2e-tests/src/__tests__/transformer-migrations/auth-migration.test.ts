import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPush,
  amplifyPushUpdate,
  addFeatureFlag,
  createRandomName,
  updateApiSchema,
  createNewProjectDir,
  deleteProjectDir,
  updateApiWithMultiAuth,
  addApiWithoutSchema,
  updateAuthAddUserGroups,
} from 'amplify-e2e-core';
import {
  configureAmplify,
  getUserPoolId,
  getConfiguredAppsyncClientCognitoAuth,
  authenticateUser,
  getConfiguredAppsyncClientAPIKeyAuth,
  getApiKey,
  getConfiguredAppsyncClientIAMAuth,
  setupUser,
  signInUser,
} from '../../schema-api-directives';
import gql from 'graphql-tag';
(global as any).fetch = require('node-fetch');
import { default as CognitoClient } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { Auth } from 'aws-amplify';
import moment from 'moment';
import { IAM } from 'aws-sdk';

describe('transformer @auth migration test', () => {
  let projRoot: string;
  let projectName: string;

  const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
  const GROUPNAME = 'Admin';
  const PASSWORD = 'user1Password';
  const NEW_PASSWORD = 'user1Password!!!**@@@';
  const EMAIL = 'username@amazon.com';
  const UNAUTH_ROLE_NAME = `unauthRole${BUILD_TIMESTAMP}`;

  const modelSchemaV1 = 'transformer_migration/auth-model-v1.graphql';
  const modelSchemaV2 = 'transformer_migration/auth-model-v2.graphql';

  beforeEach(async () => {
    projectName = createRandomName();
    projRoot = await createNewProjectDir(projectName);
    await initJSProjectWithProfile(projRoot, { name: projectName });

    await addApiWithoutSchema(projRoot, { apiName: projectName });
    await updateApiWithMultiAuth(projRoot, {});
    updateApiSchema(projRoot, projectName, modelSchemaV1);
    await updateAuthAddUserGroups(projRoot, [GROUPNAME]);
    await amplifyPush(projRoot);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('migration of queries with different auth methods should succeed', async () => {
    const iamHelper = new IAM({ region: 'us-east-2' });
    const awsconfig = configureAmplify(projRoot);
    const userPoolId = getUserPoolId(projRoot);

    await setupUser(userPoolId, EMAIL, PASSWORD);
    const user = await signInUser(EMAIL, PASSWORD);

    let apiKey = getApiKey(projRoot);

    let appSyncClientViaUser = getConfiguredAppsyncClientCognitoAuth(
      awsconfig.aws_appsync_graphqlEndpoint,
      awsconfig.aws_appsync_region,
      user,
    );
    let appSyncClientViaApiKey = getConfiguredAppsyncClientAPIKeyAuth(
      awsconfig.aws_appsync_graphqlEndpoint,
      awsconfig.aws_appsync_region,
      apiKey,
    );
    let appSyncClientViaIAM = getConfiguredAppsyncClientIAMAuth(
      awsconfig.aws_appsync_graphqlEndpoint,
      awsconfig.aws_appsync_region,
    );

    let createPostMutation = /* GraphQL */ `
      mutation CreatePost {
        createPost(input: { title: "Created in V1" }) {
          id
        }
      }
    `;

    let createPostResult = await appSyncClientViaUser.mutate({
      mutation: gql(createPostMutation),
      fetchPolicy: 'no-cache',
    });

    expect(createPostResult.errors).toBeUndefined();
    expect(createPostResult.data).toBeDefined();

    let createPostPublicMutation = /* GraphQL */ `
      mutation CreatePostPublic {
        createPostPublic(input: { title: "Created in V1" }) {
          id
        }
      }
    `;

    let createPostPublicResult = await appSyncClientViaApiKey.mutate({
      mutation: gql(createPostPublicMutation),
      fetchPolicy: 'no-cache',
    });

    expect(createPostPublicResult.errors).toBeUndefined();
    expect(createPostPublicResult.data).toBeDefined();

    let createPostPublicIAMMutation = /* GraphQL */ `
      mutation CreatePostPublicIAM {
        createPostPublicIAM(input: { title: "Created in V1" }) {
          id
        }
      }
    `;

    let createPostPublicIAMResult = await appSyncClientViaIAM.mutate({
      mutation: gql(createPostPublicIAMMutation),
      fetchPolicy: 'no-cache',
    });

    expect(createPostPublicIAMResult.errors).toBeUndefined();
    expect(createPostPublicIAMResult.data).toBeDefined();

    let createSalaryMutation = /* GraphQL */ `
      mutation CreateSalary {
        createSalary(input: { wage: 1000000000 }) {
          id
          owner
        }
      }
    `;

    let createSalaryResult = await appSyncClientViaUser.mutate({
      mutation: gql(createSalaryMutation),
      fetchPolicy: 'no-cache',
    });

    expect(createSalaryResult.errors).toBeUndefined();
    expect(createSalaryResult.data).toBeDefined();

    addFeatureFlag(projRoot, 'graphqltransformer', 'transformerVersion', 2);
    addFeatureFlag(projRoot, 'graphqltransformer', 'useExperimentalPipelinedTransformer', true);

    updateApiSchema(projRoot, projectName, modelSchemaV2);
    await amplifyPushUpdate(projRoot);

    apiKey = getApiKey(projRoot);
    appSyncClientViaUser = getConfiguredAppsyncClientCognitoAuth(
      awsconfig.aws_appsync_graphqlEndpoint,
      awsconfig.aws_appsync_region,
      user,
    );
    appSyncClientViaApiKey = getConfiguredAppsyncClientAPIKeyAuth(
      awsconfig.aws_appsync_graphqlEndpoint,
      awsconfig.aws_appsync_region,
      apiKey,
    );

    createPostMutation = /* GraphQL */ `
      mutation CreatePost {
        createPost(input: { title: "Created in V2" }) {
          id
        }
      }
    `;

    createPostResult = await appSyncClientViaUser.mutate({
      mutation: gql(createPostMutation),
      fetchPolicy: 'no-cache',
    });

    expect(createPostResult.errors).toBeUndefined();
    expect(createPostResult.data).toBeDefined();

    apiKey = getApiKey(projRoot);
    appSyncClientViaApiKey = getConfiguredAppsyncClientAPIKeyAuth(
      awsconfig.aws_appsync_graphqlEndpoint,
      awsconfig.aws_appsync_region,
      apiKey,
    );

    createPostPublicMutation = /* GraphQL */ `
      mutation CreatePostPublic {
        createPostPublic(input: { title: "Created in V1" }) {
          id
        }
      }
    `;

    createPostPublicResult = await appSyncClientViaApiKey.mutate({
      mutation: gql(createPostPublicMutation),
      fetchPolicy: 'no-cache',
    });

    expect(createPostPublicResult.errors).toBeUndefined();
    expect(createPostPublicResult.data).toBeDefined();

    createPostPublicIAMMutation = /* GraphQL */ `
      mutation CreatePostPublicIAM {
        createPostPublicIAM(input: { title: "Created in V1" }) {
          id
        }
      }
    `;

    // This is expected because v2 expects 'Allow unauthenticated logins?' to be set to 'Yes' in [Auth] resource to allow IAM public rule
    await expect(
      appSyncClientViaIAM.mutate({
        mutation: gql(createPostPublicIAMMutation),
        fetchPolicy: 'no-cache',
      }),
    ).rejects.toThrowError('GraphQL error: Not Authorized to access createPostPublicIAM on type PostPublicIAM');

    createSalaryMutation = /* GraphQL */ `
      mutation CreateSalary {
        createSalary(input: { wage: 1000000000 }) {
          id
          owner
        }
      }
    `;

    createSalaryResult = await appSyncClientViaUser.mutate({
      mutation: gql(createSalaryMutation),
      fetchPolicy: 'no-cache',
    });

    expect(createSalaryResult.errors).toBeUndefined();
    expect(createSalaryResult.data).toBeDefined();

    const postsQuery = /* GraphQL */ `
      query ListPosts {
        listPosts {
          items {
            id
            title
          }
        }
      }
    `;

    let queryResult = await appSyncClientViaUser.query({
      query: gql(postsQuery),
      fetchPolicy: 'no-cache',
    });

    expect(queryResult.errors).toBeUndefined();
    expect(queryResult.data).toBeDefined();
    expect((queryResult.data as any).listPosts.items.length).toEqual(2);

    const postPublicsQuery = /* GraphQL */ `
      query ListPostPublics {
        listPostPublics {
          items {
            id
            title
          }
        }
      }
    `;

    queryResult = await appSyncClientViaApiKey.query({
      query: gql(postPublicsQuery),
      fetchPolicy: 'no-cache',
    });

    expect(queryResult.errors).toBeUndefined();
    expect(queryResult.data).toBeDefined();
    expect((queryResult.data as any).listPostPublics.items.length).toEqual(2);

    const salaryQuery = /* GraphQL */ `
      query ListSalary {
        listSalaries {
          items {
            wage
          }
        }
      }
    `;

    queryResult = await appSyncClientViaUser.query({
      query: gql(salaryQuery),
      fetchPolicy: 'no-cache',
    });

    expect(queryResult.errors).toBeUndefined();
    expect(queryResult.data).toBeDefined();
    expect((queryResult.data as any).listSalaries.items.length).toEqual(2);
  });
});