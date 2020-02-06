import { ResourceConstants } from 'graphql-transformer-common';
import { GraphQLTransform } from 'graphql-transformer-core';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { ModelAuthTransformer } from 'graphql-auth-transformer';
import { ModelConnectionTransformer } from 'graphql-connection-transformer';
import { SearchableModelTransformer } from 'graphql-elasticsearch-transformer';
import * as fs from 'fs';
import { CloudFormationClient } from '../CloudFormationClient';
import { Output } from 'aws-sdk/clients/cloudformation';
import { default as S3 } from 'aws-sdk/clients/s3';
import { CreateBucketRequest } from 'aws-sdk/clients/s3';
import { default as CognitoClient } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import { AWS } from '@aws-amplify/core';
import { Auth } from 'aws-amplify';
import gql from 'graphql-tag';
import { S3Client } from '../S3Client';
import { deploy } from '../deployNestedStacks';
import { default as moment } from 'moment';
import emptyBucket from '../emptyBucket';
import {
  createUserPool,
  createUserPoolClient,
  deleteUserPool,
  addIAMRolesToCFNStack,
  signupAndAuthenticateUser,
  createGroup,
  addUserToGroup,
  configureAmplify,
} from '../cognitoUtils';
import 'isomorphic-fetch';

// To overcome of the way of how AmplifyJS picks up currentUserCredentials
const anyAWS = AWS as any;

if (anyAWS && anyAWS.config && anyAWS.config.credentials) {
  delete anyAWS.config.credentials;
}

// to deal with bug in cognito-identity-js
(global as any).fetch = require('node-fetch');

jest.setTimeout(9700000);

