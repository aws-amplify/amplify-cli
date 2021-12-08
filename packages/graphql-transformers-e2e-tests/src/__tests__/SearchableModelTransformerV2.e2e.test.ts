import { ResourceConstants } from 'graphql-transformer-common';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { SearchableModelTransformer } from '@aws-amplify/graphql-searchable-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { CloudFormationClient } from '../CloudFormationClient';
import { S3Client } from '../S3Client';
import { Output } from 'aws-sdk/clients/cloudformation';
import { GraphQLClient } from '../GraphQLClient';
import { cleanupStackAfterTest, deploy } from '../deployNestedStacks';
import { default as moment } from 'moment';
import { default as S3 } from 'aws-sdk/clients/s3';

// tslint:disable: no-magic-numbers
jest.setTimeout(60000 * 60);

const cf = new CloudFormationClient('us-east-1');
const customS3Client = new S3Client('us-east-1');
const awsS3Client = new S3({ region: 'us-east-1' });
let GRAPHQL_CLIENT: GraphQLClient = undefined;
const featureFlags = {
  getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
    if (name === 'improvePluralization') {
      return true;
    }
    return;
  }),
  getNumber: jest.fn(),
  getObject: jest.fn(),
  getString: jest.fn(),
};

const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `TestSearchableAggregatesv2-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `testsearchableaggregatesv2-${BUILD_TIMESTAMP}`;
const LOCAL_FS_BUILD_DIR = '/tmp/model_searchable_aggregates_v2_tests/';
const S3_ROOT_DIR_KEY = 'deployments';

const fragments = [`fragment FullTodo on Todo { id name description count }`];

const runQuery = async (query: string) => {
  try {
    const q = [query, ...fragments].join('\n');
    const response = await GRAPHQL_CLIENT.query(q, {});
    return response;
  } catch (e) {
    console.error(e);
    return null;
  }
};

const createEntries = async () => {
  // create todos
  await runQuery(getCreateTodosMutation('test1', 'test1', 10));
  await runQuery(getCreateTodosMutation('test2', 'test2', 20));
  await runQuery(getCreateTodosMutation('test3', 'test3', 30));
  // Waiting for the ES Cluster + Streaming Lambda infra to be setup
  await cf.wait(120, () => Promise.resolve());
  await waitForESPropagate();
};

const waitForESPropagate = async (initialWaitSeconds = 5, maxRetryCount = 5) => {
  const expectedCount = 3;
  let waitInMilliseconds = initialWaitSeconds * 1000;
  let currentRetryCount = 0;
  let searchResponse;

  do {
    await new Promise(r => setTimeout(r, waitInMilliseconds));
    searchResponse = await GRAPHQL_CLIENT.query(
      `query {
        searchTodos {
          items {
            id
          }
        }
      }`,
      {},
    );
    currentRetryCount += 1;
    waitInMilliseconds = waitInMilliseconds * 2;
  } while (searchResponse.data.searchTodos?.items?.length < expectedCount && currentRetryCount <= maxRetryCount);
};

beforeAll(async () => {
  const validSchema = `
    type Todo @model @searchable {
      id: ID!
      name: String!
      description: String
      count: Int
    }
    `;
  const transformer = new GraphQLTransform({
    featureFlags,
    transformers: [new ModelTransformer(), new SearchableModelTransformer()],
    sandboxModeEnabled: true,
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
      {},
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
    const endpoint = getApiEndpoint(finishedStack.Outputs);
    const apiKey = getApiKey(finishedStack.Outputs);
    expect(apiKey).toBeDefined();
    expect(endpoint).toBeDefined();
    GRAPHQL_CLIENT = new GraphQLClient(endpoint, { 'x-api-key': apiKey });

    // Create sample mutations to test search queries
    await createEntries();
  } catch (e) {
    console.error(e);
    throw e;
  }
});

afterAll(async () => {
  await cleanupStackAfterTest(BUCKET_NAME, STACK_NAME, cf);
});

test('query for aggregate scalar results', async () => {
  const expectedValue = 10;
  const searchResponse = await GRAPHQL_CLIENT.query(
    `query {
      searchTodos(aggregates: [{
        name: "Minimum",
        type: min,
        field: count
      }]) {
        aggregateItems {
          name
          result {
            ... on SearchableAggregateScalarResult {
              value
            }
          }
        }
      }
    }`,
    {},
  );
  expect(searchResponse).toBeDefined();
  const result = searchResponse.data.searchTodos.aggregateItems[0].result.value;
  expect(result).toEqual(expectedValue);
});

test('query for aggregate bucket results', async () => {
  const expectedValue = 3;
  const searchResponse = await GRAPHQL_CLIENT.query(
    `query {
      searchTodos(aggregates: [{
        name: "Terms",
        type: terms,
        field: name
      }]) {
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
    }`,
    {},
  );
  expect(searchResponse).toBeDefined();
  const result = searchResponse.data.searchTodos.aggregateItems[0].result.buckets.length;
  expect(result).toEqual(expectedValue);
});

test('query for multiple aggregates', async () => {
  const expectedValue = 5;
  const searchResponse = await GRAPHQL_CLIENT.query(
    `query {
      searchTodos(aggregates: [
        { name: "Minimum", type: min, field: count },
        { name: "Maximum", type: max, field: count },
        { name: "Average", type: avg, field: count },
        { name: "Total", type: sum, field: count },
        { name: "Terms", type: terms, field: count }
      ]) {
        aggregateItems {
          name
          result {
            ... on SearchableAggregateScalarResult {
              value
            }
            ... on SearchableAggregateBucketResult {
              buckets {
                doc_count
                key
              }
            }
          }
        }
      }
    }`,
    {},
  );
  expect(searchResponse).toBeDefined();
  const result = searchResponse.data.searchTodos.aggregateItems.length;
  expect(result).toEqual(expectedValue);
  expect(searchResponse.data.searchTodos.aggregateItems[0].result).toBeDefined();
  expect(searchResponse.data.searchTodos.aggregateItems[1].result).toBeDefined();
  expect(searchResponse.data.searchTodos.aggregateItems[2].result).toBeDefined();
  expect(searchResponse.data.searchTodos.aggregateItems[3].result).toBeDefined();
  expect(searchResponse.data.searchTodos.aggregateItems[4].result).toBeDefined();
});

test('query with sort return results', async () => {
  const searchResponse = await GRAPHQL_CLIENT.query(
    `query {
      searchTodos(sort: [
        {
          direction: asc,
          field: name
        },
        {
          direction: asc,
          field: description
        }
      ]) {
        items {
          id
          name
          description
        }
      }
    }`,
    {},
  );
  expect(searchResponse).toBeDefined();
  expect(searchResponse.data).toBeDefined();
  expect(searchResponse.data.searchTodos).toBeDefined();
  expect(searchResponse.data.searchTodos.items).toBeDefined();
});

test('query searchable with eq filter', async () => {
  const expectedRecords = 1;
  const searchResponse = await GRAPHQL_CLIENT.query(
    `query {
      searchTodos(sort: [{
          direction: asc,
          field: name
        }],
        filter: {
          name: {
            eq: "test1"
          }
        }
      ) {
        items {
          id
          name
          description
        }
      }
    }`,
    {},
  );
  expect(searchResponse).toBeDefined();
  expect(searchResponse.data).toBeDefined();
  expect(searchResponse.data.searchTodos).toBeDefined();
  expect(searchResponse.data.searchTodos.items).toHaveLength(expectedRecords);
  expect(searchResponse.data.searchTodos.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        name: 'test1',
        description: 'test1'
      }),
    ]),
  );
});

test('query searchable with ne filter', async () => {
  const expectedRecords = 2;
  const searchResponse = await GRAPHQL_CLIENT.query(
    `query {
      searchTodos(sort: [{
          direction: asc,
          field: name
        }],
        filter: {
          name: {
            ne: "test1"
          }
        }
      ) {
        items {
          id
          name
          description
        }
      }
    }`,
    {},
  );
  expect(searchResponse).toBeDefined();
  expect(searchResponse.data).toBeDefined();
  expect(searchResponse.data.searchTodos).toBeDefined();
  expect(searchResponse.data.searchTodos.items).toHaveLength(expectedRecords);
  expect(searchResponse.data.searchTodos.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        name: 'test2',
        description: 'test2'
      }),
      expect.objectContaining({
        id: expect.any(String),
        name: 'test3',
        description: 'test3'
      }),
    ]),
  );
});

test('query searchable with gt filter', async () => {
  const expectedRecords = 2;
  const searchResponse = await GRAPHQL_CLIENT.query(
    `query {
      searchTodos(sort: [{
          direction: asc,
          field: name
        }],
        filter: {
          count: {
            gt: 10
          }
        }
      ) {
        items {
          id
          name
          description
        }
      }
    }`,
    {},
  );
  expect(searchResponse).toBeDefined();
  expect(searchResponse.data).toBeDefined();
  expect(searchResponse.data.searchTodos).toBeDefined();
  expect(searchResponse.data.searchTodos.items).toHaveLength(expectedRecords);
  expect(searchResponse.data.searchTodos.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        name: 'test2',
        description: 'test2'
      }),
      expect.objectContaining({
        id: expect.any(String),
        name: 'test3',
        description: 'test3'
      }),
    ]),
  );
});

test('query searchable with gte filter', async () => {
  const expectedRecords = 3;
  const searchResponse = await GRAPHQL_CLIENT.query(
    `query {
      searchTodos(sort: [{
          direction: asc,
          field: name
        }],
        filter: {
          count: {
            gte: 10
          }
        }
      ) {
        items {
          id
          name
          description
        }
      }
    }`,
    {},
  );
  expect(searchResponse).toBeDefined();
  expect(searchResponse.data).toBeDefined();
  expect(searchResponse.data.searchTodos).toBeDefined();
  expect(searchResponse.data.searchTodos.items).toHaveLength(expectedRecords);
  expect(searchResponse.data.searchTodos.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        name: 'test1',
        description: 'test1'
      }),
      expect.objectContaining({
        id: expect.any(String),
        name: 'test2',
        description: 'test2'
      }),
      expect.objectContaining({
        id: expect.any(String),
        name: 'test3',
        description: 'test3'
      }),
    ]),
  );
});

test('query searchable with lt filter', async () => {
  const expectedRecords = 1;
  const searchResponse = await GRAPHQL_CLIENT.query(
    `query {
      searchTodos(sort: [{
          direction: asc,
          field: name
        }],
        filter: {
          count: {
            lt: 20
          }
        }
      ) {
        items {
          id
          name
          description
        }
      }
    }`,
    {},
  );
  expect(searchResponse).toBeDefined();
  expect(searchResponse.data).toBeDefined();
  expect(searchResponse.data.searchTodos).toBeDefined();
  expect(searchResponse.data.searchTodos.items).toHaveLength(expectedRecords);
  expect(searchResponse.data.searchTodos.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        name: 'test1',
        description: 'test1'
      }),
    ]),
  );
});

test('query searchable with lte filter', async () => {
  const expectedRecords = 2;
  const searchResponse = await GRAPHQL_CLIENT.query(
    `query {
      searchTodos(sort: [{
          direction: asc,
          field: name
        }],
        filter: {
          count: {
            lte: 20
          }
        }
      ) {
        items {
          id
          name
          description
        }
      }
    }`,
    {},
  );
  expect(searchResponse).toBeDefined();
  expect(searchResponse.data).toBeDefined();
  expect(searchResponse.data.searchTodos).toBeDefined();
  expect(searchResponse.data.searchTodos.items).toHaveLength(expectedRecords);
  expect(searchResponse.data.searchTodos.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        name: 'test1',
        description: 'test1'
      }),
      expect.objectContaining({
        id: expect.any(String),
        name: 'test2',
        description: 'test2'
      }),
    ]),
  );
});

test('query searchable with eq and lt filter', async () => {
  const expectedRecords = 1;
  const searchResponse = await GRAPHQL_CLIENT.query(
    `query {
      searchTodos(sort: [{
          direction: asc,
          field: name
        }],
        filter: {
          name: {
            eq: "test1"
          },
          and: {
            count: {
              lt: 20
            }
          }
        }
      ) {
        items {
          id
          name
          description
        }
      }
    }`,
    {},
  );
  expect(searchResponse).toBeDefined();
  expect(searchResponse.data).toBeDefined();
  expect(searchResponse.data.searchTodos).toBeDefined();
  expect(searchResponse.data.searchTodos.items).toHaveLength(expectedRecords);
  expect(searchResponse.data.searchTodos.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        name: 'test1',
        description: 'test1'
      }),
    ]),
  );
});

test('query searchable with wildcard filter', async () => {
  const expectedRecords = 3;
  const searchResponse = await GRAPHQL_CLIENT.query(
    `query {
      searchTodos(sort: [{
          direction: asc,
          field: name
        }],
        filter: {
          name: {
            wildcard: "test*"
          }
        }
      ) {
        items {
          id
          name
          description
        }
      }
    }`,
    {},
  );
  expect(searchResponse).toBeDefined();
  expect(searchResponse.data).toBeDefined();
  expect(searchResponse.data.searchTodos).toBeDefined();
  expect(searchResponse.data.searchTodos.items).toHaveLength(expectedRecords);
  expect(searchResponse.data.searchTodos.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        name: 'test1',
        description: 'test1'
      }),
      expect.objectContaining({
        id: expect.any(String),
        name: 'test2',
        description: 'test2'
      }),
      expect.objectContaining({
        id: expect.any(String),
        name: 'test3',
        description: 'test3'
      }),
    ]),
  );
});

test('query searchable with matchPhrasePrefix filter', async () => {
  const expectedRecords = 3;
  const searchResponse = await GRAPHQL_CLIENT.query(
    `query {
      searchTodos(sort: [{
          direction: asc,
          field: name
        }],
        filter: {
          name: {
            matchPhrasePrefix: "t"
          }
        }
      ) {
        items {
          id
          name
          description
        }
      }
    }`,
    {},
  );
  expect(searchResponse).toBeDefined();
  expect(searchResponse.data).toBeDefined();
  expect(searchResponse.data.searchTodos).toBeDefined();
  expect(searchResponse.data.searchTodos.items).toHaveLength(expectedRecords);
  expect(searchResponse.data.searchTodos.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        name: 'test1',
        description: 'test1'
      }),
      expect.objectContaining({
        id: expect.any(String),
        name: 'test2',
        description: 'test2'
      }),
      expect.objectContaining({
        id: expect.any(String),
        name: 'test3',
        description: 'test3'
      }),
    ]),
  );
});

function getCreateTodosMutation(
  name: string,
  description: string,
  count: number,
): string {
  return `mutation {
        createTodo(input: {
            name: "${name}"
            description: "${description}"
            count: ${count}
        }) { ...FullTodo }
    }`;
}

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}
