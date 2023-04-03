"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_auth_transformer_1 = require("graphql-auth-transformer");
const graphql_connection_transformer_1 = require("graphql-connection-transformer");
const graphql_dynamodb_transformer_1 = require("graphql-dynamodb-transformer");
const graphql_transformer_core_1 = require("graphql-transformer-core");
const cognito_utils_1 = require("./utils/cognito-utils");
const graphql_client_1 = require("./utils/graphql-client");
const index_1 = require("./utils/index");
require("isomorphic-fetch");
jest.setTimeout(2000000);
let ddbEmulator = null;
let dbPath = null;
let server;
let GRAPHQL_ENDPOINT = undefined;
let APIKEY_GRAPHQL_CLIENT = undefined;
let USER_POOL_AUTH_CLIENT = undefined;
let USER_POOL_ID = 'fake_user_pool';
const USERNAME1 = 'user1@test.com';
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
    const transformer = new graphql_transformer_core_1.GraphQLTransform({
        transformers: [
            new graphql_dynamodb_transformer_1.DynamoDBModelTransformer(),
            new graphql_connection_transformer_1.ModelConnectionTransformer(),
            new graphql_auth_transformer_1.ModelAuthTransformer({
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
        },
    });
    try {
        const out = transformer.transform(validSchema);
        let ddbClient;
        ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await (0, index_1.launchDDBLocal)());
        const result = await (0, index_1.deploy)(out, ddbClient);
        server = result.simulator;
        GRAPHQL_ENDPOINT = server.url + '/graphql';
        (0, index_1.logDebug)(`Using graphql url: ${GRAPHQL_ENDPOINT}`);
        const apiKey = result.config.appSync.apiKey;
        (0, index_1.logDebug)(`API KEY: ${apiKey}`);
        expect(apiKey).toBeTruthy();
        expect(GRAPHQL_ENDPOINT).toBeTruthy();
        expect(USER_POOL_ID).toBeTruthy();
        const idToken = (0, cognito_utils_1.signUpAddToGroupAndGetJwtToken)(USER_POOL_ID, USERNAME1, USERNAME1, []);
        USER_POOL_AUTH_CLIENT = new graphql_client_1.GraphQLClient(GRAPHQL_ENDPOINT, {
            Authorization: idToken,
        });
        APIKEY_GRAPHQL_CLIENT = new graphql_client_1.GraphQLClient(GRAPHQL_ENDPOINT, {
            'x-api-key': apiKey,
        });
        await new Promise((res) => setTimeout(() => res(), 5000));
    }
    catch (e) {
        console.error(e);
        expect(true).toEqual(false);
    }
});
afterAll(async () => {
    try {
        if (server) {
            await server.stop();
        }
        await (0, index_1.terminateDDB)(ddbEmulator, dbPath);
    }
    catch (e) {
        console.error(e);
        expect(true).toEqual(false);
    }
});
test(`Test 'public' authStrategy`, async () => {
    var _a, _b, _c;
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
        const responseData = response.data;
        expect((_a = responseData === null || responseData === void 0 ? void 0 : responseData.createPostPublic) === null || _a === void 0 ? void 0 : _a.id).toBeDefined();
        expect((_b = responseData === null || responseData === void 0 ? void 0 : responseData.createPostPublic) === null || _b === void 0 ? void 0 : _b.title).toEqual('Hello, World!');
        const postId = (_c = responseData === null || responseData === void 0 ? void 0 : responseData.createPostPublic) === null || _c === void 0 ? void 0 : _c.id;
        try {
            const queryResult = await USER_POOL_AUTH_CLIENT.query(getQuery, {
                id: postId,
            });
            expect(queryResult.errors[0].message).toEqual('Not Authorized to access getPostPublic on type Query');
        }
        catch (e) {
            expect(true).toBe(false);
        }
    }
    catch (e) {
        expect(true).toBe(false);
    }
});
test(`Test 'private' authStrategy`, async () => {
    var _a, _b;
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
        const responseData = response.data;
        expect((_a = responseData === null || responseData === void 0 ? void 0 : responseData.createPostPrivate) === null || _a === void 0 ? void 0 : _a.id).toBeDefined();
        expect((_b = responseData === null || responseData === void 0 ? void 0 : responseData.createPostPrivate) === null || _b === void 0 ? void 0 : _b.title).toEqual('Hello, World!');
        const postId = responseData === null || responseData === void 0 ? void 0 : responseData.createPostPrivate.id;
        try {
            const queryResult = await APIKEY_GRAPHQL_CLIENT.query(getQuery, {
                id: postId,
            });
            expect(queryResult.errors[0].message).toEqual('Not Authorized to access getPostPrivate on type Query');
        }
        catch (e) {
            expect(true).toEqual(false);
        }
    }
    catch (e) {
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
        var _a, _b;
        try {
            const response = await APIKEY_GRAPHQL_CLIENT.query(createPostMutation, {});
            const responseData = response.data;
            postId = (_a = responseData === null || responseData === void 0 ? void 0 : responseData.createPostConnection) === null || _a === void 0 ? void 0 : _a.id;
            const commentResponse = await USER_POOL_AUTH_CLIENT.query(createCommentMutation, {
                postId: postId,
            });
            const commentResponseData = commentResponse.data;
            commentId = (_b = commentResponseData === null || commentResponseData === void 0 ? void 0 : commentResponseData.createCommentConnection) === null || _b === void 0 ? void 0 : _b.id;
        }
        catch (e) {
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
//# sourceMappingURL=multi-auth-model-auth-transformer.e2e.test.js.map