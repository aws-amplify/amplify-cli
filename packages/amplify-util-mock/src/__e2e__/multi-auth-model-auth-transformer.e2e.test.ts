import { ModelAuthTransformer } from 'graphql-auth-transformer';
import { ModelConnectionTransformer } from 'graphql-connection-transformer';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { FeatureFlagProvider, GraphQLTransform } from 'graphql-transformer-core';
import { signUpAddToGroupAndGetJwtToken } from './utils/cognito-utils';
import { GraphQLClient } from './utils/graphql-client';
import { deploy, launchDDBLocal, logDebug, terminateDDB } from './utils/index';
import 'isomorphic-fetch';
import { $TSAny } from '@aws-amplify/amplify-cli-core';

jest.setTimeout(2000000);

let ddbEmulator = null;
let dbPath = null;
let server;

let GRAPHQL_ENDPOINT = undefined;

let APIKEY_GRAPHQL_CLIENT = undefined;
let USER_POOL_AUTH_CLIENT = undefined;

const USER_POOL_ID = 'fake_user_pool';

const USERNAME1 = 'user1@test.com';

beforeAll(async () => {
  // Create a stack for the post model with auth enabled.
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
    type PostOwnerIAM @model
    @auth (
        rules: [
            # The cognito user pool owner can CRUD.
            { allow: owner },
            # A lambda function using IAM can call Mutation.createPost.
            { allow: private, provider: iam, operations: [create] }
        ]
    )
    {
        id: ID!
        title: String
        owner: String
    }

    type PostSecretFieldIAM @model
    @auth (
        rules: [
            # The cognito user pool and can CRUD.
            { allow: private }
        ]
    )
    {
        id: ID!
        title: String
        owner: String
        secret: String
            @auth (
                rules: [
                    # Only a lambda function using IAM can create/update this field
                    { allow: private, provider: iam, operations: [create, update] }
                ]
            )
    }

    type PostConnection @model @auth(rules:[{allow: public}]){
        id: ID!
        title: String!
        comments: [CommentConnection] @connection(name: "PostComments")
    }

    type CommentConnection @model {
        id: ID!
        content: String!
        post: PostConnection @connection(name: "PostComments")
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new ModelConnectionTransformer(),
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
    featureFlags: {
      getBoolean: (name) => (name === 'improvePluralization' ? true : false),
    } as FeatureFlagProvider,
  });

  try {
    const out = transformer.transform(validSchema);

    let ddbClient;
    ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await launchDDBLocal());

    const result = await deploy(out, ddbClient);
    server = result.simulator;

    GRAPHQL_ENDPOINT = server.url + '/graphql';
    logDebug(`Using graphql url: ${GRAPHQL_ENDPOINT}`);

    const apiKey = result.config.appSync.apiKey;
    logDebug(`API KEY: ${apiKey}`);
    expect(apiKey).toBeTruthy();

    // Verify we have all the details
    expect(GRAPHQL_ENDPOINT).toBeTruthy();
    expect(USER_POOL_ID).toBeTruthy();

    const idToken = await signUpAddToGroupAndGetJwtToken(USER_POOL_ID, USERNAME1, USERNAME1, []);

    USER_POOL_AUTH_CLIENT = new GraphQLClient(GRAPHQL_ENDPOINT, {
      Authorization: idToken,
    });

    APIKEY_GRAPHQL_CLIENT = new GraphQLClient(GRAPHQL_ENDPOINT, {
      'x-api-key': apiKey,
    });

    // Wait for any propagation to avoid random
    // "The security token included in the request is invalid" errors
    await new Promise<void>((res) => setTimeout(() => res(), 5000));
  } catch (e) {
    console.error(e);
    expect(true).toEqual(false);
  }
});

afterAll(async () => {
  try {
    if (server) {
      await server.stop();
    }
    await terminateDDB(ddbEmulator, dbPath);
  } catch (e) {
    console.error(e);
    expect(true).toEqual(false);
  }
});

/**
 * Test queries below
 */
test(`Test 'public' authStrategy`, async () => {
  try {
    const createMutation = `
      mutation {
        createPostPublic(input: { title: "Hello, World!" }) {
          id
          title
        }
      }
    `;

    const getQuery = `
      query ($id: ID!) {
        getPostPublic(id: $id) {
          id
          title
        }
      }
    `;

    const response = await APIKEY_GRAPHQL_CLIENT.query(createMutation, {});

    const responseData = response.data as $TSAny;
    expect(responseData?.createPostPublic?.id).toBeDefined();
    expect(responseData?.createPostPublic?.title).toEqual('Hello, World!');

    const postId = responseData?.createPostPublic?.id;

    // Authenticate User Pools user must fail
    try {
      const queryResult = await USER_POOL_AUTH_CLIENT.query(getQuery, {
        id: postId,
      });
      expect(queryResult.errors[0].message).toEqual('Not Authorized to access getPostPublic on type Query');
    } catch (e) {
      expect(true).toBe(false);
    }
  } catch (e) {
    expect(true).toBe(false);
  }
});

