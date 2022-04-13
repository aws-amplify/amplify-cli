import { Auth } from 'aws-amplify';
import { IndexTransformer, PrimaryKeyTransformer } from '@aws-amplify/graphql-index-transformer';
import { HasOneTransformer, HasManyTransformer } from '@aws-amplify/graphql-relational-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { Output } from 'aws-sdk/clients/cloudformation';
import { CloudFormationClient } from '../CloudFormationClient';
import { S3Client } from '../S3Client';
import { cleanupStackAfterTest, deploy } from '../deployNestedStacks';
import { CognitoIdentityServiceProvider as CognitoClient, S3, CognitoIdentity, IAM } from 'aws-sdk';
import moment from 'moment';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import {
  createUserPool,
  createIdentityPool,
  createUserPoolClient,
  configureAmplify,
  authenticateUser,
  signupUser,
  createGroup,
  addUserToGroup,
} from '../cognitoUtils';
import { IAMHelper } from '../IAMHelper';
import { ResourceConstants } from 'graphql-transformer-common';
import gql from 'graphql-tag';
import AWS = require('aws-sdk');
import 'isomorphic-fetch';

// to deal with bug in cognito-identity-js
(global as any).fetch = require('node-fetch');

// To overcome of the way of how AmplifyJS picks up currentUserCredentials
const anyAWS = AWS as any;
if (anyAWS && anyAWS.config && anyAWS.config.credentials) {
  delete anyAWS.config.credentials;
}

jest.setTimeout(2000000);

const AWS_REGION = 'us-west-2';

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}

const cf = new CloudFormationClient(AWS_REGION);
const customS3Client = new S3Client(AWS_REGION);
const cognitoClient = new CognitoClient({ apiVersion: '2016-04-19', region: AWS_REGION });
const identityClient = new CognitoIdentity({ apiVersion: '2014-06-30', region: AWS_REGION });
const iamHelper = new IAMHelper(AWS_REGION);
const awsS3Client = new S3({ region: AWS_REGION });

