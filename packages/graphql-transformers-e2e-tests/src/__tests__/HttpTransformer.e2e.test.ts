import { ResourceConstants } from 'graphql-transformer-common';
import { GraphQLTransform } from 'graphql-transformer-core';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { ModelAuthTransformer } from 'graphql-auth-transformer';
import { HttpTransformer } from '../../../graphql-http-transformer';
import { CloudFormationClient } from '../CloudFormationClient';
import { Output } from 'aws-sdk/clients/cloudformation';
import { GraphQLClient } from '../GraphQLClient';
import { default as moment } from 'moment';
import emptyBucket from '../emptyBucket';
import { deploy } from '../deployNestedStacks';
import { S3Client } from '../S3Client';
import { default as S3 } from 'aws-sdk/clients/s3';
import { deployJsonServer, destroyJsonServer } from '../cdkUtils';

jest.setTimeout(2000000);

const cf = new CloudFormationClient('us-west-2');
const customS3Client = new S3Client('us-west-2');
const awsS3Client = new S3({ region: 'us-west-2' });

const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `HttpTransformerTest-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `appsync-http-transformer-test-bucket-${BUILD_TIMESTAMP}`;
const LOCAL_FS_BUILD_DIR = '/tmp/http_transformer_tests/';
const S3_ROOT_DIR_KEY = 'deployments';

let GRAPHQL_CLIENT = undefined;

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}

beforeAll(async () => {
  const { apiUrl } = deployJsonServer();

  const validSchema = `
    type Comment @model {
        id: ID!
        title: String
        simpleGet: CompObj @http(method: GET, url: "${apiUrl}posts/1")
        simpleGet2: CompObj @http(url: "${apiUrl}posts/2")
        complexPost(
            id: Int,
            title: String!,
            body: String,
            userId: Int
        ): CompObj @http(method: POST, url: "${apiUrl}posts")
        complexPut(
            id: Int!,
            title: String,
            body: String,
            userId: Int
        ): CompObj @http(method: PUT, url: "${apiUrl}posts/:id")
        deleter: String @http(method: DELETE, url: "${apiUrl}posts/4")
        complexGet(
            data: String!,
            userId: Int!,
            _limit: Int
        ): [CompObj] @http(url: "${apiUrl}:data")
        complexGet2(
            dataType: String!,
            postId: Int!,
            secondType: String!,
            id: Int
        ): [PostComment] @http(url: "${apiUrl}:dataType/:postId/:secondType")
    }
    type CompObj {
        userId: Int
        id: Int
        title: String
        body: String
    }
    type PostComment {
        postId: Int
        id: Int
        name: String
        email: String
        body: String
    }
    `;

  try {
    await awsS3Client.createBucket({ Bucket: BUCKET_NAME }).promise();
  } catch (e) {
    console.error(`Failed to create bucket: ${e}`);
  }

  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'API_KEY',
          },
          additionalAuthenticationProviders: [],
        },
      }),
      new HttpTransformer(),
    ],
  });

  const out = transformer.transform(validSchema);

  try {
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

    // Arbitrary wait to make sure everything is ready.
    await cf.wait(5, () => Promise.resolve());

    console.log('Successfully created stack ' + STACK_NAME);
    console.log(finishedStack);
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
    console.log('Deleting json server deployment');
    destroyJsonServer();

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
test('Test HTTP GET request', async () => {
  try {
    const response = await GRAPHQL_CLIENT.query(
      `mutation {
            createComment(input: { title: "Hello, World!" }) {
                id
                title
                simpleGet {
                    id
                    title
                    body
                }
            }
        }`,
      {},
    );

    const post1Title = 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit';

    expect(response.errors).toBeUndefined();
    expect(response.data.createComment.id).toBeDefined();
    expect(response.data.createComment.title).toEqual('Hello, World!');
    expect(response.data.createComment.simpleGet).toBeDefined();
    expect(response.data.createComment.simpleGet.title).toEqual(post1Title);
  } catch (e) {
    console.error(e);
    // fail
    expect(e).toBeUndefined();
  }
});

test('Test HTTP GET request 2', async () => {
  try {
    const response = await GRAPHQL_CLIENT.query(
      `mutation {
            createComment(input: { title: "Hello, World!" }) {
                id
                title
                simpleGet2 {
                    id
                    title
                    body
                }
            }
        }`,
      {},
    );

    const post2Title = 'qui est esse';

    expect(response.errors).toBeUndefined();
    expect(response.data.createComment.id).toBeDefined();
    expect(response.data.createComment.title).toEqual('Hello, World!');
    expect(response.data.createComment.simpleGet2).toBeDefined();
    expect(response.data.createComment.simpleGet2.title).toEqual(post2Title);
  } catch (e) {
    console.error(e);
    // fail
    expect(e).toBeUndefined();
  }
});

test('Test HTTP POST request', async () => {
  try {
    const response = await GRAPHQL_CLIENT.query(
      `mutation {
            createComment(input: { title: "Hello, World!" }) {
                id
                title
                complexPost(
                    body: {
                        title: "foo",
                        body: "bar",
                        userId: 2
                    }
                ) {
                    id
                    title
                    body
                    userId
                }
            }
        }`,
      {},
    );

    expect(response.errors).toBeUndefined();
    expect(response.data.createComment.id).toBeDefined();
    expect(response.data.createComment.title).toEqual('Hello, World!');
    expect(response.data.createComment.complexPost).toBeDefined();
    expect(response.data.createComment.complexPost.title).toEqual('foo');
    expect(response.data.createComment.complexPost.userId).toEqual(2);
  } catch (e) {
    console.error(e);
    // fail
    expect(e).toBeUndefined();
  }
});

test('Test HTTP PUT request', async () => {
  try {
    const response = await GRAPHQL_CLIENT.query(
      `mutation {
            createComment(input: { title: "Hello, World!" }) {
                id
                title
                complexPut(
                    params: {
                        id: "3"
                    },
                    body: {
                        title: "foo",
                        body: "bar",
                        userId: 2
                    }
                ) {
                    id
                    title
                    body
                    userId
                }
            }
        }`,
      {},
    );

    expect(response.errors).toBeUndefined();
    expect(response.data.createComment.id).toBeDefined();
    expect(response.data.createComment.title).toEqual('Hello, World!');
    expect(response.data.createComment.complexPut).toBeDefined();
    expect(response.data.createComment.complexPut.title).toEqual('foo');
    expect(response.data.createComment.complexPut.userId).toEqual(2);
  } catch (e) {
    console.error(e);
    // fail
    expect(e).toBeUndefined();
  }
});

test('Test HTTP DELETE request', async () => {
  try {
    const response = await GRAPHQL_CLIENT.query(
      `mutation {
            createComment(input: { title: "Hello, World!" }) {
                id
                title
                deleter
            }
        }`,
      {},
    );

    expect(response.errors).toBeUndefined();
    expect(response.data.createComment.id).toBeDefined();
    expect(response.data.createComment.title).toEqual('Hello, World!');
    expect(response.data.createComment.deleter).not.toBeNull();
  } catch (e) {
    console.error(e);
    // fail
    expect(e).toBeUndefined();
  }
});

test('Test GET with URL param and query values', async () => {
  try {
    const response = await GRAPHQL_CLIENT.query(
      `mutation {
            createComment(input: { title: "Hello, World!" }) {
                id
                title
                complexGet(
                    params: {
                        data: "posts"
                    },
                    query: {
                        userId: 1,
                        _limit: 7
                    }
                ) {
                    id
                    title
                    body
                }
            }
        }`,
      {},
    );

    expect(response.errors).toBeUndefined();
    expect(response.data.createComment.id).toBeDefined();
    expect(response.data.createComment.title).toEqual('Hello, World!');
    expect(response.data.createComment.complexGet).toBeDefined();
    expect(response.data.createComment.complexGet.length).toEqual(7);
  } catch (e) {
    console.error(e);
    // fail
    expect(e).toBeUndefined();
  }
});

test('Test GET with multiple URL params and query values', async () => {
  try {
    const response = await GRAPHQL_CLIENT.query(
      `mutation {
            createComment(input: { title: "Hello, World!" }) {
                id
                title
                complexGet2(
                    params: {
                        dataType: "posts",
                        postId: "1",
                        secondType: "comments"
                    },
                    query: {
                        id: 2
                    }
                ) {
                    id
                    name
                    email
                }
            }
        }`,
      {},
    );

    expect(response.errors).toBeUndefined();
    expect(response.data.createComment.id).toBeDefined();
    expect(response.data.createComment.title).toEqual('Hello, World!');
    expect(response.data.createComment.complexGet2).toBeDefined();
    expect(response.data.createComment.complexGet2[0].email).toEqual('Jayne_Kuhic@sydney.com');
  } catch (e) {
    console.error(e);
    // fail
    expect(e).toBeUndefined();
  }
});

test('Test that GET errors when missing a required Query input object', async () => {
  try {
    const response = await GRAPHQL_CLIENT.query(
      `mutation {
            createComment(input: { title: "Hello, World!" }) {
                id
                title
                complexGet(
                    params: {
                        data: "posts",
                    }
                ) {
                    id
                    title
                    body
                }
            }
        }`,
      {},
    );

    expect(response.data).toBeNull();
    expect(response.errors).toBeDefined();
    expect(response.errors).toHaveLength(1);
    expect(response.errors[0].message).toEqual('Validation error of type MissingFieldArgument: Missing field argument query @ \'createComment/complexGet\'');
  } catch (e) {
    console.error(e);
    // fail
    expect(e).toBeUndefined();
  }
});

test('Test that POST errors when missing a non-null arg in query/body', async () => {
  try {
    const response = await GRAPHQL_CLIENT.query(
      `mutation {
            createComment(input: { title: "Hello, World!" }) {
                id
                title
                complexPost(
                    body: {
                        id: 1,
                        body: "bar"
                    }
                ) {
                    id
                    title
                    body
                }
            }
        }`,
      {},
    );

    expect(response.data.createComment.complexPost).toBeNull();
    expect(response.errors).toBeDefined();
    expect(response.errors).toHaveLength(1);
    expect(response.errors[0].message).toEqual('An argument you marked as Non-Null is not present in the query nor the body of your request.');
  } catch (e) {
    console.error(e);
    // fail
    expect(e).toBeUndefined();
  }
});