test(`Test 'private' authStrategy`, async () => {
  try {
    const createMutation = `
      mutation {
        createPostPrivate(input: { title: "Hello, World!" }) {
          id
          title
        }
      }
    `;

    const getQuery = `
      query ($id: ID!) {
        getPostPrivate(id: $id) {
          id
          title
        }
      }
    `;

    const response = await USER_POOL_AUTH_CLIENT.query(createMutation, {});

    const responseData = response.data as $TSAny;
    expect(responseData?.createPostPrivate?.id).toBeDefined();
    expect(responseData?.createPostPrivate?.title).toEqual('Hello, World!');

    const postId = responseData?.createPostPrivate.id;

    // Authenticate API Key fail
    try {
      const queryResult = await APIKEY_GRAPHQL_CLIENT.query(getQuery, {
        id: postId,
      });
      expect(queryResult.errors[0].message).toEqual('Not Authorized to access getPostPrivate on type Query');
    } catch (e) {
      expect(true).toEqual(false);
    }
  } catch (e) {
    console.error(e);
    expect(true).toEqual(false);
  }
});

describe(`Connection tests with @auth on type`, () => {
  const createPostMutation = `
    mutation {
      createPostConnection(input: { title: "Hello, World!" }) {
        id
        title
      }
    }
  `;

  const createCommentMutation = `
    mutation ($postId: ID!) {
      createCommentConnection(input: { content: "Comment", commentConnectionPostId: $postId }) {
        id
        content
      }
    }
  `;

  const getPostQuery = `
    query ($postId: ID!) {
      getPostConnection(id: $postId) {
        id
        title
      }
    }
  `;

  const getPostQueryWithComments = `
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

  const getCommentQuery = `
    query ($commentId: ID!) {
      getCommentConnection(id: $commentId) {
        id
        content
      }
    }
  `;

  const getCommentWithPostQuery = `
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
      const response = await APIKEY_GRAPHQL_CLIENT.query(createPostMutation, {});

      const responseData = response.data as $TSAny;
      postId = responseData?.createPostConnection?.id;

      // Add a comment with UserPool - Succeed
      const commentResponse = await USER_POOL_AUTH_CLIENT.query(createCommentMutation, {
        postId: postId,
      });

      const commentResponseData = commentResponse.data as $TSAny;
      commentId = commentResponseData?.createCommentConnection?.id;
    } catch (e) {
      console.error(e);
      expect(true).toEqual(false);
    }
  });

  it('Create a Post with UserPool - Fail', async () => {
    expect.assertions(1);
    const result = await USER_POOL_AUTH_CLIENT.query(createPostMutation, {});
    expect(result.errors[0].message).toEqual('Not Authorized to access createPostConnection on type Mutation');
  });

  it('Add a comment with ApiKey - Fail', async () => {
    expect.assertions(1);
    const result = await APIKEY_GRAPHQL_CLIENT.query(createCommentMutation, {
      postId: postId,
    });
    expect(result.errors[0].message).toEqual('Not Authorized to access createCommentConnection on type Mutation');
  });

  it('Get Post with ApiKey - Succeed', async () => {
    const responseGetPost = await APIKEY_GRAPHQL_CLIENT.query(getPostQuery, {
      postId: postId,
    });
    expect(responseGetPost.data.getPostConnection.id).toEqual(postId);
    expect(responseGetPost.data.getPostConnection.title).toEqual('Hello, World!');
  });

  it('Get Post+Comments with ApiKey - Fail', async () => {
    expect.assertions(1);
    const result = await APIKEY_GRAPHQL_CLIENT.query(getPostQueryWithComments, {
      postId: postId,
    });
    expect(result.errors[0].message).toEqual('Not Authorized to access items on type ModelCommentConnectionConnection');
  });

  it('Get Post with UserPool - Fail', async () => {
    expect.assertions(1);
    const result = await USER_POOL_AUTH_CLIENT.query(getPostQuery, {
      postId: postId,
    });
    expect(result.errors[0].message).toEqual('Not Authorized to access getPostConnection on type Query');
  });

  it('Get Comment with UserPool - Succeed', async () => {
    const responseGetComment = await USER_POOL_AUTH_CLIENT.query(getCommentQuery, {
      commentId: commentId,
    });
    expect(responseGetComment.data.getCommentConnection.id).toEqual(commentId);
    expect(responseGetComment.data.getCommentConnection.content).toEqual('Comment');
  });

  it('Get Comment with ApiKey - Fail', async () => {
    expect.assertions(1);
    const result = await APIKEY_GRAPHQL_CLIENT.query(getCommentQuery, {
      commentId: commentId,
    });
    expect(result.errors[0].message).toEqual('Not Authorized to access getCommentConnection on type Query');
  });

  it('Get Comment with Post with UserPool - Succeed, but null for Post field', async () => {
    const responseGetComment = await USER_POOL_AUTH_CLIENT.query(getCommentWithPostQuery, {
      commentId: commentId,
    });
    expect(responseGetComment.data.getCommentConnection.id).toEqual(commentId);
    expect(responseGetComment.data.getCommentConnection.content).toEqual('Comment');
    expect(responseGetComment.data.getCommentConnection.post).toBeNull();
  });
});