// stack info
const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `MultiAuthV2TransformerTests-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `appsync-multi-auth-v2-transformer-test-bucket-${BUILD_TIMESTAMP}`;
const LOCAL_FS_BUILD_DIR = '/tmp/multi_authv2_transformer_tests/';
const S3_ROOT_DIR_KEY = 'deployments';
const AUTH_ROLE_NAME = `${STACK_NAME}-authRole`;
const UNAUTH_ROLE_NAME = `${STACK_NAME}-unauthRole`;
const CUSTOM_GROUP_ROLE_NAME = `${STACK_NAME}-customGroupRole`;
let USER_POOL_ID: string;
let IDENTITY_POOL_ID: string;
let GRAPHQL_ENDPOINT: string;
let APIKEY_GRAPHQL_CLIENT: AWSAppSyncClient<any> = undefined;
let USER_POOL_AUTH_CLIENT: AWSAppSyncClient<any> = undefined;
let IAM_CUSTOM_GROUP_CLIENT: AWSAppSyncClient<any> = undefined;
let IAM_UNAUTHCLIENT: AWSAppSyncClient<any> = undefined;
let IAM_AUTHCLIENT: AWSAppSyncClient<any> = undefined;

const CUSTOM_GROUP_NAME = 'customGroup';
const USERNAME1 = 'user1@test.com';
const USERNAME2 = 'user2@test.com';
const TMP_PASSWORD = 'Password123!';
const REAL_PASSWORD = 'Password1234!';

beforeAll(async () => {
  const validSchema = `
    # Allow anyone to access. This is translated into API_KEY.
    type PostPublic @model @auth(rules: [{ allow: public }]) {
      id: ID!
      title: String
    }

    # Allow anyone to access. This is translated to IAM with unauth role.
    type PostPublicIAM @model @auth(rules: [{ allow: public, provider: iam }]) {
      id: ID!
      title: String
    }

    # Allow anyone with a valid Amazon Cognito UserPools JWT to access.
    type PostPrivate @model @auth(rules: [{ allow: private }]) {
      id: ID!
      title: String
    }

    # Allow anyone with a sigv4 signed request with relevant policy to access.
    type PostPrivateIAM @model @auth(rules: [{ allow: private, provider: iam }]) {
      id: ID!
      title: String
    }

    # I have a model that is protected by userPools by default.
    # I want to call createPost from my lambda.
    type PostOwnerIAM
      @model
      @auth(
        rules: [
          # The cognito user pool owner can CRUD.
          { allow: owner }
          # A lambda function using IAM can call Mutation.createPost.
          { allow: private, provider: iam, operations: [create] }
        ]
      ) {
      id: ID!
      title: String
      owner: String
    }

    type PostSecretFieldIAM
      @model
      @auth(
        rules: [
          # The cognito user pool and can CRUD.
          { allow: private }
          # iam user can also have CRUD
          { allow: private, provider: iam }
        ]
      ) {
      id: ID
      title: String
      owner: String
      secret: String
        @auth(
          rules: [
            # Only a lambda function using IAM can create/read/update this field
            { allow: private, provider: iam, operations: [create,read,update] }
          ]
        )
    }

    type PostConnection @model @auth(rules: [{ allow: public }]) {
      id: ID!
      title: String!
      comments: [CommentConnection] @hasMany
    }

    # allow access via cognito user pools
    type CommentConnection @model @auth(rules: [{ allow: private }]) {
      id: ID!
      content: String!
      post: PostConnection @hasOne
    }

    type PostIAMWithKeys
      @model
      @auth(
        rules: [
          # API Key can CRUD
          { allow: public }
          # IAM can read
          { allow: public, provider: iam, operations: [read] }
        ]
      ) {
      id: ID!
      title: String
      type: String
        @index(
          name: "byDate"
          sortKeyFields: ["date"]
          queryField: "getPostIAMWithKeysByDate"
        )
      date: AWSDateTime
    }

    # This type is for the managed policy slicing, only deployment test in this e2e
    type TodoWithExtraLongLongLongLongLongLongLongLongLongLongLongLongLongLongLongName
      @model(subscriptions: null)
      @auth(rules: [{ allow: private, provider: iam }]) {
      id: ID!
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename001: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename002: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename003: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename004: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename005: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename006: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename007: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename008: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename009: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename010: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename011: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename012: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename013: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename014: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename015: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename016: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename017: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename018: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename019: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename020: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename021: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename022: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename023: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename024: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename025: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename026: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename027: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename028: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename029: String!
        @auth(rules: [{ allow: private, provider: iam }])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename030: String!
      description: String
    }
  `;
  // create deployment bucket
  try {
    await awsS3Client.createBucket({ Bucket: BUCKET_NAME }).promise();
  } catch (e) {
    // fail early if we can't create the bucket
    expect(e).not.toBeDefined();
  }

  // create userpool
  const userPoolResponse = await createUserPool(cognitoClient, `UserPool${STACK_NAME}`);
  USER_POOL_ID = userPoolResponse.UserPool.Id;
  const userPoolClientResponse = await createUserPoolClient(cognitoClient, USER_POOL_ID, `UserPool${STACK_NAME}`);
  const userPoolClientId = userPoolClientResponse.UserPoolClient.ClientId;
  // create auth and unauthroles
  const roles = await iamHelper.createRoles(AUTH_ROLE_NAME, UNAUTH_ROLE_NAME);
  // create admin group role
  const customGroupRole = await iamHelper.createRoleForCognitoGroup(CUSTOM_GROUP_ROLE_NAME);
  await createGroup(USER_POOL_ID, CUSTOM_GROUP_NAME, customGroupRole.Arn);
  // create identitypool
  IDENTITY_POOL_ID = await createIdentityPool(identityClient, `IdentityPool${STACK_NAME}`, {
    authRoleArn: roles.authRole.Arn,
    unauthRoleArn: roles.unauthRole.Arn,
    providerName: `cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`,
    clientId: userPoolClientId,
    useTokenAuth: true,
  });

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
    transformers: [
      new ModelTransformer(),
      new IndexTransformer(),
      new PrimaryKeyTransformer(),
      new HasOneTransformer(),
      new HasManyTransformer(),
      new AuthTransformer({ identityPoolId: IDENTITY_POOL_ID }),
    ],
    featureFlags: {
      getBoolean(value: string) {
        if (value === 'useSubUsernameForDefaultIdentityClaim') {
          return true;
        }
        return false;
      },
      getString: jest.fn(),
      getNumber: jest.fn(),
      getObject: jest.fn(),
    }
  });
  const out = transformer.transform(validSchema);
  const finishedStack = await deploy(
    customS3Client,
    cf,
    STACK_NAME,
    out,
    { AuthCognitoUserPoolId: USER_POOL_ID, authRoleName: roles.authRole.RoleName, unauthRoleName: roles.unauthRole.RoleName },
    LOCAL_FS_BUILD_DIR,
    BUCKET_NAME,
    S3_ROOT_DIR_KEY,
    BUILD_TIMESTAMP,
  );
  // Wait for any propagation to avoid random
  // "The security token included in the request is invalid" errors
  await new Promise<void>(res => setTimeout(() => res(), 5000));

  expect(finishedStack).toBeDefined();
  const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
  const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput);
  GRAPHQL_ENDPOINT = getApiEndpoint(finishedStack.Outputs);

  const apiKey = getApiKey(finishedStack.Outputs);
  expect(apiKey).toBeTruthy();

  // Verify we have all the details
  expect(GRAPHQL_ENDPOINT).toBeTruthy();
  expect(USER_POOL_ID).toBeTruthy();
  expect(userPoolClientId).toBeTruthy();

  // Configure Amplify, create users, and sign in
  configureAmplify(USER_POOL_ID, userPoolClientId, IDENTITY_POOL_ID);

  const unauthCreds = await Auth.currentCredentials();
  IAM_UNAUTHCLIENT = new AWSAppSyncClient({
    url: GRAPHQL_ENDPOINT,
    region: AWS_REGION,
    auth: {
      type: AUTH_TYPE.AWS_IAM,
      credentials: {
        accessKeyId: unauthCreds.accessKeyId,
        secretAccessKey: unauthCreds.secretAccessKey,
        sessionToken: unauthCreds.sessionToken,
      },
    },
    disableOffline: true,
  });

  await signupUser(USER_POOL_ID, USERNAME1, TMP_PASSWORD);
  const authRes = await authenticateUser(USERNAME1, TMP_PASSWORD, REAL_PASSWORD);
  const idToken = authRes.getIdToken().getJwtToken();

  USER_POOL_AUTH_CLIENT = new AWSAppSyncClient({
    url: GRAPHQL_ENDPOINT,
    region: AWS_REGION,
    auth: {
      type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
      jwtToken: () => idToken,
    },
    disableOffline: true,
  });

  await Auth.signIn(USERNAME1, REAL_PASSWORD);
  const authCreds = await Auth.currentCredentials();
  IAM_AUTHCLIENT = new AWSAppSyncClient({
    url: GRAPHQL_ENDPOINT,
    region: AWS_REGION,
    auth: {
      type: AUTH_TYPE.AWS_IAM,
      credentials: authCreds,
    },
    disableOffline: true,
  });

  await Auth.signOut();
  await signupUser(USER_POOL_ID, USERNAME2, TMP_PASSWORD);
  await addUserToGroup(CUSTOM_GROUP_NAME, USERNAME2, USER_POOL_ID);
  await authenticateUser(USERNAME2, TMP_PASSWORD, REAL_PASSWORD);
  await Auth.signIn(USERNAME2, REAL_PASSWORD);
  const authCreds2 = await Auth.currentCredentials();
  IAM_CUSTOM_GROUP_CLIENT = new AWSAppSyncClient({
    url: GRAPHQL_ENDPOINT,
    region: AWS_REGION,
    auth: {
      type: AUTH_TYPE.AWS_IAM,
      credentials: authCreds2,
    },
    disableOffline: true,
  });

  APIKEY_GRAPHQL_CLIENT = new AWSAppSyncClient({
    url: GRAPHQL_ENDPOINT,
    region: AWS_REGION,
    auth: {
      type: AUTH_TYPE.API_KEY,
      apiKey: apiKey,
    },
    disableOffline: true,
  });
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
    await iamHelper.deleteRole(CUSTOM_GROUP_ROLE_NAME);
  } catch (e) {
    console.warn(`Error during custom group role cleanup ${e}`);
  }
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

test("test 'public' authStrategy", async () => {
  try {
    const createMutation = gql`
      mutation {
        createPostPublic(input: { title: "Hello, World!" }) {
          id
          title
        }
      }
    `;

    const getQuery = gql`
      query ($id: ID!) {
        getPostPublic(id: $id) {
          id
          title
        }
      }
    `;
    const response = await APIKEY_GRAPHQL_CLIENT.mutate<any>({
      mutation: createMutation,
      fetchPolicy: 'no-cache',
    });
    expect(response.data.createPostPublic.id).toBeDefined();
    expect(response.data.createPostPublic.title).toEqual('Hello, World!');
    const postId = response.data.createPostPublic.id;

    // user authenticated with user pools should fail
    await expect(
      USER_POOL_AUTH_CLIENT.query<any>({
        query: getQuery,
        variables: { id: postId },
        fetchPolicy: 'no-cache',
      }),
    ).rejects.toThrow('GraphQL error: Not Authorized to access getPostPublic on type Query');

    // user authenticated with iam should fail
    // should be a 401 error since the unauth role does not have a policy to getPostPublic
    await expect(
      IAM_UNAUTHCLIENT.query({
        query: getQuery,
        variables: { id: postId },
        fetchPolicy: 'no-cache',
      }),
    ).rejects.toThrow('Network error: Response not successful: Received status code 401');
  } catch (err) {
    expect(err).not.toBeDefined();
  }
});

test(`Test 'public' provider: 'iam' authStrategy`, async () => {
  try {
    const createMutation = gql`
      mutation {
        createPostPublicIAM(input: { title: "Hello, World!" }) {
          id
          title
        }
      }
    `;

    const getQuery = gql`
      query ($id: ID!) {
        getPostPublicIAM(id: $id) {
          id
          title
        }
      }
    `;

    const response = await IAM_UNAUTHCLIENT.mutate<any>({
      mutation: createMutation,
      fetchPolicy: 'no-cache',
    });
    expect(response.data.createPostPublicIAM.id).toBeDefined();
    expect(response.data.createPostPublicIAM.title).toEqual('Hello, World!');

    const postId = response.data.createPostPublicIAM.id;

    // Authenticate User Pools user must fail
    await expect(
      USER_POOL_AUTH_CLIENT.query({
        query: getQuery,
        fetchPolicy: 'no-cache',
        variables: {
          id: postId,
        },
      }),
    ).rejects.toThrow('GraphQL error: Not Authorized to access getPostPublicIAM on type Query');

    // API Key must fail
    await expect(
      APIKEY_GRAPHQL_CLIENT.query({
        query: getQuery,
        fetchPolicy: 'no-cache',
        variables: {
          id: postId,
        },
      }),
    ).rejects.toThrow('GraphQL error: Not Authorized to access getPostPublicIAM on type Query');
  } catch (e) {
    expect(e).not.toBeDefined();
  }
});

test(`Test 'private' authStrategy`, async () => {
  try {
    const createMutation = gql`
      mutation {
        createPostPrivate(input: { title: "Hello, World!" }) {
          id
          title
        }
      }
    `;

    const getQuery = gql`
      query ($id: ID!) {
        getPostPrivate(id: $id) {
          id
          title
        }
      }
    `;

    const response = await USER_POOL_AUTH_CLIENT.mutate<any>({
      mutation: createMutation,
      fetchPolicy: 'no-cache',
    });
    expect(response.data.createPostPrivate.id).toBeDefined();
    expect(response.data.createPostPrivate.title).toEqual('Hello, World!');

    const postId = response.data.createPostPrivate.id;

    // Authenticate API Key fail
    await expect(
      APIKEY_GRAPHQL_CLIENT.query({
        query: getQuery,
        fetchPolicy: 'no-cache',
        variables: {
          id: postId,
        },
      }),
    ).rejects.toThrow('GraphQL error: Not Authorized to access getPostPrivate on type Query');

    // IAM with unauth role must fail
    await expect(
      IAM_UNAUTHCLIENT.query({
        query: getQuery,
        fetchPolicy: 'no-cache',
        variables: {
          id: postId,
        },
      }),
    ).rejects.toThrowError('Network error: Response not successful: Received status code 401');
  } catch (e) {
    expect(e).not.toBeDefined();
  }
});

test(`Test only allow private iam arn`, async () => {
  try {
    const createMutation = gql`
      mutation {
        createPostPrivateIAM(input: { title: "Hello, World!" }) {
          id
          title
        }
      }
    `;

    const getQuery = gql`
      query ($id: ID!) {
        getPostPrivateIAM(id: $id) {
          id
          title
        }
      }
    `;

    const response = await IAM_AUTHCLIENT.mutate<any>({
      mutation: createMutation,
      fetchPolicy: 'no-cache',
    });
    expect(response.data.createPostPrivateIAM.id).toBeDefined();
    expect(response.data.createPostPrivateIAM.title).toEqual('Hello, World!');

    const postId = response.data.createPostPrivateIAM.id;

    // Authenticate User Pools user must fail
    await expect(
      USER_POOL_AUTH_CLIENT.query({
        query: getQuery,
        fetchPolicy: 'no-cache',
        variables: {
          id: postId,
        },
      }),
    ).rejects.toThrow('GraphQL error: Not Authorized to access getPostPrivateIAM on type Query');

    // API Key must fail
    await expect(
      APIKEY_GRAPHQL_CLIENT.query({
        query: getQuery,
        fetchPolicy: 'no-cache',
        variables: {
          id: postId,
        },
      }),
    ).rejects.toThrow('GraphQL error: Not Authorized to access getPostPrivateIAM on type Query');

    // public iam user must fail
    await expect(
      IAM_UNAUTHCLIENT.query({
        query: getQuery,
        fetchPolicy: 'no-cache',
        variables: {
          id: postId,
        },
      }),
    ).rejects.toThrow('Network error: Response not successful: Received status code 401');

    // we expect the custom group client to fail even if their signed in they'll still recieve a 401
    // because the attached role does not have a policy to access the api
    await expect(
      IAM_CUSTOM_GROUP_CLIENT.query({
        query: getQuery,
        fetchPolicy: 'no-cache',
        variables: {
          id: postId,
        },
      }),
    ).rejects.toThrow('Network error: Response not successful: Received status code 401');
  } catch (e) {
    console.error(e);
    expect(e).not.toBeDefined();
  }
});

test(`Test 'private' provider: 'iam' authStrategy`, async () => {
  // This test reuses the unauth role, but any IAM credentials would work
  // in real world scenarios, we've to see if provider override works.

  // - Create UserPool - Verify owner
  // - Create IAM - Verify owner (blank)
  // - Get UserPool owner - Verify success
  // - Get UserPool non-owner - Verify deny
  // - Get IAM - Verify deny
  // - Get API Key - Verify deny

  try {
    const createMutation = gql`
      mutation {
        createPostOwnerIAM(input: { title: "Hello, World!" }) {
          id
          title
          owner
        }
      }
    `;

    const getQuery = gql`
      query ($id: ID!) {
        getPostOwnerIAM(id: $id) {
          id
          title
          owner
        }
      }
    `;

    const response = await USER_POOL_AUTH_CLIENT.mutate<any>({
      mutation: createMutation,
      fetchPolicy: 'no-cache',
    });
    expect(response.data.createPostOwnerIAM.id).toBeDefined();
    expect(response.data.createPostOwnerIAM.title).toEqual('Hello, World!');
    expect(response.data.createPostOwnerIAM.owner).toEqual(USERNAME1);

    const postIdOwner = response.data.createPostOwnerIAM.id;

    const responseIAM = await IAM_AUTHCLIENT.mutate<any>({
      mutation: createMutation,
      fetchPolicy: 'no-cache',
    });
    expect(responseIAM.data.createPostOwnerIAM.id).toBeDefined();
    expect(responseIAM.data.createPostOwnerIAM.title).toEqual('Hello, World!');
    expect(responseIAM.data.createPostOwnerIAM.owner).toBeNull();

    const postIdIAM = responseIAM.data.createPostOwnerIAM.id;

    const responseGetUserPool = await USER_POOL_AUTH_CLIENT.query<any>({
      query: getQuery,
      fetchPolicy: 'no-cache',
      variables: {
        id: postIdOwner,
      },
    });

    expect(responseGetUserPool.data.getPostOwnerIAM.id).toBeDefined();
    expect(responseGetUserPool.data.getPostOwnerIAM.title).toEqual('Hello, World!');
    expect(responseGetUserPool.data.getPostOwnerIAM.owner).toEqual(USERNAME1);

    await expect(
      USER_POOL_AUTH_CLIENT.query({
        query: getQuery,
        fetchPolicy: 'no-cache',
        variables: { id: postIdIAM },
      }),
    ).rejects.toThrow('GraphQL error: Not Authorized to access getPostOwnerIAM on type Query');

    await expect(
      IAM_UNAUTHCLIENT.query({
        query: getQuery,
        fetchPolicy: 'no-cache',
        variables: { id: postIdOwner },
      }),
    ).rejects.toThrow('Network error: Response not successful: Received status code 401');

    await expect(
      APIKEY_GRAPHQL_CLIENT.query({
        query: getQuery,
        variables: { id: postIdOwner },
      }),
    ).rejects.toThrow('GraphQL error: Not Authorized to access getPostOwnerIAM on type Query');
  } catch (e) {
    console.error(e);
    expect(e).not.toBeDefined();
  }
});

describe(`Test IAM protected field operations`, () => {
  // This test reuses the unauth role, but any IAM credentials would work
  // in real world scenarios, we've to see if provider override works.

  const createMutation = gql`
    mutation {
      createPostSecretFieldIAM(input: { title: "Hello, World!" }) {
        id
        title
      }
    }
  `;

  const createMutationWithSecret = gql`
    mutation {
      createPostSecretFieldIAM(input: { title: "Hello, World!", secret: "42" }) {
        id
        title
        secret
      }
    }
  `;

  const getQuery = gql`
    query ($id: ID!) {
      getPostSecretFieldIAM(id: $id) {
        id
        title
      }
    }
  `;

  const getQueryWithSecret = gql`
    query ($id: ID!) {
      getPostSecretFieldIAM(id: $id) {
        id
        title
        secret
      }
    }
  `;

  let postIdNoSecret = '';
  let postIdSecret = '';

  beforeAll(async () => {
    try {
      // - Create UserPool - no secret - Success
      const response = await USER_POOL_AUTH_CLIENT.mutate<any>({
        mutation: createMutation,
        fetchPolicy: 'no-cache',
      });

      postIdNoSecret = response.data.createPostSecretFieldIAM.id;

      // - Create IAM - with secret - Success
      const responseIAMSecret = await IAM_AUTHCLIENT.mutate<any>({
        mutation: createMutationWithSecret,
        fetchPolicy: 'no-cache',
      });

      postIdSecret = responseIAMSecret.data.createPostSecretFieldIAM.id;
    } catch (e) {
      expect(e).not.toBeDefined();
    }
  });

  it('Get UserPool - Succeed', async () => {
    const responseGetUserPool = await USER_POOL_AUTH_CLIENT.query<any>({
      query: getQuery,
      fetchPolicy: 'no-cache',
      variables: {
        id: postIdNoSecret,
      },
    });
    expect(responseGetUserPool.data.getPostSecretFieldIAM.id).toBeDefined();
    expect(responseGetUserPool.data.getPostSecretFieldIAM.title).toEqual('Hello, World!');
  });

  it('Get UserPool with secret - Fail', async () => {
    expect.assertions(1);
    await expect(
      USER_POOL_AUTH_CLIENT.query({
        query: getQueryWithSecret,
        fetchPolicy: 'no-cache',
        variables: { id: postIdSecret },
      }),
    ).rejects.toThrow('GraphQL error: Not Authorized to access secret on type String');
  });
});

describe(`IAM Tests`, () => {
  const createMutation = gql`
    mutation {
      createPostIAMWithKeys(input: { title: "Hello, World!", type: "Post", date: "2019-01-01T00:00:00Z" }) {
        id
        title
        type
        date
      }
    }
  `;

  const getPostIAMWithKeysByDate = gql`
    query {
      getPostIAMWithKeysByDate(type: "Post") {
        items {
          id
          title
          type
          date
        }
      }
    }
  `;

  let postId = '';

  beforeAll(async () => {
    try {
      // - Create API Key - Success
      const response = await APIKEY_GRAPHQL_CLIENT.mutate<any>({
        mutation: createMutation,
        fetchPolicy: 'no-cache',
      });
      postId = response.data.createPostIAMWithKeys.id;
    } catch (e) {
      expect(e).not.toBeDefined();
    }
  });

  it('Execute @key query - Succeed', async () => {
    const response = await IAM_UNAUTHCLIENT.query<any>({
      query: getPostIAMWithKeysByDate,
      fetchPolicy: 'no-cache',
    });
    expect(response.data.getPostIAMWithKeysByDate.items).toBeDefined();
    expect(response.data.getPostIAMWithKeysByDate.items.length).toEqual(1);
    const post = response.data.getPostIAMWithKeysByDate.items[0];
    expect(post.id).toEqual(postId);
    expect(post.title).toEqual('Hello, World!');
    expect(post.type).toEqual('Post');
    expect(post.date).toEqual('2019-01-01T00:00:00Z');
  });
});

describe(`relational tests with @auth on type`, () => {
  const createPostMutation = gql`
    mutation {
      createPostConnection(input: { title: "Hello, World!" }) {
        id
        title
      }
    }
  `;

  const createCommentMutation = gql`
    mutation ($postId: ID!) {
      createCommentConnection(input: { content: "Comment", commentConnectionPostId: $postId }) {
        id
        content
      }
    }
  `;

  const getPostQuery = gql`
    query ($postId: ID!) {
      getPostConnection(id: $postId) {
        id
        title
      }
    }
  `;

  const getPostQueryWithComments = gql`
    query ($postId: ID!) {
      getPostConnection(id: $postId) {
        id
        title
        comments {
          items {
            id
            content
          }
        }
      }
    }
  `;

  const getCommentQuery = gql`
    query ($commentId: ID!) {
      getCommentConnection(id: $commentId) {
        id
        content
      }
    }
  `;

  const getCommentWithPostQuery = gql`
    query ($commentId: ID!) {
      getCommentConnection(id: $commentId) {
        id
        content
        post {
          id
          title
        }
      }
    }
  `;

  let postId = '';
  let commentId = '';

  beforeAll(async () => {
    try {
      // Add a comment with ApiKey - Succeed
      const response = await APIKEY_GRAPHQL_CLIENT.mutate<any>({
        mutation: createPostMutation,
        fetchPolicy: 'no-cache',
      });

      postId = response.data.createPostConnection.id;

      // Add a comment with UserPool - Succeed
      const commentResponse = await USER_POOL_AUTH_CLIENT.mutate<any>({
        mutation: createCommentMutation,
        fetchPolicy: 'no-cache',
        variables: {
          postId,
        },
      });

      commentId = commentResponse.data.createCommentConnection.id;
    } catch (e) {
      expect(e).not.toBeDefined();
    }
  });

  it('Create a Post with UserPool - Fail', async () => {
    expect.assertions(1);
    await expect(
      USER_POOL_AUTH_CLIENT.mutate<any>({
        mutation: createPostMutation,
        fetchPolicy: 'no-cache',
      }),
    ).rejects.toThrow('GraphQL error: Not Authorized to access createPostConnection on type Mutation');
  });

  it('Add a comment with ApiKey - Fail', async () => {
    expect.assertions(1);
    await expect(
      APIKEY_GRAPHQL_CLIENT.mutate<any>({
        mutation: createCommentMutation,
        fetchPolicy: 'no-cache',
        variables: {
          postId,
        },
      }),
    ).rejects.toThrow('Not Authorized to access createCommentConnection on type Mutation');
  });

  it('Get Post with ApiKey - Succeed', async () => {
    const responseGetPost = await APIKEY_GRAPHQL_CLIENT.query<any>({
      query: getPostQuery,
      fetchPolicy: 'no-cache',
      variables: {
        postId,
      },
    });
    expect(responseGetPost.data.getPostConnection.id).toEqual(postId);
    expect(responseGetPost.data.getPostConnection.title).toEqual('Hello, World!');
  });

  it('Get Post with UserPool - Fail', async () => {
    expect.assertions(1);
    await expect(
      USER_POOL_AUTH_CLIENT.query<any>({
        query: getPostQuery,
        fetchPolicy: 'no-cache',
        variables: {
          postId,
        },
      }),
    ).rejects.toThrow('Not Authorized to access getPostConnection on type Query');
  });

  it('Get Comment with UserPool - Succeed', async () => {
    const responseGetComment = await USER_POOL_AUTH_CLIENT.query<any>({
      query: getCommentQuery,
      fetchPolicy: 'no-cache',
      variables: {
        commentId,
      },
    });
    expect(responseGetComment.data.getCommentConnection.id).toEqual(commentId);
    expect(responseGetComment.data.getCommentConnection.content).toEqual('Comment');
  });

  it('Get Comment with ApiKey - Fail', async () => {
    expect.assertions(1);
    await expect(
      APIKEY_GRAPHQL_CLIENT.query<any>({
        query: getCommentQuery,
        fetchPolicy: 'no-cache',
        variables: {
          commentId,
        },
      }),
    ).rejects.toThrow('Not Authorized to access getCommentConnection on type Query');
  });
});
