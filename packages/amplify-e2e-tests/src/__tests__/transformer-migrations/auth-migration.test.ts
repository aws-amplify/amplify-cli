import {
  addApiWithoutSchema,
  addFeatureFlag,
  amplifyPush,
  amplifyPushUpdate,
  configureAmplify,
  createNewProjectDir,
  createRandomName,
  deleteProject,
  deleteProjectDir,
  getApiKey,
  getConfiguredAppsyncClientAPIKeyAuth,
  getConfiguredAppsyncClientCognitoAuth,
  getConfiguredAppsyncClientIAMAuth,
  getUserPoolId,
  initJSProjectWithProfile,
  setupUser,
  signInUser,
  updateApiSchema,
  updateApiWithMultiAuth,
  updateAuthAddUserGroups,
} from '@aws-amplify/amplify-e2e-core';
import gql from 'graphql-tag';

(global as any).fetch = require('node-fetch');

describe('transformer @auth migration test', () => {
  let projRoot: string;
  let projectName: string;

  const GROUPNAME = 'Admin';
  const PASSWORD = 'user1Password';
  const EMAIL = 'username@amazon.com';

  const modelSchemaV1 = 'transformer_migration/auth-model-v1.graphql';
  const modelSchemaV2 = 'transformer_migration/auth-model-v2.graphql';

  beforeEach(async () => {
    projectName = createRandomName();
    projRoot = await createNewProjectDir(projectName);
    await initJSProjectWithProfile(projRoot, { name: projectName });

    await addApiWithoutSchema(projRoot, { apiName: projectName, transformerVersion: 1 });
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
    const appSyncClientViaIAM = getConfiguredAppsyncClientIAMAuth(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region);

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

    const createPostPublicIAMMutation = /* GraphQL */ `
      mutation CreatePostPublicIAM {
        createPostPublicIAM(input: { title: "Created in V1" }) {
          id
        }
      }
    `;

    const createPostPublicIAMResult = await appSyncClientViaIAM.mutate({
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

    await updateApiSchema(projRoot, projectName, modelSchemaV2);
    await amplifyPushUpdate(projRoot);

    appSyncClientViaUser = getConfiguredAppsyncClientCognitoAuth(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, user);

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