const AWS_REGION = 'us-west-2';
const cf = new CloudFormationClient(AWS_REGION);
const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `SearchableAuthTests-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `searchable-auth-tests-bucket-${BUILD_TIMESTAMP}`;
const LOCAL_BUILD_ROOT = '/tmp/searchable_auth_tests/';
const DEPLOYMENT_ROOT_KEY = 'deployments';
const AUTH_ROLE_NAME = `${STACK_NAME}-authRole`;
const UNAUTH_ROLE_NAME = `${STACK_NAME}-unauthRole`;
const IDENTITY_POOL_NAME = `SearchableAuthModelAuthTransformerTest_${BUILD_TIMESTAMP}_identity_pool`;
const USER_POOL_CLIENTWEB_NAME = `search_auth_${BUILD_TIMESTAMP}_clientweb`;
const USER_POOL_CLIENT_NAME = `search_auth_${BUILD_TIMESTAMP}_client`;

let GRAPHQL_ENDPOINT = undefined;

/**
 * Client 1 is logged in and is a member of the Admin group.
 */
let GRAPHQL_CLIENT_1: AWSAppSyncClient<any> = undefined;

/**
 * Client 2 is logged in and is a member of the Devs group.
 */
let GRAPHQL_CLIENT_2: AWSAppSyncClient<any> = undefined;

/**
 * Client 3 is logged in and has no group memberships.
 */
let GRAPHQL_CLIENT_3: AWSAppSyncClient<any> = undefined;

/**
 * Auth IAM Client
 */
let GRAPHQL_IAM_AUTH_CLIENT: AWSAppSyncClient<any> = undefined;

/**
 * API Key Client
 */
let GRAPHQL_APIKEY_CLIENT: AWSAppSyncClient<any> = undefined;

let USER_POOL_ID = undefined;

const USERNAME1 = 'user1@test.com';
const USERNAME2 = 'user2@test.com';
const USERNAME3 = 'user3@test.com';
const TMP_PASSWORD = 'Password123!';
const REAL_PASSWORD = 'Password1234!';
const WRITER_GROUP_NAME = 'writer';
const ADMIN_GROUP_NAME = 'admin';

const cognitoClient = new CognitoClient({ apiVersion: '2016-04-19', region: AWS_REGION });
const customS3Client = new S3Client(AWS_REGION);
const awsS3Client = new S3({ region: AWS_REGION });

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}

async function createBucket(name: string) {
  return new Promise((res, rej) => {
    const params: CreateBucketRequest = {
      Bucket: name,
    };
    awsS3Client.createBucket(params, (err, data) => (err ? rej(err) : res(data)));
  });
}

beforeAll(async () => {
  // Create a stack for the post model with auth enabled.
  if (!fs.existsSync(LOCAL_BUILD_ROOT)) {
    fs.mkdirSync(LOCAL_BUILD_ROOT);
  }
  await createBucket(BUCKET_NAME);
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
    type Post @model
        @searchable
        @auth(rules: [
            { allow: public, provider: apiKey }
            { allow: private, provider: iam }
        ]) {
        id: ID!
        content: String
        secret: String @auth(rules: [{ allow: private, provider: iam }])
    }`;

  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new ModelConnectionTransformer(),
      new SearchableModelTransformer(),
      new ModelAuthTransformer({
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
      }),
    ],
  });
  const userPoolResponse = await createUserPool(cognitoClient, `UserPool${STACK_NAME}`);
  USER_POOL_ID = userPoolResponse.UserPool.Id;
  const userPoolClientResponse = await createUserPoolClient(cognitoClient, USER_POOL_ID, `UserPool${STACK_NAME}`);
  const userPoolClientId = userPoolClientResponse.UserPoolClient.ClientId;
  try {
    // Clean the bucket
    let out = transformer.transform(validSchema);

    out = addIAMRolesToCFNStack(out, {
      AUTH_ROLE_NAME,
      UNAUTH_ROLE_NAME,
      IDENTITY_POOL_NAME,
      USER_POOL_CLIENTWEB_NAME,
      USER_POOL_CLIENT_NAME,
      USER_POOL_ID,
    });

    const params = {
      CreateAPIKey: '1',
      AuthCognitoUserPoolId: USER_POOL_ID,
    };

    const finishedStack = await deploy(
      customS3Client,
      cf,
      STACK_NAME,
      out,
      params,
      LOCAL_BUILD_ROOT,
      BUCKET_NAME,
      DEPLOYMENT_ROOT_KEY,
      BUILD_TIMESTAMP,
    );
    // Wait for any propagation to avoid random errors
    await cf.wait(120, () => Promise.resolve());

    expect(finishedStack).toBeDefined();
    const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
    const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput);
    GRAPHQL_ENDPOINT = getApiEndpoint(finishedStack.Outputs);
    console.log(`Using graphql url: ${GRAPHQL_ENDPOINT}`);

    const apiKey = getApiKey(finishedStack.Outputs);
    console.log(`API KEY: ${apiKey}`);
    expect(apiKey).toBeTruthy();

    const getIdentityPoolId = outputValueSelector('IdentityPoolId');
    const identityPoolId = getIdentityPoolId(finishedStack.Outputs);
    expect(identityPoolId).toBeTruthy();
    console.log(`Identity Pool Id: ${identityPoolId}`);

    console.log(`User pool Id: ${USER_POOL_ID}`);
    console.log(`User pool ClientId: ${userPoolClientId}`);

    // Verify we have all the details
    expect(GRAPHQL_ENDPOINT).toBeTruthy();
    expect(USER_POOL_ID).toBeTruthy();
    expect(userPoolClientId).toBeTruthy();

    // Configure Amplify, create users, and sign in.
    configureAmplify(USER_POOL_ID, userPoolClientId, identityPoolId);

    await signupAndAuthenticateUser(USER_POOL_ID, USERNAME1, TMP_PASSWORD, REAL_PASSWORD);
    await signupAndAuthenticateUser(USER_POOL_ID, USERNAME2, TMP_PASSWORD, REAL_PASSWORD);
    await signupAndAuthenticateUser(USER_POOL_ID, USERNAME3, TMP_PASSWORD, REAL_PASSWORD);
    await createGroup(USER_POOL_ID, WRITER_GROUP_NAME);
    await createGroup(USER_POOL_ID, ADMIN_GROUP_NAME);
    await addUserToGroup(WRITER_GROUP_NAME, USERNAME2, USER_POOL_ID);
    await addUserToGroup(ADMIN_GROUP_NAME, USERNAME2, USER_POOL_ID);

    const authResAfterGroup: any = await signupAndAuthenticateUser(USER_POOL_ID, USERNAME1, TMP_PASSWORD, REAL_PASSWORD);
    const idToken = authResAfterGroup.getIdToken().getJwtToken();
    GRAPHQL_CLIENT_1 = new AWSAppSyncClient({
      url: GRAPHQL_ENDPOINT,
      region: AWS_REGION,
      disableOffline: true,
      offlineConfig: {
        keyPrefix: 'userPools',
      },
      auth: {
        type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
        jwtToken: idToken,
      },
    });

    const authRes2AfterGroup: any = await signupAndAuthenticateUser(USER_POOL_ID, USERNAME2, TMP_PASSWORD, REAL_PASSWORD);
    const idToken2 = authRes2AfterGroup.getIdToken().getJwtToken();
    GRAPHQL_CLIENT_2 = new AWSAppSyncClient({
      url: GRAPHQL_ENDPOINT,
      region: AWS_REGION,
      disableOffline: true,
      offlineConfig: {
        keyPrefix: 'userPools',
      },
      auth: {
        type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
        jwtToken: idToken2,
      },
    });

    const authRes3: any = await signupAndAuthenticateUser(USER_POOL_ID, USERNAME3, TMP_PASSWORD, REAL_PASSWORD);
    const idToken3 = authRes3.getIdToken().getJwtToken();
    GRAPHQL_CLIENT_3 = new AWSAppSyncClient({
      url: GRAPHQL_ENDPOINT,
      region: AWS_REGION,
      disableOffline: true,
      offlineConfig: {
        keyPrefix: 'userPools',
      },
      auth: {
        type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
        jwtToken: idToken3,
      },
    });

    await Auth.signIn(USERNAME1, REAL_PASSWORD);
    const authCredentials = await Auth.currentUserCredentials();
    GRAPHQL_IAM_AUTH_CLIENT = new AWSAppSyncClient({
      url: GRAPHQL_ENDPOINT,
      region: AWS_REGION,
      disableOffline: true,
      offlineConfig: {
        keyPrefix: 'iam',
      },
      auth: {
        type: AUTH_TYPE.AWS_IAM,
        credentials: Auth.essentialCredentials(authCredentials),
      },
    });

    GRAPHQL_APIKEY_CLIENT = new AWSAppSyncClient({
      url: GRAPHQL_ENDPOINT,
      region: AWS_REGION,
      disableOffline: true,
      offlineConfig: {
        keyPrefix: 'apikey',
      },
      auth: {
        type: AUTH_TYPE.API_KEY,
        apiKey: apiKey,
      },
    });
    // create records for post, comment, and todo
    await createRecords();
  } catch (e) {
    console.error(e);
    expect(true).toEqual(false);
  }
});

