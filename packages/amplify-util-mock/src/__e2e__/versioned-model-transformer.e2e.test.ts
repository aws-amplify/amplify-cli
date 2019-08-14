import DynamoDBModelTransformer from 'graphql-dynamodb-transformer';
import GraphQLTransform from 'graphql-transformer-core';
import {
  default as ModelAuthTransformer,
  default as VersionedModelTransformer,
} from 'graphql-versioned-transformer';
import { GraphQLClient } from './utils/graphql-client';
import { deploy, launchDDBLocal, terminateDDB, logDebug } from './utils/index';

jest.setTimeout(20000);

let GRAPHQL_CLIENT = undefined;
let ddbEmulator = null;
let dbPath = null;
let server;

beforeAll(async () => {
  const validSchema = `
    type Post @model @versioned {
        id: ID!
        title: String!
        version: Int!
        createdAt: String
        updatedAt: String
    }
    `;

  try {
    const transformer = new GraphQLTransform({
      transformers: [
        new DynamoDBModelTransformer(),
        new ModelAuthTransformer(),
        new VersionedModelTransformer(),
      ],
    });
    const out = transformer.transform(validSchema);

    let ddbClient;
    ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await launchDDBLocal());

    const result = await deploy(out, ddbClient);
    server = result.simulator;

    const endpoint = server.url + '/graphql';
    console.log(`Using graphql url: ${endpoint}`);

    const apiKey = result.config.appSync.apiKey;
    expect(apiKey).toBeDefined();
    expect(endpoint).toBeDefined();
    GRAPHQL_CLIENT = new GraphQLClient(endpoint, { 'x-api-key': apiKey });
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
test('Test createPost mutation', async () => {
  const response = await GRAPHQL_CLIENT.query(
    `mutation {
        createPost(input: { title: "Hello, World!" }) {
            id
            title
            createdAt
            updatedAt
            version
        }
    }`,
    {}
  );
  expect(response.data.createPost.id).toBeDefined();
  expect(response.data.createPost.title).toEqual('Hello, World!');
  expect(response.data.createPost.createdAt).toBeDefined();
  expect(response.data.createPost.updatedAt).toBeDefined();
  expect(response.data.createPost.version).toEqual(1);
});

test('Test updatePost mutation', async () => {
  const createResponse = await GRAPHQL_CLIENT.query(
    `mutation {
        createPost(input: { title: "Test Update" }) {
            id
            title
            createdAt
            updatedAt
            version
        }
    }`,
    {}
  );
  expect(createResponse.data.createPost.id).toBeDefined();
  expect(createResponse.data.createPost.title).toEqual('Test Update');
  expect(createResponse.data.createPost.version).toEqual(1);
  const updateResponse = await GRAPHQL_CLIENT.query(
    `mutation {
        updatePost(input: {
            id: "${createResponse.data.createPost.id}",
            title: "Bye, World!",
            expectedVersion: ${createResponse.data.createPost.version}
        }) {
            id
            title
            version
        }
    }`,
    {}
  );
  expect(updateResponse.data.updatePost.title).toEqual('Bye, World!');
  expect(updateResponse.data.updatePost.version).toEqual(2);
});

test('Test failed updatePost mutation with wrong version', async () => {
  const createResponse = await GRAPHQL_CLIENT.query(
    `mutation {
        createPost(input: { title: "Test Update" }) {
            id
            title
            createdAt
            updatedAt
            version
        }
    }`,
    {}
  );
  expect(createResponse.data.createPost.id).toBeDefined();
  expect(createResponse.data.createPost.title).toEqual('Test Update');
  expect(createResponse.data.createPost.version).toEqual(1);
  const updateResponse = await GRAPHQL_CLIENT.query(
    `mutation {
        updatePost(input: {
            id: "${createResponse.data.createPost.id}",
            title: "Bye, World!",
            expectedVersion: 3
        }) {
            id
            title
            version
        }
    }`,
    {}
  );
  expect(updateResponse.errors.length).toEqual(1);
  expect((updateResponse.errors[0] as any).errorType).toEqual(
    'DynamoDB:ConditionalCheckFailedException'
  );
});

test('Test deletePost mutation', async () => {
  const createResponse = await GRAPHQL_CLIENT.query(
    `mutation {
        createPost(input: { title: "Test Delete" }) {
            id
            title
            version
            createdAt
            updatedAt
        }
    }`,
    {}
  );
  expect(createResponse.data.createPost.id).toBeDefined();
  expect(createResponse.data.createPost.title).toEqual('Test Delete');
  expect(createResponse.data.createPost.version).toBeDefined();
  const deleteResponse = await GRAPHQL_CLIENT.query(
    `mutation {
        deletePost(input: { id: "${createResponse.data.createPost.id}", expectedVersion: ${createResponse.data.createPost.version} }) {
            id
            title
            version
        }
    }`,
    {}
  );
  expect(deleteResponse.data.deletePost.title).toEqual('Test Delete');
  expect(deleteResponse.data.deletePost.version).toEqual(createResponse.data.createPost.version);
});

test('Test deletePost mutation with wrong version', async () => {
  const createResponse = await GRAPHQL_CLIENT.query(
    `mutation {
        createPost(input: { title: "Test Delete" }) {
            id
            title
            version
            createdAt
            updatedAt
        }
    }`,
    {}
  );
  expect(createResponse.data.createPost.id).toBeDefined();
  expect(createResponse.data.createPost.title).toEqual('Test Delete');
  expect(createResponse.data.createPost.version).toBeDefined();
  const deleteResponse = await GRAPHQL_CLIENT.query(
    `mutation {
        deletePost(input: { id: "${createResponse.data.createPost.id}", expectedVersion: 3 }) {
            id
            title
            version
        }
    }`,
    {}
  );
  expect(deleteResponse.errors.length).toEqual(1);
  expect((deleteResponse.errors[0] as any).errorType).toEqual(
    'DynamoDB:ConditionalCheckFailedException'
  );
});
