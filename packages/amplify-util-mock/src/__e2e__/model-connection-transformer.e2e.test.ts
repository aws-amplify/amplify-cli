import ModelAuthTransformer from 'graphql-auth-transformer';
import ModelConnectionTransformer from 'graphql-connection-transformer';
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer';
import GraphQLTransform from 'graphql-transformer-core';

import { GraphQLClient } from './utils/graphql-client';
import { deploy, launchDDBLocal, terminateDDB, logDebug } from './utils/index';

let GRAPHQL_CLIENT = undefined;
let GRAPHQL_ENDPOINT = undefined;
let ddbEmulator = null;
let dbPath = null;
let server;
jest.setTimeout(20000);
beforeAll(async () => {
  const validSchema = `
    type Post @model {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
        comments: [Comment] @connection(name: "PostComments", keyField: "postId")
        sortedComments: [SortedComment] @connection(name: "SortedPostComments", keyField: "postId", sortField: "when")
    }
    type Comment @model {
        id: ID!
        content: String!
        post: Post @connection(name: "PostComments", keyField: "postId")
    }
    type SortedComment @model{
        id: ID!
        content: String!
        when: String!
        post: Post @connection(name: "SortedPostComments", keyField: "postId", sortField: "when")
    }
    `;

  try {
    const transformer = new GraphQLTransform({
      transformers: [
        new DynamoDBModelTransformer(),
        new ModelAuthTransformer(),
        new ModelConnectionTransformer(),
      ],
    });
    const out = transformer.transform(validSchema);

    let ddbClient;
    ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await launchDDBLocal());
    const result = await deploy(out, ddbClient);
    server = result.simulator;

    GRAPHQL_ENDPOINT = server.url + '/graphql';
    console.log(`Using graphql url: ${GRAPHQL_ENDPOINT}`);

    const apiKey = result.config.appSync.apiKey;
    logDebug(apiKey);
    GRAPHQL_CLIENT = new GraphQLClient(GRAPHQL_ENDPOINT, {
      'x-api-key': apiKey,
    });
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
    console.log(e);
    expect(true).toEqual(false);
  }
});

/**
 * Test queries below
 */

test('Test queryPost query', async () => {
  const createResponse = await GRAPHQL_CLIENT.query(
    `mutation {
        createPost(input: { title: "Test Query" }) {
            id
            title
        }
    }`,
    {}
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
    {}
  );
  expect(createCommentResponse.data.createComment.id).toBeDefined();
  expect(createCommentResponse.data.createComment.content).toEqual('A comment!');
  expect(createCommentResponse.data.createComment.post.id).toEqual(
    createResponse.data.createPost.id
  );
  expect(createCommentResponse.data.createComment.post.title).toEqual(
    createResponse.data.createPost.title
  );
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
    {}
  );
  expect(queryResponse.data.getPost).toBeDefined();
  const items = queryResponse.data.getPost.comments.items;
  expect(items.length).toEqual(1);
  expect(items[0].id).toEqual(createCommentResponse.data.createComment.id);
});

const title = 'Test Query with Sort Field';
const comment1 = 'a comment and a date! - 1';
const comment2 = 'a comment and a date! - 2';
const whenpast = '2017-10-01T00:00:00.000Z';
const when1 = '2018-10-01T00:00:00.000Z';
const whenmid = '2018-12-01T00:00:00.000Z';
const when2 = '2019-10-01T00:00:01.000Z';
const whenfuture = '2020-10-01T00:00:00.000Z';

