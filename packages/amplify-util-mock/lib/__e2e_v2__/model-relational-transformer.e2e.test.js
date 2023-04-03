"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_index_transformer_1 = require("@aws-amplify/graphql-index-transformer");
const graphql_relational_transformer_1 = require("@aws-amplify/graphql-relational-transformer");
const graphql_model_transformer_1 = require("@aws-amplify/graphql-model-transformer");
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const utils_1 = require("../__e2e__/utils");
const graphql_auth_transformer_1 = require("@aws-amplify/graphql-auth-transformer");
let GRAPHQL_CLIENT;
let GRAPHQL_ENDPOINT;
let ddbEmulator = null;
let dbPath = null;
let server;
jest.setTimeout(20000);
describe('@model with relational transformer', () => {
    beforeAll(async () => {
        const validSchema = `
    type Post @model @auth(rules: [{ allow: public }]) {
      id: ID!
      title: String!
      createdAt: String
      updatedAt: String
      comments: [Comment] @hasMany(indexName: "byPost", fields: ["id"], limit: 50)
      sortedComments: [SortedComment] @hasMany(indexName: "SortedPostComments")
    }

    type Comment @model @auth(rules: [{ allow: public }]) {
      id: ID!
      content: String!
      postId: ID @index(name: "byPost")
      post: Post @belongsTo(fields: ["postId"])
    }

    type SortedComment @model @auth(rules: [{ allow: public }]) {
      id: ID!
      content: String!
      when: String!
      postId: ID @index(name: "SortedPostComments", sortKeyFields: ["when"])
      post: Post @hasOne
    }`;
        try {
            const transformer = new graphql_transformer_core_1.GraphQLTransform({
                transformers: [
                    new graphql_model_transformer_1.ModelTransformer(),
                    new graphql_index_transformer_1.IndexTransformer(),
                    new graphql_index_transformer_1.PrimaryKeyTransformer(),
                    new graphql_relational_transformer_1.HasOneTransformer(),
                    new graphql_relational_transformer_1.HasManyTransformer(),
                    new graphql_relational_transformer_1.BelongsToTransformer(),
                    new graphql_auth_transformer_1.AuthTransformer(),
                ],
                featureFlags: {
                    getBoolean: (name) => (name === 'improvePluralization' ? true : false),
                },
            });
            const out = transformer.transform(validSchema);
            let ddbClient;
            ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await (0, utils_1.launchDDBLocal)());
            const result = await (0, utils_1.deploy)(out, ddbClient);
            server = result.simulator;
            GRAPHQL_ENDPOINT = server.url + '/graphql';
            (0, utils_1.logDebug)(`Using graphql url: ${GRAPHQL_ENDPOINT}`);
            const apiKey = result.config.appSync.apiKey;
            (0, utils_1.logDebug)(apiKey);
            GRAPHQL_CLIENT = new utils_1.GraphQLClient(GRAPHQL_ENDPOINT, {
                'x-api-key': apiKey,
            });
        }
        catch (e) {
            console.error(e);
            throw e;
        }
    });
    afterAll(async () => {
        try {
            if (server) {
                await server.stop();
            }
            await (0, utils_1.terminateDDB)(ddbEmulator, dbPath);
        }
        catch (e) {
            (0, utils_1.logDebug)(e);
            throw e;
        }
    });
    test('queryPost query', async () => {
        const createResponse = await GRAPHQL_CLIENT.query(`mutation {
          createPost(input: { title: "Test Query" }) {
              id
              title
          }
      }`, {});
        expect(createResponse.data.createPost.id).toBeDefined();
        expect(createResponse.data.createPost.title).toEqual('Test Query');
        const createCommentResponse = await GRAPHQL_CLIENT.query(`mutation {
          createComment(input: { content: "A comment!", postId: "${createResponse.data.createPost.id}" }) {
              id
              content
              post {
                  id
                  title
              }
          }
      }`, {});
        expect(createCommentResponse.data.createComment.id).toBeDefined();
        expect(createCommentResponse.data.createComment.content).toEqual('A comment!');
        expect(createCommentResponse.data.createComment.post.id).toEqual(createResponse.data.createPost.id);
        expect(createCommentResponse.data.createComment.post.title).toEqual(createResponse.data.createPost.title);
        const queryResponse = await GRAPHQL_CLIENT.query(`query {
          getPost(id: "${createResponse.data.createPost.id}") {
              id
              title
              comments {
                  items {
                      id
                      content
                  }
              }
          }
      }`, {});
        expect(queryResponse.data.getPost).toBeDefined();
        const items = queryResponse.data.getPost.comments.items;
        expect(items.length).toEqual(1);
        expect(items[0].id).toEqual(createCommentResponse.data.createComment.id);
    });
    test('create comment without a post and then querying the comment.', async () => {
        const comment1 = 'a comment and a date! - 1';
        const createCommentResponse1 = await GRAPHQL_CLIENT.query(`mutation {
            createComment(input: { content: "${comment1}" }) {
              id
              content
              post {
                id
                title
              }
            }
          }`, {});
        expect(createCommentResponse1.data.createComment.id).toBeDefined();
        expect(createCommentResponse1.data.createComment.post).toBeNull();
        expect(createCommentResponse1.data.createComment.content).toEqual(comment1);
        const queryResponseDesc = await GRAPHQL_CLIENT.query(`query {
              getComment(id: "${createCommentResponse1.data.createComment.id}") {
                  id
                  content
                  post {
                      id
                  }
              }
          }`, {});
        expect(queryResponseDesc.data.getComment).toBeDefined();
        expect(queryResponseDesc.data.getComment.post).toBeNull();
    });
    test('default limit is 50', async () => {
        const postID = 'e2eConnectionPost';
        const postTitle = 'samplePost';
        const createPost = await GRAPHQL_CLIENT.query(`mutation CreatePost {
        createPost(input: {title: "${postTitle}", id: "${postID}"}) {
          id
          title
        }
      }
      `, {});
        expect(createPost.data.createPost).toBeDefined();
        expect(createPost.data.createPost.id).toEqual(postID);
        expect(createPost.data.createPost.title).toEqual(postTitle);
        for (let i = 0; i < 51; i++) {
            await GRAPHQL_CLIENT.query(`
          mutation CreateComment {
            createComment(input: {postId: "${postID}", content: "content_${i}"}) {
              content
              id
              post {
                title
              }
            }
          }
        `, {});
        }
        const getPost = await GRAPHQL_CLIENT.query(`
        query GetPost($id: ID!) {
          getPost(id: $id) {
            id
            title
            createdAt
            updatedAt
            comments {
              items {
                id
                content
              }
              nextToken
            }
          }
        }`, { id: postID });
        expect(getPost.data.getPost.comments.items.length).toEqual(50);
    });
});
//# sourceMappingURL=model-relational-transformer.e2e.test.js.map