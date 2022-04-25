import { SearchableModelTransformer } from '@aws-amplify/graphql-searchable-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { ResourceConstants } from 'graphql-transformer-common';
import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import { CloudFormationClient } from '../CloudFormationClient';
import { S3Client } from '../S3Client';
import { Output } from 'aws-sdk/clients/cloudformation';
import { cleanupStackAfterTest, deploy } from '../deployNestedStacks';
import moment from 'moment';
import { S3, CognitoIdentityServiceProvider as CognitoClient, CognitoIdentity } from 'aws-sdk';
import { AWS } from '@aws-amplify/core';
import { Auth } from 'aws-amplify';
import { IAMHelper } from '../IAMHelper';
import gql from 'graphql-tag';
import {
  addUserToGroup,
  authenticateUser,
  configureAmplify,
  createGroup,
  createIdentityPool,
  createUserPool,
  createUserPoolClient,
  signupUser,
} from '../cognitoUtils';
// to deal with bug in cognito-identity-js
(global as any).fetch = require('node-fetch');
// To overcome of the way of how AmplifyJS picks up currentUserCredentials
const anyAWS = AWS as any;
if (anyAWS && anyAWS.config && anyAWS.config.credentials) {
  delete anyAWS.config.credentials;
}

// tslint:disable: no-magic-numbers
jest.setTimeout(60000 * 60);
const AWS_REGION = 'us-west-2';

const cf = new CloudFormationClient(AWS_REGION);
const customS3Client = new S3Client(AWS_REGION);
const awsS3Client = new S3({ region: AWS_REGION });
const cognitoClient = new CognitoClient({ apiVersion: '2016-04-19', region: AWS_REGION });
const identityClient = new CognitoIdentity({ apiVersion: '2014-06-30', region: AWS_REGION });
const iamHelper = new IAMHelper(AWS_REGION);

