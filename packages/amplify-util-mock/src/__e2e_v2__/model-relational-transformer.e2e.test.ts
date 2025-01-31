import { deploy, launchDDBLocal, terminateDDB, logDebug, GraphQLClient } from '../__e2e__/utils';
import { AmplifyAppSyncSimulator } from '@aws-amplify/amplify-appsync-simulator';
import { transformAndSynth, defaultTransformParams } from './test-synthesizer';

let GRAPHQL_CLIENT: GraphQLClient;
let GRAPHQL_ENDPOINT: string;
let ddbEmulator = null;
let dbPath = null;
let server: AmplifyAppSyncSimulator;

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
      const out = transformAndSynth({
        ...defaultTransformParams,
        schema: validSchema,
        transformParameters: {
          ...defaultTransformParams.transformParameters,
          respectPrimaryKeyAttributesOnConnectionField: false,
        },
      });

      let ddbClient;
      ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await launchDDBLocal());
      const result = await deploy(out, ddbClient);
      server = result.simulator;

      GRAPHQL_ENDPOINT = server.url + '/graphql';
      logDebug(`Using graphql url: ${GRAPHQL_ENDPOINT}`);

      const apiKey = result.config.appSync.apiKey;
      logDebug(apiKey);
      GRAPHQL_CLIENT = new GraphQLClient(GRAPHQL_ENDPOINT, {
        'x-api-key': apiKey,
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  afterAll(async () => {
    try {
      if (server) {
        await server.stop();
      }
      await terminateDDB(ddbEmulator, dbPath);
    } catch (e) {
      logDebug(e);
      throw e;
    }
  });

  /**
   * Test queries below
   */

  test('queryPost query', async () => {
    const createResponse = await GRAPHQL_CLIENT.query(
      `mutation {
          createPost(input: { title: "Test Query" }) {
              id
              title
          }
      }`,
      {},
    );
    expect(createResponse.data.createPost.id).toBeDefined();
    expect(createResponse.data.createPost.title).toEqual('Test Query');
    const createCommentResponse = await GRAPHQL_CLIENT.query(
      `mutation {
          createComment(input: { content: "A comment!", postId: "${createResponse.data.createPost.id}" }) {
              id
              content
              post {
                  id
                  title
              }
          }
      }`,
      {},
    );
    expect(createCommentResponse.data.createComment.id).toBeDefined();
    expect(createCommentResponse.data.createComment.content).toEqual('A comment!');
    expect(createCommentResponse.data.createComment.post.id).toEqual(createResponse.data.createPost.id);
    expect(createCommentResponse.data.createComment.post.title).toEqual(createResponse.data.createPost.title);
    const queryResponse = await GRAPHQL_CLIENT.query(
      `query {
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
      }`,
      {},
    );
    expect(queryResponse.data.getPost).toBeDefined();
    const items = queryResponse.data.getPost.comments.items;
    expect(items.length).toEqual(1);
    expect(items[0].id).toEqual(createCommentResponse.data.createComment.id);
  });

  test('create comment without a post and then querying the comment.', async () => {
    const comment1 = 'a comment and a date! - 1';

    const createCommentResponse1 = await GRAPHQL_CLIENT.query(
      `mutation {
            createComment(input: { content: "${comment1}" }) {
              id
              content
              post {
                id
                title
              }
            }
          }`,
      {},
    );
    expect(createCommentResponse1.data.createComment.id).toBeDefined();
    expect(createCommentResponse1.data.createComment.post).toBeNull();

    expect(createCommentResponse1.data.createComment.content).toEqual(comment1);
    const queryResponseDesc = await GRAPHQL_CLIENT.query(
      `query {
              getComment(id: "${createCommentResponse1.data.createComment.id}") {
                  id
                  content
                  post {
                      id
                  }
              }
          }`,
      {},
    );
    expect(queryResponseDesc.data.getComment).toBeDefined();
    expect(queryResponseDesc.data.getComment.post).toBeNull();
  });

  test('default limit is 50', async () => {
    const postID = 'e2eConnectionPost';
    const postTitle = 'samplePost';
    const createPost = await GRAPHQL_CLIENT.query(
      `mutation CreatePost {
        createPost(input: {title: "${postTitle}", id: "${postID}"}) {
          id
          title
        }
      }
      `,
      {},
    );
    expect(createPost.data.createPost).toBeDefined();
    expect(createPost.data.createPost.id).toEqual(postID);
    expect(createPost.data.createPost.title).toEqual(postTitle);

    for (let i = 0; i < 51; i++) {
      await GRAPHQL_CLIENT.query(
        `
          mutation CreateComment {
            createComment(input: {postId: "${postID}", content: "content_${i}"}) {
              content
              id
              post {
                title
              }
            }
          }
        `,
        {},
      );
    }

    const getPost = await GRAPHQL_CLIENT.query(
      `
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
        }`,
      { id: postID },
    );

    expect(getPost.data.getPost.comments.items.length).toEqual(50);
  });
});
