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

const cf = new CloudFormationClient('us-west-2');
const customS3Client = new S3Client('us-west-2');
const awsS3Client = new S3({ region: 'us-west-2' });
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
const STACK_NAME = `TestSearchableAggregates-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `testsearchableaggregates-${BUILD_TIMESTAMP}`;
const LOCAL_FS_BUILD_DIR = '/tmp/model_searchable_aggregates_tests/';
const S3_ROOT_DIR_KEY = 'deployments';

const fragments = [`fragment FullPost on Post { id author title ups downs percentageUp isPublished createdAt }`];

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
  // create posts
  await runQuery(getCreatePostsMutation('testuser', 'test', 157, 10, 97.4, true));
  await runQuery(getCreatePostsMutation('testuser', 'test title', 60, 30, 21.0, false));
  await runQuery(getCreatePostsMutation('sampleuser', 'test title', 160, 30, 97.6, false));
  await runQuery(getCreatePostsMutation('sampleuser', 'test TITLE', 170, 30, 88.8, true));
  await runQuery(getCreatePostsMutation('testuser', 'test title', 200, 50, 11.9, false));
  await runQuery(getCreatePostsMutation('testuser', 'test title', 170, 30, 88.8, true));
  await runQuery(getCreatePostsMutation('testuser', 'test title', 160, 30, 97.6, false));
  await runQuery(getCreatePostsMutation('testuser', 'test title', 170, 30, 77.7, true));
  // Waiting for the ES Cluster + Streaming Lambda infra to be setup
  await cf.wait(120, () => Promise.resolve());
};

beforeAll(async () => {
  const validSchema = `
    type Post @model @searchable {
      id: ID!
      author: String!
      title: String
      content: String
      url: String
      ups: Int
      downs: Int
      version: Int
      postedAt: String
      createdAt: AWSDateTime
      comments: [String!]
      ratings: [Int!]
      percentageUp: Float
      isPublished: Boolean
      jsonField: AWSJSON
    }
    `;
  const transformer = new GraphQLTransform({
    featureFlags,
    transformers: [new ModelTransformer(), new SearchableModelTransformer()],
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
  const expectedValue = 60;
  const searchResponse = await GRAPHQL_CLIENT.query(
    `query {
      searchPosts(aggregates: [{
        name: "Minimum",
        type: min,
        field: "ups"
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
  const result = searchResponse.data.searchPosts.aggregateItems[0].result.value;
  expect(result).toEqual(expectedValue);
});

test('query for aggregate bucket results', async () => {
  const expectedValue = 3;
  const searchResponse = await GRAPHQL_CLIENT.query(
    `query {
      searchPosts(aggregates: [{
        name: "Terms",
        type: terms,
        field: "title"
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
  const result = searchResponse.data.searchPosts.aggregateItems[0].result.buckets.length;
  expect(result).toEqual(expectedValue);
});

test('query for multiple aggregates', async () => {
  const expectedValue = 2;
  const searchResponse = await GRAPHQL_CLIENT.query(
    `query {
      searchPosts(aggregates: [{
        name: "Minimum",
        type: min,
        field: "ups"
      },
      {
        name: "Terms",
        type: terms,
        field: "title"
      }]) {
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
  const result = searchResponse.data.searchPosts.aggregateItems.length;
  expect(result).toEqual(expectedValue);
  expect(searchResponse.data.searchPosts.aggregateItems[0].result).toBeDefined();
  expect(searchResponse.data.searchPosts.aggregateItems[1].result).toBeDefined();
});

function getCreatePostsMutation(
  author: string,
  title: string,
  ups: number,
  downs: number,
  percentageUp: number,
  isPublished: boolean,
): string {
  return `mutation {
        createPost(input: {
            author: "${author}"
            title: "${title}"
            ups: ${ups}
            downs: ${downs}
            percentageUp: ${percentageUp}
            isPublished: ${isPublished}
        }) { ...FullPost }
    }`;
}

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}
