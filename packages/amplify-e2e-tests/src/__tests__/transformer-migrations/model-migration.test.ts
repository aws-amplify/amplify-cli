import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPush,
  amplifyPushUpdate,
  addFeatureFlag,
  createRandomName,
  addAuthWithDefault,
  addApiWithoutSchema,
  updateApiSchema,
  getProjectMeta,
  createNewProjectDir,
  deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import gql from 'graphql-tag';

(global as any).fetch = require('node-fetch');

describe('transformer model migration test', () => {
  let projRoot: string;
  let projectName: string;

  beforeEach(async () => {
    projectName = createRandomName();
    projRoot = await createNewProjectDir(createRandomName());
    await initJSProjectWithProfile(projRoot, { name: projectName });
    await addAuthWithDefault(projRoot);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  // Test consistency of IAM role
  // Test in Windows passing region by pinning

  it('migration of model key queries timestamps should succeed', async () => {
    const modelSchemaV1 = 'transformer_migration/basic-model-v1.graphql';
    const modelSchemaV2 = 'transformer_migration/basic-model-v2.graphql';

    await addApiWithoutSchema(projRoot, { apiName: projectName, transformerVersion: 1 });
    await updateApiSchema(projRoot, projectName, modelSchemaV1);
    await amplifyPush(projRoot);

    let appSyncClient = getAppSyncClientFromProj(projRoot);

    let createPostMutation = /* GraphQL */ `
      mutation CreatePost {
        createPost(input: { title: "Created in V1" }) {
          id
        }
      }
    `;

    let createPostResult = await appSyncClient.mutate({
      mutation: gql(createPostMutation),
      fetchPolicy: 'no-cache',
    });

    expect(createPostResult.errors).toBeUndefined();
    expect(createPostResult.data).toBeDefined();

    let createCustomerMutation = /* GraphQL */ `
      mutation CreateCustomer {
        createCustomer(input: { email: "v1@test.com" }) {
          email
        }
      }
    `;

    let createCustomerResult = await appSyncClient.mutate({
      mutation: gql(createCustomerMutation),
      fetchPolicy: 'no-cache',
    });

    expect(createCustomerResult.errors).toBeUndefined();
    expect(createCustomerResult.data).toBeDefined();

    let createTestMutation = /* GraphQL */ `
      mutation CreateTest {
        createTest(input: { title: "Created in V1" }) {
          id
        }
      }
    `;

    let createTestResult = await appSyncClient.mutate({
      mutation: gql(createTestMutation),
      fetchPolicy: 'no-cache',
    });

    expect(createTestResult.errors).toBeUndefined();
    expect(createTestResult.data).toBeDefined();

    let createRenameMutation = /* GraphQL */ `
      mutation CreateRename {
        makeRename(input: { title: "Created in V1" }) {
          id
        }
      }
    `;

    let createRenameResult = await appSyncClient.mutate({
      mutation: gql(createRenameMutation),
      fetchPolicy: 'no-cache',
    });

    expect(createRenameResult.errors).toBeUndefined();
    expect(createRenameResult.data).toBeDefined();

    await addFeatureFlag(projRoot, 'graphqltransformer', 'transformerVersion', 2);
    await addFeatureFlag(projRoot, 'graphqltransformer', 'useExperimentalPipelinedTransformer', true);

    await updateApiSchema(projRoot, projectName, modelSchemaV2);
    await amplifyPushUpdate(projRoot);

    // Wait for 20s to ensure the newly-created roles have propagated
    await new Promise((resolve) => setTimeout(resolve, 20000));

    appSyncClient = getAppSyncClientFromProj(projRoot);

    createPostMutation = /* GraphQL */ `
      mutation CreatePost {
        createPost(input: { title: "Created in V2" }) {
          id
        }
      }
    `;

    createPostResult = await appSyncClient.mutate({
      mutation: gql(createPostMutation),
      fetchPolicy: 'no-cache',
    });

    expect(createPostResult.errors).toBeUndefined();
    expect(createPostResult.data).toBeDefined();

    createCustomerMutation = /* GraphQL */ `
      mutation CreateCustomer {
        createCustomer(input: { email: "v2@test.com" }) {
          email
        }
      }
    `;

    createCustomerResult = await appSyncClient.mutate({
      mutation: gql(createCustomerMutation),
      fetchPolicy: 'no-cache',
    });

    expect(createCustomerResult.errors).toBeUndefined();
    expect(createCustomerResult.data).toBeDefined();

    createTestMutation = /* GraphQL */ `
      mutation CreateTest {
        createTest(input: { title: "Created in V2" }) {
          id
        }
      }
    `;

    createTestResult = await appSyncClient.mutate({
      mutation: gql(createTestMutation),
      fetchPolicy: 'no-cache',
    });

    expect(createTestResult.errors).toBeUndefined();
    expect(createTestResult.data).toBeDefined();

    createRenameMutation = /* GraphQL */ `
      mutation CreateRename {
        makeRename(input: { title: "Created in V2" }) {
          id
        }
      }
    `;

    createRenameResult = await appSyncClient.mutate({
      mutation: gql(createRenameMutation),
      fetchPolicy: 'no-cache',
    });

    expect(createRenameResult.errors).toBeUndefined();
    expect(createRenameResult.data).toBeDefined();

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

    let queryResult = await appSyncClient.query({
      query: gql(postsQuery),
      fetchPolicy: 'no-cache',
    });

    expect(queryResult.errors).toBeUndefined();
    expect(queryResult.data).toBeDefined();
    expect((queryResult.data as any).listPosts.items.length).toEqual(2);

    const customersQuery = /* GraphQL */ `
      query ListCustomers {
        listCustomers {
          items {
            email
          }
        }
      }
    `;

    queryResult = await appSyncClient.query({
      query: gql(customersQuery),
      fetchPolicy: 'no-cache',
    });

    expect(queryResult.errors).toBeUndefined();
    expect(queryResult.data).toBeDefined();
    expect((queryResult.data as any).listCustomers.items.length).toEqual(2);

    const testsQuery = /* GraphQL */ `
      query ListTests {
        listTests {
          items {
            id
            title
          }
        }
      }
    `;

    queryResult = await appSyncClient.query({
      query: gql(testsQuery),
      fetchPolicy: 'no-cache',
    });

    expect(queryResult.errors).toBeUndefined();
    expect(queryResult.data).toBeDefined();
    expect((queryResult.data as any).listTests.items.length).toEqual(2);

    const renamesQuery = /* GraphQL */ `
      query GetRename {
        rename (id: "${(createRenameResult.data as any).makeRename.id}") {
          id
          title
        }
      }
    `;

    queryResult = await appSyncClient.query({
      query: gql(renamesQuery),
      fetchPolicy: 'no-cache',
    });

    expect(queryResult.errors).toBeUndefined();
    expect(queryResult.data).toBeDefined();
  });

  const getAppSyncClientFromProj = (projRoot: string) => {
    const meta = getProjectMeta(projRoot);
    const region = meta.providers.awscloudformation.Region as string;
    const { output } = meta.api[projectName];
    const url = output.GraphQLAPIEndpointOutput as string;
    const apiKey = output.GraphQLAPIKeyOutput as string;

    return new AWSAppSyncClient({
      url,
      region,
      disableOffline: true,
      auth: {
        type: AUTH_TYPE.API_KEY,
        apiKey,
      },
    });
  };
});