afterAll(async () => {
  try {
    console.log('Deleting stack ' + STACK_NAME);
    await cf.deleteStack(STACK_NAME);
    await deleteUserPool(cognitoClient, USER_POOL_ID);
    await cf.waitForStack(STACK_NAME);
    console.log('Successfully deleted stack ' + STACK_NAME);
  } catch (e) {
    if (e.code === 'ValidationError' && e.message === `Stack with id ${STACK_NAME} does not exist`) {
      // The stack was deleted. This is good.
      expect(true).toEqual(true);
      console.log('Successfully deleted stack ' + STACK_NAME);
    } else {
      console.error(e);
      throw e;
    }
  }
  try {
    await emptyBucket(BUCKET_NAME);
  } catch (e) {
    console.error(`Failed to empty S3 bucket: ${e}`);
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
  const writerItems = writerResponse.data.searchComments.items;
  writerItems.forEach((writerItem: { id: string; content: string | null; owner: string | null }) => {
    expect(['ownerContent', 'content1', 'content2', 'content3']).toContain(writerItem.content);
    if (writerItem.content === 'ownerContent') {
      expect(writerItem.owner).toEqual(USERNAME1);
    } else {
      expect(writerItem.owner).toEqual(USERNAME2);
    }
  });
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
  const adminItems = adminResponse.data.searchTodos.items;
  adminItems.forEach((adminItem: { id: string; content: string; groups: string }) => {
    expect(['adminContent1', 'adminContent2', 'adminContent3']).toContain(adminItem.content);
    expect(adminItem.groups).toEqual('admin');
  });
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
  const authUserItems = authUser.data.searchPosts.items;
  authUserItems.forEach((authUserItem: { id: string; content: string; secret: string }) => {
    expect(['publicPost', 'post1', 'post2', 'post3']).toContain(authUserItem.content);
    expect(['notViewableToPublic', 'post1secret', 'post2secret', 'post3secret']).toContain(authUserItem.secret);
  });
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
  const apiKeyResponseItems = apiKeyResponse.data.searchPosts.items;
  apiKeyResponseItems.forEach((item: { id: string; content: string | null }) => {
    expect(item.id).toBeDefined();
    if (item.content) {
      expect(['publicPost', 'post1', 'post2', 'post3']).toContain(item.content);
    }
  });
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
    console.log(err);
    expect(err.graphQLErrors[0].errorType).toEqual('Unauthorized');
    expect(err.graphQLErrors[0].message).toEqual('Not Authorized to access searchPosts on type Query');
  }
});

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

async function createRecords() {
  console.log('create records');
  try {
    // create a comment as an owner not in the writer group
    const ownerCreate = await createComment(GRAPHQL_CLIENT_1, {
      content: 'ownerContent',
    });
    console.log(ownerCreate);
    // create comments as user 2 that is in the writer group
    const createCommentList: CreateCommentInput[] = [{ content: 'content1' }, { content: 'content2' }, { content: 'content3' }];
    createCommentList.forEach(async (commentInput: CreateCommentInput) => {
      await createComment(GRAPHQL_CLIENT_2, commentInput);
    });
    // create todos as user in the admin group
    const createTodoList: CreateTodoInput[] = [
      { groups: 'admin', content: 'adminContent1' },
      { groups: 'admin', content: 'adminContent2' },
      { groups: 'admin', content: 'adminContent3' },
    ];
    createTodoList.forEach(async (todoInput: CreateTodoInput) => {
      await createTodo(GRAPHQL_CLIENT_2, todoInput);
    });
    // create a post as a user with the apiKey
    const apiKeyResponse = await createPost(GRAPHQL_APIKEY_CLIENT, {
      content: 'publicPost',
      secret: 'notViewableToPublic',
    });
    console.log(apiKeyResponse);
    // create posts as user that has auth role
    const createPostList: CreatePostInput[] = [
      { content: 'post1', secret: 'post1secret' },
      { content: 'post2', secret: 'post2secret' },
      { content: 'post3', secret: 'post3secret' },
    ];
    createPostList.forEach(async (postInput: CreatePostInput) => {
      await createPost(GRAPHQL_IAM_AUTH_CLIENT, postInput);
    });
    // Waiting for the ES Cluster + Streaming Lambda infra to be setup
    console.log('Waiting for the ES Cluster + Streaming Lambda infra to be setup');
    await cf.wait(120, () => Promise.resolve());
  } catch (err) {
    console.log(err);
  }
}
