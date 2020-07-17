import { ResourceConstants } from 'graphql-transformer-common';
import { GraphQLTransform } from 'graphql-transformer-core';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { VersionedModelTransformer } from 'graphql-versioned-transformer';
import { ModelAuthTransformer } from 'graphql-auth-transformer';
import { CloudFormationClient } from '../CloudFormationClient';
import { Output } from 'aws-sdk/clients/cloudformation';
import { GraphQLClient } from '../GraphQLClient';
import { default as moment } from 'moment';
import { default as S3 } from 'aws-sdk/clients/s3';
import { S3Client } from '../S3Client';
import { deploy } from '../deployNestedStacks';
import emptyBucket from '../emptyBucket';

jest.setTimeout(2000000);

const cf = new CloudFormationClient('us-west-2');

const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `VersionedTest-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `versioned-test-bucket-${BUILD_TIMESTAMP}`;
const LOCAL_FS_BUILD_DIR = '/tmp/model_transform_versioned_tests/';
const S3_ROOT_DIR_KEY = 'deployments';

let GRAPHQL_CLIENT = undefined;

const customS3Client = new S3Client('us-west-2');
const awsS3Client = new S3({ region: 'us-west-2' });

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}

beforeAll(async () => {
  const validSchema = `
    type Post @model @versioned {
        id: ID!
        title: String!
        version: Int!
        createdAt: AWSDateTime
        updatedAt: AWSDateTime
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new VersionedModelTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'API_KEY',
          },
          additionalAuthenticationProviders: [],
        },
      }),
    ],
  });
  try {
    await awsS3Client.createBucket({ Bucket: BUCKET_NAME }).promise();
  } catch (e) {
    console.error(`Failed to create bucket: ${e}`);
  }

  try {
    const out = transformer.transform(validSchema);
    console.log('Creating Stack ' + STACK_NAME);
    const finishedStack = await deploy(
      customS3Client,
      cf,
      STACK_NAME,
      out,
      { CreateAPIKey: '1' },
      LOCAL_FS_BUILD_DIR,
      BUCKET_NAME,
      S3_ROOT_DIR_KEY,
      BUILD_TIMESTAMP,
    );
    expect(finishedStack).toBeDefined();

    // Arbitrary wait to make sure everything is ready.
    //await cf.wait(10, () => Promise.resolve())
    console.log('Successfully created stack ' + STACK_NAME);
    expect(finishedStack).toBeDefined();
    const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
    const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput);
    const endpoint = getApiEndpoint(finishedStack.Outputs);
    const apiKey = getApiKey(finishedStack.Outputs);
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
    console.log('Deleting stack ' + STACK_NAME);
    await cf.deleteStack(STACK_NAME);
    await cf.waitForStack(STACK_NAME);
    console.log('Successfully deleted stack ' + STACK_NAME);
  } catch (e) {
    if (e.code === 'ValidationError' && e.message === `Stack with id ${STACK_NAME} does not exist`) {
      // The stack was deleted. This is good.
      expect(true).toEqual(true);
      console.log('Successfully deleted stack ' + STACK_NAME);
    } else {
      console.error(e);
      expect(true).toEqual(false);
    }
  }
  try {
    await emptyBucket(BUCKET_NAME);
  } catch (e) {
    console.error(`Failed to empty S3 bucket: ${e}`);
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
    {},
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
    {},
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
    {},
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
    {},
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
    {},
  );
  expect(updateResponse.errors.length).toEqual(1);
  expect((updateResponse.errors[0] as any).errorType).toEqual('DynamoDB:ConditionalCheckFailedException');
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
    {},
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
    {},
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
    {},
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
    {},
  );
  expect(deleteResponse.errors.length).toEqual(1);
  expect((deleteResponse.errors[0] as any).errorType).toEqual('DynamoDB:ConditionalCheckFailedException');
});