const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `SearchableAuthV2Tests-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `searchable-authv2-tests-bucket-${BUILD_TIMESTAMP}`;
const LOCAL_FS_BUILD_DIR = '/tmp/searchable_authv2_tests/';
const S3_ROOT_DIR_KEY = 'deployments';
const AUTH_ROLE_NAME = `${STACK_NAME}-authRole`;
const UNAUTH_ROLE_NAME = `${STACK_NAME}-unauthRole`;
let USER_POOL_ID: string;
let IDENTITY_POOL_ID: string;
let GRAPHQL_ENDPOINT: string;
let API_KEY: string;

/**
 * Client 1 is logged in and has no group memberships.
 */
let GRAPHQL_CLIENT_1: AWSAppSyncClient<any> = undefined;

/**
 * Client 2 is logged in and is a member of the admin and writer group.
 */
let GRAPHQL_CLIENT_2: AWSAppSyncClient<any> = undefined;

/**
 * Client 3 is logged in and has no group memberships.
 */
let GRAPHQL_CLIENT_3: AWSAppSyncClient<any> = undefined;

/**
 * Client 4 is logged in and is a member of the writer group
 */
let GRAPHQL_CLIENT_4: AWSAppSyncClient<any> = undefined;

/**
 * Auth IAM Client
 */
let GRAPHQL_IAM_AUTH_CLIENT: AWSAppSyncClient<any> = undefined;

/**
 * API Key Client
 */
let GRAPHQL_APIKEY_CLIENT: AWSAppSyncClient<any> = undefined;

const USERNAME1 = 'user1@test.com';
const USERNAME2 = 'user2@test.com';
const USERNAME3 = 'user3@test.com';
const USERNAME4 = 'user4@test.com';
const TMP_PASSWORD = 'Password123!';
const REAL_PASSWORD = 'Password1234!';
const WRITER_GROUP_NAME = 'writer';
const ADMIN_GROUP_NAME = 'admin';

beforeAll(async () => {
  const validSchema = `
  # Owners and Users in writer group
  # can execute crud operations their owned records.
  type Comment @model
  @searchable
  @auth(rules: [
      { allow: owner }
      { allow: groups, groups: ["writer"]}
  ]) {
      id: ID!
      content: String
  }
  # only users in the admin group are authorized to view entries in DynamicContent
  type Todo @model
  @searchable
  @auth(rules: [
      { allow: groups, groupsField: "groups"}
  ]) {
      id: ID!
      groups: String
      content: String
  }
  # users with apikey perform crud operations on Post except for secret
  # only users with auth role (iam) can view the secret
  # only private iam roles are allowed to run aggregations
  type Post @model
    @searchable
    @auth(rules: [
        { allow: public, provider: apiKey }
        { allow: private, provider: iam }
    ]) {
    id: ID!
    content: String
    secret: String @auth(rules: [{ allow: private, provider: iam }])
  }
  # only allow static group and dynamic group to have access on field
  type Blog
  @model
  @searchable
  @auth(rules: [{ allow: owner }, { allow: groups, groups: ["admin"] }, { allow: groups, groupsField: "groupsField" }]) {
    id: ID!
    title: String
    ups: Int
    downs: Int
    percentageUp: Float
    isPublished: Boolean
    createdAt: AWSDateTime 
    updatedAt: AWSDateTime
    owner: String
    groupsField: String
    # as a member of admin and member within groupsField I can run aggregations on secret
    secret: String @auth(rules: [{ allow: groups, groups: ["admin"] }, { allow: groups, groupsField: "groupsField" }])
    }
  `;
  const transformer = new GraphQLTransform({
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [
        {
          authenticationType: 'API_KEY',
          apiKeyConfig: {
            description: 'E2E Test API Key',
            apiKeyExpirationDays: 300,
          },
        },
        {
          authenticationType: 'AWS_IAM',
        },
      ],
    },
    transformers: [new ModelTransformer(), new SearchableModelTransformer(), new AuthTransformer()],
    featureFlags: {
      getBoolean: (value: string, defaultValue?: boolean) => {
        if (value === 'useSubUsernameForDefaultIdentityClaim') {
          return false;
        }
        return defaultValue;
      },
      getString: jest.fn(),
      getNumber: jest.fn(),
      getObject: jest.fn(),
    },
  });
  const userPoolResponse = await createUserPool(cognitoClient, `UserPool${STACK_NAME}`);
  USER_POOL_ID = userPoolResponse.UserPool.Id;
  const userPoolClientResponse = await createUserPoolClient(cognitoClient, USER_POOL_ID, `UserPool${STACK_NAME}`);
  const userPoolClientId = userPoolClientResponse.UserPoolClient.ClientId;
  // create auth and unauthroles
  const { authRole, unauthRole } = await iamHelper.createRoles(AUTH_ROLE_NAME, UNAUTH_ROLE_NAME);
  // create identitypool
  IDENTITY_POOL_ID = await createIdentityPool(identityClient, `IdentityPool${STACK_NAME}`, {
    authRoleArn: authRole.Arn,
    unauthRoleArn: unauthRole.Arn,
    providerName: `cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`,
    clientId: userPoolClientId,
  });
  try {
    await awsS3Client.createBucket({ Bucket: BUCKET_NAME }).promise();
  } catch (e) {
    console.error(`Failed to create bucket: ${e}`);
  }
  try {
    const out = transformer.transform(validSchema);
    const finishedStack = await deploy(
      customS3Client,
      cf,
      STACK_NAME,
      out,
      { AuthCognitoUserPoolId: USER_POOL_ID, authRoleName: authRole.RoleName, unauthRoleName: unauthRole.RoleName },
      LOCAL_FS_BUILD_DIR,
      BUCKET_NAME,
      S3_ROOT_DIR_KEY,
      BUILD_TIMESTAMP,
    );
    // Arbitrary wait to make sure everything is ready.
    await cf.wait(120, () => Promise.resolve());
    expect(finishedStack).toBeDefined();
    const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
    const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput);
    GRAPHQL_ENDPOINT = getApiEndpoint(finishedStack.Outputs);
    API_KEY = getApiKey(finishedStack.Outputs);

    expect(API_KEY).toBeDefined();
    expect(GRAPHQL_ENDPOINT).toBeDefined();
    expect(userPoolClientId).toBeTruthy();

    // Configure Amplify, create users, and sign in
    configureAmplify(USER_POOL_ID, userPoolClientId, IDENTITY_POOL_ID);

    await signupUser(USER_POOL_ID, USERNAME1, TMP_PASSWORD);
    await signupUser(USER_POOL_ID, USERNAME2, TMP_PASSWORD);
    await signupUser(USER_POOL_ID, USERNAME3, TMP_PASSWORD);
    await signupUser(USER_POOL_ID, USERNAME4, TMP_PASSWORD);
    await createGroup(USER_POOL_ID, WRITER_GROUP_NAME);
    await createGroup(USER_POOL_ID, ADMIN_GROUP_NAME);
    await addUserToGroup(WRITER_GROUP_NAME, USERNAME4, USER_POOL_ID);
    await addUserToGroup(WRITER_GROUP_NAME, USERNAME2, USER_POOL_ID);
    await addUserToGroup(ADMIN_GROUP_NAME, USERNAME2, USER_POOL_ID);

    const authResAfterGroup: any = await authenticateUser(USERNAME1, TMP_PASSWORD, REAL_PASSWORD);
    const idToken = authResAfterGroup.getIdToken().getJwtToken();
    GRAPHQL_CLIENT_1 = new AWSAppSyncClient({
      url: GRAPHQL_ENDPOINT,
      region: AWS_REGION,
      disableOffline: true,
      auth: {
        type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
        jwtToken: () => idToken,
      },
    });

    const authRes2AfterGroup: any = await authenticateUser(USERNAME2, TMP_PASSWORD, REAL_PASSWORD);
    const idToken2 = authRes2AfterGroup.getIdToken().getJwtToken();
    GRAPHQL_CLIENT_2 = new AWSAppSyncClient({
      url: GRAPHQL_ENDPOINT,
      region: AWS_REGION,
      disableOffline: true,
      auth: {
        type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
        jwtToken: () => idToken2,
      },
    });

    const authRes3: any = await authenticateUser(USERNAME3, TMP_PASSWORD, REAL_PASSWORD);
    const idToken3 = authRes3.getIdToken().getJwtToken();
    GRAPHQL_CLIENT_3 = new AWSAppSyncClient({
      url: GRAPHQL_ENDPOINT,
      region: AWS_REGION,
      disableOffline: true,
      auth: {
        type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
        jwtToken: () => idToken3,
      },
    });

    const authRes4: any = await authenticateUser(USERNAME4, TMP_PASSWORD, REAL_PASSWORD);
    const idToken4 = authRes4.getIdToken().getJwtToken();
    GRAPHQL_CLIENT_4 = new AWSAppSyncClient({
      url: GRAPHQL_ENDPOINT,
      region: AWS_REGION,
      disableOffline: true,
      auth: {
        type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
        jwtToken: () => idToken4,
      },
    });

    // sign out previous cognito user
    await Auth.signOut();
    await Auth.signIn(USERNAME1, REAL_PASSWORD);
    const authCreds = await Auth.currentCredentials();
    GRAPHQL_IAM_AUTH_CLIENT = new AWSAppSyncClient({
      url: GRAPHQL_ENDPOINT,
      region: AWS_REGION,
      disableOffline: true,
      auth: {
        type: AUTH_TYPE.AWS_IAM,
        credentials: authCreds,
      },
    });

    GRAPHQL_APIKEY_CLIENT = new AWSAppSyncClient({
      url: GRAPHQL_ENDPOINT,
      region: AWS_REGION,
      auth: {
        type: AUTH_TYPE.API_KEY,
        apiKey: API_KEY,
      },
      disableOffline: true,
    });

    // Create sample mutations to test search queries
    await createEntries();
  } catch (e) {
    console.error(e);
    throw e;
  }
});

afterAll(async () => {
  await cleanupStackAfterTest(
    BUCKET_NAME,
    STACK_NAME,
    cf,
    { cognitoClient, userPoolId: USER_POOL_ID },
    { identityClient, identityPoolId: IDENTITY_POOL_ID },
  );
  try {
    await iamHelper.deleteRole(AUTH_ROLE_NAME);
  } catch (e) {
    console.warn(`Error during auth role cleanup ${e}`);
  }
  try {
    await iamHelper.deleteRole(UNAUTH_ROLE_NAME);
  } catch (e) {
    console.warn(`Error during unauth role cleanup ${e}`);
  }
});

/**
 * Tests
 */

// cognito owner check
test('test Comments as owner', async () => {
  const ownerResponse: any = await GRAPHQL_CLIENT_1.query({
    query: gql`
      query SearchComments {
        searchComments {
          items {
            id
            content
            owner
          }
          nextToken
        }
      }
    `,
  });
  expect(ownerResponse.data.searchComments).toBeDefined();
  expect(ownerResponse.data.searchComments.items.length).toEqual(1);
  expect(ownerResponse.data.searchComments.items[0].content).toEqual('ownerContent');
});

// cognito static group check
test('test Comments as user in writer group', async () => {
  const writerResponse: any = await GRAPHQL_CLIENT_2.query({
    query: gql`
      query SearchComments {
        searchComments {
          items {
            id
            content
            owner
          }
          nextToken
        }
      }
    `,
  });
  expect(writerResponse.data.searchComments).toBeDefined();
  expect(writerResponse.data.searchComments.items.length).toEqual(4);
  // only ownerContent should have the owner name
  // because the group permission was met we did not populate an owner field
  // therefore there is no owner
  expect(writerResponse.data.searchComments.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        content: 'ownerContent',
        owner: USERNAME1,
      }),
      expect.objectContaining({
        id: expect.any(String),
        content: 'content1',
        owner: null,
      }),
      expect.objectContaining({
        id: expect.any(String),
        content: 'content1',
        owner: null,
      }),
      expect.objectContaining({
        id: expect.any(String),
        content: 'content3',
        owner: null,
      }),
    ]),
  );
});

// cognito test as unauthorized user
test('test Comments as user that is not an owner nor is in writer group', async () => {
  const user3Response: any = await GRAPHQL_CLIENT_3.query({
    query: gql`
      query SearchComments {
        searchComments {
          items {
            id
            content
            owner
          }
          nextToken
        }
      }
    `,
  });
  expect(user3Response.data.searchComments).toBeDefined();
  expect(user3Response.data.searchComments.items.length).toEqual(0);
  expect(user3Response.data.searchComments.nextToken).toBeNull();
});

// cognito dynamic group check
test('test Todo as user in the dynamic group admin', async () => {
  const adminResponse: any = await GRAPHQL_CLIENT_2.query({
    query: gql`
      query SearchTodos {
        searchTodos {
          items {
            id
            groups
            content
          }
          nextToken
        }
      }
    `,
  });
  expect(adminResponse.data.searchTodos).toBeDefined();
  expect(adminResponse.data.searchTodos.items.length).toEqual(3);
  expect(adminResponse.data.searchTodos.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        content: 'adminContent1',
        groups: ADMIN_GROUP_NAME,
      }),
      expect.objectContaining({
        id: expect.any(String),
        content: 'adminContent2',
        groups: ADMIN_GROUP_NAME,
      }),
      expect.objectContaining({
        id: expect.any(String),
        content: 'adminContent3',
        groups: ADMIN_GROUP_NAME,
      }),
    ]),
  );
});

// iam test
test('test Post as authorized user', async () => {
  const authUser: any = await GRAPHQL_IAM_AUTH_CLIENT.query({
    query: gql`
      query SearchPosts {
        searchPosts {
          items {
            id
            content
            secret
          }
          nextToken
        }
      }
    `,
  });
  expect(authUser.data.searchPosts).toBeDefined();
  expect(authUser.data.searchPosts.items.length).toEqual(4);
  expect(authUser.data.searchPosts.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        content: 'post2',
        secret: 'post2secret',
      }),
      expect.objectContaining({
        id: expect.any(String),
        content: 'post1',
        secret: 'post1secret',
      }),
      expect.objectContaining({
        id: expect.any(String),
        content: 'post3',
        secret: 'post3secret',
      }),
      expect.objectContaining({
        id: expect.any(String),
        content: 'publicPost',
        secret: null,
      }),
    ]),
  );
});

// test apikey 2nd scenario
test('test searchPosts with apikey and secret removed', async () => {
  const apiKeyResponse: any = await GRAPHQL_APIKEY_CLIENT.query({
    query: gql`
      query SearchPosts {
        searchPosts {
          items {
            id
            content
          }
          nextToken
        }
      }
    `,
  });
  expect(apiKeyResponse.data.searchPosts).toBeDefined();
  expect(apiKeyResponse.data.searchPosts.items).toHaveLength(4);
  expect(apiKeyResponse.data.searchPosts.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        content: 'post2',
      }),
      expect.objectContaining({
        id: expect.any(String),
        content: 'post1',
      }),
      expect.objectContaining({
        id: expect.any(String),
        content: 'post3',
      }),
      expect.objectContaining({
        id: expect.any(String),
        content: 'publicPost',
      }),
    ]),
  );
});

// test iam/apiKey schema with unauth user
test('test post as an cognito user that is not allowed in this schema', async () => {
  try {
    await GRAPHQL_CLIENT_3.query({
      query: gql`
        query SearchPosts {
          searchPosts {
            items {
              id
              content
              secret
            }
            nextToken
          }
        }
      `,
    });
  } catch (err) {
    expect(err.graphQLErrors[0].errorType).toEqual('Unauthorized');
    expect(err.graphQLErrors[0].message).toEqual('Not Authorized to access searchPosts on type Query');
  }
});

test('test that apikey is not allowed to query aggregations on secret for post', async () => {
  try {
    await GRAPHQL_APIKEY_CLIENT.query({
      query: gql`
        query aggSearch {
          searchPosts(aggregates: [{ name: "Terms", type: terms, field: secret }]) {
            aggregateItems {
              name
              result {
                ... on SearchableAggregateBucketResult {
                  buckets {
                    doc_count
                    key
                  }
                }
              }
            }
          }
        }
      `,
    });
  } catch (err) {
    expect(err.graphQLErrors[0].errorType).toEqual('Unauthorized');
    expect(err.graphQLErrors[0].message).toEqual('Unauthorized to run aggregation on field: secret');
  }
});

test('test that iam can run aggregations on secret field', async () => {
  try {
    const response: any = await GRAPHQL_IAM_AUTH_CLIENT.query({
      query: gql`
        query aggSearch {
          searchPosts(aggregates: [{ name: "Terms", type: terms, field: secret }]) {
            aggregateItems {
              name
              result {
                ... on SearchableAggregateBucketResult {
                  buckets {
                    doc_count
                    key
                  }
                }
              }
            }
          }
        }
      `,
    });
    expect(response.data.searchPosts).toBeDefined();
    expect(response.data.searchPosts.aggregateItems).toHaveLength(1);
    const aggregateItem = response.data.searchPosts.aggregateItems[0];
    expect(aggregateItem.name).toEqual('Terms');
    expect(aggregateItem.result.buckets).toHaveLength(3);
    expect(aggregateItem.result.buckets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          doc_count: 1,
          key: 'post1secret',
        }),
        expect.objectContaining({
          doc_count: 1,
          key: 'post2secret',
        }),
        expect.objectContaining({
          doc_count: 1,
          key: 'post3secret',
        }),
      ]),
    );
  } catch (err) {
    expect(err).not.toBeDefined();
  }
});

test('test that admin can run aggregate query on protected field', async () => {
  try {
    const response: any = await GRAPHQL_CLIENT_2.query({
      query: gql`
        query {
          searchBlogs(aggregates: [{ name: "Terms", type: terms, field: secret }]) {
            aggregateItems {
              name
              result {
                ... on SearchableAggregateBucketResult {
                  buckets {
                    doc_count
                    key
                  }
                }
              }
            }
          }
        }
      `,
    });
    expect(response.data.searchBlogs).toBeDefined();
    expect(response.data.searchBlogs.aggregateItems);
    const aggregateItem = response.data.searchBlogs.aggregateItems[0];
    expect(aggregateItem.name).toEqual('Terms');
    expect(aggregateItem.result.buckets).toHaveLength(2);
    expect(aggregateItem.result.buckets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          doc_count: 2,
          key: `${USERNAME1}secret`,
        }),
        expect.objectContaining({
          doc_count: 2,
          key: `${USERNAME4}secret`,
        }),
      ]),
    );
  } catch (err) {
    expect(err).not.toBeDefined();
  }
});

test('test that member in writer group has writer group auth when running aggregate query', async () => {
  try {
    const response: any = await GRAPHQL_CLIENT_4.query({
      query: gql`
        query {
          searchBlogs(aggregates: [{ name: "Terms", type: terms, field: secret }]) {
            aggregateItems {
              name
              result {
                ... on SearchableAggregateBucketResult {
                  buckets {
                    doc_count
                    key
                  }
                }
              }
            }
          }
        }
      `,
    });
    expect(response.data.searchBlogs).toBeDefined();
    expect(response.data.searchBlogs.aggregateItems);
    const aggregateItem = response.data.searchBlogs.aggregateItems[0];
    expect(aggregateItem.name).toEqual('Terms');
    expect(aggregateItem.result.buckets).toHaveLength(2);
    expect(aggregateItem.result.buckets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          doc_count: 2,
          key: `${USERNAME1}secret`,
        }),
        expect.objectContaining({
          doc_count: 1,
          key: `${USERNAME4}secret`,
        }),
      ]),
    );
  } catch (err) {
    expect(err).not.toBeDefined();
  }
});

test('test that an owner does not get any results for the agg query on the secret field', async () => {
  try {
    const response: any = await GRAPHQL_CLIENT_1.query({
      query: gql`
        query {
          searchBlogs(aggregates: [{ name: "Terms", type: terms, field: secret }]) {
            aggregateItems {
              name
              result {
                ... on SearchableAggregateBucketResult {
                  buckets {
                    doc_count
                    key
                  }
                }
              }
            }
          }
        }
      `,
    });
    expect(response.data.searchBlogs).toBeDefined();
    expect(response.data.searchBlogs.aggregateItems);
    const aggregateItem = response.data.searchBlogs.aggregateItems[0];
    expect(aggregateItem.name).toEqual('Terms');
    expect(aggregateItem.result.buckets).toHaveLength(0);
  } catch (err) {
    expect(err).not.toBeDefined();
  }
});
test('test that an owner can run aggregations on records which belong to them', async () => {
  try {
    const response: any = await GRAPHQL_CLIENT_1.query({
      query: gql`
        query {
          searchBlogs(aggregates: [{ name: "Terms", type: terms, field: title }]) {
            aggregateItems {
              name
              result {
                ... on SearchableAggregateBucketResult {
                  buckets {
                    doc_count
                    key
                  }
                }
              }
            }
          }
        }
      `,
    });
    expect(response.data.searchBlogs).toBeDefined();
    expect(response.data.searchBlogs.aggregateItems);
    const aggregateItem = response.data.searchBlogs.aggregateItems[0];
    expect(aggregateItem.name).toEqual('Terms');
    expect(aggregateItem.result.buckets).toHaveLength(1);
    expect(aggregateItem.result.buckets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          doc_count: 2,
          key: 'cooking',
        }),
      ]),
    );
  } catch (err) {
    expect(err).not.toBeDefined();
  }
});
/**
 * Input types
 *  */
type CreateCommentInput = {
  id?: string | null;
  content?: string | null;
};

type CreateTodoInput = {
  id?: string | null;
  groups?: string | null;
  content?: string | null;
};

type CreatePostInput = {
  id?: string | null;
  content?: string | null;
  secret?: string | null;
};
export type CreateBlogInput = {
  id?: string;
  title?: string;
  ups?: number;
  owner?: string;
  groupsField?: string;
  secret?: string;
};

// mutations
async function createComment(client: AWSAppSyncClient<any>, input: CreateCommentInput) {
  const create = gql`
    mutation CreateComment($input: CreateCommentInput!) {
      createComment(input: $input) {
        id
        content
        owner
      }
    }
  `;
  return await client.mutate({ mutation: create, variables: { input } });
}
async function createTodo(client: AWSAppSyncClient<any>, input: CreateTodoInput) {
  const create = gql`
    mutation CreateTodo($input: CreateTodoInput!) {
      createTodo(input: $input) {
        id
        groups
        content
      }
    }
  `;
  return await client.mutate({ mutation: create, variables: { input } });
}
async function createPost(client: AWSAppSyncClient<any>, input: CreatePostInput) {
  const create = gql`
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        id
        content
      }
    }
  `;
  return await client.mutate({ mutation: create, variables: { input } });
}

async function createBlog(client: AWSAppSyncClient<any>, input: CreateBlogInput) {
  const create = gql`
    mutation CreateBlog($input: CreateBlogInput!) {
      createBlog(input: $input) {
        id
        title
        ups
        downs
        percentageUp
        isPublished
        createdAt
        updatedAt
        owner
        groupsField
        secret
      }
    }
  `;
  return await client.mutate({ mutation: create, variables: { input } });
}

const createEntries = async () => {
  await createComment(GRAPHQL_CLIENT_1, {
    content: 'ownerContent',
  });
  try {
    await createPost(GRAPHQL_APIKEY_CLIENT, { content: 'publicPost' });
  } catch (err) {
    // will err since the secret is in the fields response though the post should still go through
  }
  for (let i = 1; i < 4; i++) {
    await createComment(GRAPHQL_CLIENT_2, { content: `content${i}` });
    await createTodo(GRAPHQL_CLIENT_2, { groups: 'admin', content: `adminContent${i}` });
    await createPost(GRAPHQL_IAM_AUTH_CLIENT, { content: `post${i}`, secret: `post${i}secret` });
  }
  await createBlog(GRAPHQL_CLIENT_2, {
    groupsField: WRITER_GROUP_NAME,
    owner: USERNAME1,
    secret: `${USERNAME1}secret`,
    ups: 10,
    title: 'cooking',
  });
  await createBlog(GRAPHQL_CLIENT_2, {
    groupsField: WRITER_GROUP_NAME,
    owner: USERNAME1,
    secret: `${USERNAME1}secret`,
    ups: 10,
    title: 'cooking',
  });
  await createBlog(GRAPHQL_CLIENT_2, {
    groupsField: WRITER_GROUP_NAME,
    owner: USERNAME4,
    secret: `${USERNAME4}secret`,
    ups: 25,
    title: 'golfing',
  });
  await createBlog(GRAPHQL_CLIENT_2, { groupsField: 'editor', owner: USERNAME4, secret: `${USERNAME4}secret`, ups: 10, title: 'cooking' });
  // Waiting for the ES Cluster + Streaming Lambda infra to be setup
  await cf.wait(120, () => Promise.resolve());
};

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}