test('Test queryPost query with sortField', async () => {
  const createResponse = await GRAPHQL_CLIENT.query(
    `mutation {
        createPost(input: { title: "${title}" }) {
            id
            title
        }
    }`,
    {}
  );
  expect(createResponse.data.createPost.id).toBeDefined();
  expect(createResponse.data.createPost.title).toEqual(title);
  const createCommentResponse1 = await GRAPHQL_CLIENT.query(
    `mutation {
        createSortedComment(input:
            { content: "${comment1}",
                when: "${when1}"
                postId: "${createResponse.data.createPost.id}"
            }) {
            id
            content
            post {
                id
                title
            }
        }
    }`,
    {}
  );
  expect(createCommentResponse1.data.createSortedComment.id).toBeDefined();
  expect(createCommentResponse1.data.createSortedComment.content).toEqual(comment1);
  expect(createCommentResponse1.data.createSortedComment.post.id).toEqual(
    createResponse.data.createPost.id
  );
  expect(createCommentResponse1.data.createSortedComment.post.title).toEqual(
    createResponse.data.createPost.title
  );

  // create 2nd comment, 1 second later
  const createCommentResponse2 = await GRAPHQL_CLIENT.query(
    `mutation {
        createSortedComment(input:
            { content: "${comment2}",
                when: "${when2}"
                postId: "${createResponse.data.createPost.id}"
            }) {
            id
            content
            post {
                id
                title
            }
        }
    }`,
    {}
  );
  expect(createCommentResponse2.data.createSortedComment.id).toBeDefined();
  expect(createCommentResponse2.data.createSortedComment.content).toEqual(comment2);
  expect(createCommentResponse2.data.createSortedComment.post.id).toEqual(
    createResponse.data.createPost.id
  );
  expect(createCommentResponse2.data.createSortedComment.post.title).toEqual(
    createResponse.data.createPost.title
  );

  const queryResponse = await GRAPHQL_CLIENT.query(
    `query {
        getPost(id: "${createResponse.data.createPost.id}") {
            id
            title
            sortedComments {
                items {
                    id
                    when
                    content
                }
            }
        }
    }`,
    {}
  );
  expect(queryResponse.data.getPost).toBeDefined();
  const items = queryResponse.data.getPost.sortedComments.items;
  expect(items.length).toEqual(2);
  expect(items[0].id).toEqual(createCommentResponse1.data.createSortedComment.id);
  expect(items[1].id).toEqual(createCommentResponse2.data.createSortedComment.id);

  const queryResponseDesc = await GRAPHQL_CLIENT.query(
    `query {
        getPost(id: "${createResponse.data.createPost.id}") {
            id
            title
            sortedComments(sortDirection: DESC) {
                items {
                    id
                    when
                    content
                }
            }
        }
    }`,
    {}
  );
  expect(queryResponseDesc.data.getPost).toBeDefined();
  const itemsDesc = queryResponseDesc.data.getPost.sortedComments.items;
  expect(itemsDesc.length).toEqual(2);
  expect(itemsDesc[0].id).toEqual(createCommentResponse2.data.createSortedComment.id);
  expect(itemsDesc[1].id).toEqual(createCommentResponse1.data.createSortedComment.id);

  const queryResponseWithKeyCondition = await GRAPHQL_CLIENT.query(
    `query {
        getPost(id: "${createResponse.data.createPost.id}") {
            id
            title
            sortedComments(when: { beginsWith: "2018"}) {
                items {
                    id
                    when
                    content
                }
            }
        }
    }`,
    {}
  );
  expect(queryResponseWithKeyCondition.data.getPost).toBeDefined();
  const itemsDescWithKeyCondition = queryResponseWithKeyCondition.data.getPost.sortedComments.items;
  expect(itemsDescWithKeyCondition.length).toEqual(1);
  expect(itemsDescWithKeyCondition[0].id).toEqual(
    createCommentResponse1.data.createSortedComment.id
  );

  const queryResponseWithKeyConditionEq = await GRAPHQL_CLIENT.query(
    `query {
        getPost(id: "${createResponse.data.createPost.id}") {
            id
            title
            sortedComments(when: { eq: "${when1}"}) {
                items {
                    id
                    when
                    content
                }
            }
        }
    }`,
    {}
  );
  expect(queryResponseWithKeyConditionEq.data.getPost).toBeDefined();
  const itemsDescWithKeyConditionEq =
    queryResponseWithKeyConditionEq.data.getPost.sortedComments.items;
  expect(itemsDescWithKeyConditionEq.length).toEqual(1);
  expect(itemsDescWithKeyConditionEq[0].id).toEqual(
    createCommentResponse1.data.createSortedComment.id
  );

  const queryResponseWithKeyConditionGt = await GRAPHQL_CLIENT.query(
    `query {
        getPost(id: "${createResponse.data.createPost.id}") {
            id
            title
            sortedComments(when: { gt: "${when1}"}) {
                items {
                    id
                    when
                    content
                }
            }
        }
    }`,
    {}
  );
  expect(queryResponseWithKeyConditionGt.data.getPost).toBeDefined();
  const itemsDescWithKeyConditionGt =
    queryResponseWithKeyConditionGt.data.getPost.sortedComments.items;
  expect(itemsDescWithKeyConditionGt.length).toEqual(1);
  expect(itemsDescWithKeyConditionGt[0].id).toEqual(
    createCommentResponse2.data.createSortedComment.id
  );

  const queryResponseWithKeyConditionGe = await GRAPHQL_CLIENT.query(
    `query {
        getPost(id: "${createResponse.data.createPost.id}") {
            id
            title
            sortedComments(when: { ge: "${when1}"}) {
                items {
                    id
                    when
                    content
                }
            }
        }
    }`,
    {}
  );
  expect(queryResponseWithKeyConditionGe.data.getPost).toBeDefined();
  const itemsDescWithKeyConditionGe =
    queryResponseWithKeyConditionGe.data.getPost.sortedComments.items;
  expect(itemsDescWithKeyConditionGe.length).toEqual(2);
  expect(itemsDescWithKeyConditionGe[0].id).toEqual(
    createCommentResponse1.data.createSortedComment.id
  );
  expect(itemsDescWithKeyConditionGe[1].id).toEqual(
    createCommentResponse2.data.createSortedComment.id
  );

  const queryResponseWithKeyConditionLe = await GRAPHQL_CLIENT.query(
    `query {
        getPost(id: "${createResponse.data.createPost.id}") {
            id
            title
            sortedComments(when: { le: "${when2}"}) {
                items {
                    id
                    when
                    content
                }
            }
        }
    }`,
    {}
  );
  expect(queryResponseWithKeyConditionLe.data.getPost).toBeDefined();
  const itemsDescWithKeyConditionLe =
    queryResponseWithKeyConditionLe.data.getPost.sortedComments.items;
  expect(itemsDescWithKeyConditionLe.length).toEqual(2);
  expect(itemsDescWithKeyConditionLe[0].id).toEqual(
    createCommentResponse1.data.createSortedComment.id
  );
  expect(itemsDescWithKeyConditionLe[1].id).toEqual(
    createCommentResponse2.data.createSortedComment.id
  );

  const queryResponseWithKeyConditionLt = await GRAPHQL_CLIENT.query(
    `query {
        getPost(id: "${createResponse.data.createPost.id}") {
            id
            title
            sortedComments(when: { lt: "${when2}"}) {
                items {
                    id
                    when
                    content
                }
            }
        }
    }`,
    {}
  );
  expect(queryResponseWithKeyConditionLt.data.getPost).toBeDefined();
  const itemsDescWithKeyConditionLt =
    queryResponseWithKeyConditionLt.data.getPost.sortedComments.items;
  expect(itemsDescWithKeyConditionLt.length).toEqual(1);
  expect(itemsDescWithKeyConditionLt[0].id).toEqual(
    createCommentResponse1.data.createSortedComment.id
  );

  const queryResponseWithKeyConditionBetween = await GRAPHQL_CLIENT.query(
    `query {
        getPost(id: "${createResponse.data.createPost.id}") {
            id
            title
            sortedComments(when: { between: ["${whenmid}", "${whenfuture}"]}) {
                items {
                    id
                    when
                    content
                }
            }
        }
    }`,
    {}
  );
  expect(queryResponseWithKeyConditionBetween.data.getPost).toBeDefined();
  const itemsDescWithKeyConditionBetween =
    queryResponseWithKeyConditionBetween.data.getPost.sortedComments.items;
  expect(itemsDescWithKeyConditionBetween.length).toEqual(1);
  expect(itemsDescWithKeyConditionBetween[0].id).toEqual(
    createCommentResponse2.data.createSortedComment.id
  );
});

test('Test create comment without a post and then querying the comment.', async () => {
  try {
    const createCommentResponse1 = await GRAPHQL_CLIENT.query(
      `mutation {
            createComment(input:
                { content: "${comment1}" }) {
                id
                content
                post {
                    id
                    title
                }
            }
        }`,
      {}
    );
    expect(createCommentResponse1.data.createComment.id).toBeDefined();
    expect(createCommentResponse1.data.createComment.content).toEqual(comment1);
    expect(createCommentResponse1.data.createComment.post).toBeNull();

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
      {}
    );
    expect(queryResponseDesc.data.getComment).toBeDefined();
    expect(queryResponseDesc.data.getComment.post).toBeNull();
  } catch (e) {
    console.error(e);
    // fail
    expect(e).toBeUndefined();
  }
});
