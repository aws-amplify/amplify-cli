import { DefaultValueTransformer } from '@aws-amplify/graphql-default-value-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { Output } from 'aws-sdk/clients/cloudformation';
import { default as S3 } from 'aws-sdk/clients/s3';
import { ResourceConstants } from 'graphql-transformer-common';
import { default as moment } from 'moment';
import { CloudFormationClient } from '../CloudFormationClient';
import { cleanupStackAfterTest, deploy } from '../deployNestedStacks';
import { GraphQLClient } from '../GraphQLClient';
import { S3Client } from '../S3Client';

jest.setTimeout(2000000);

const cf = new CloudFormationClient('us-west-2');
const customS3Client = new S3Client('us-west-2');
const awsS3Client = new S3({ region: 'us-west-2' });
const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `DefaultValueTransformerTests-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `appsync-default-value-transformer-test-bucket-${BUILD_TIMESTAMP}`;
const LOCAL_FS_BUILD_DIR = '/tmp/default_value_transformer_tests/';
const S3_ROOT_DIR_KEY = 'deployments';

let GRAPHQL_CLIENT = undefined;

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}

beforeAll(async () => {
  const validSchema = `
    type Post @model {
      id: ID!
      stringValue: String @default(value: "hello world")
      intVal: Int @default(value: "10002000")
      floatValue: Float @default(value: "123456.34565")
      booleanValue: Boolean @default(value: "true")
      awsJsonValue: AWSJSON @default(value: "{\\\"a\\\":1, \\\"b\\\":3, \\\"string\\\": \\\"234\\\"}")
      awsDateValue: AWSDate @default(value: "2016-01-29")
      awsTimestampValue: AWSTimestamp @default(value: "545345345")
      awsEmailValue: AWSEmail @default(value: "local-part@domain-part")
      awsURLValue: AWSURL @default(value: "https://www.amazon.com/dp/B000NZW3KC/")
      awsPhoneValue: AWSPhone @default(value: "+41 44 668 18 00")
      awsIPAddressValue1: AWSIPAddress @default(value: "123.12.34.56")
      awsIPAddressValue2: AWSIPAddress @default(value: "1a2b:3c4b::1234:4567")
      enumValue: Tag @default(value: "RANDOM")
      awsTimeValue: AWSTime @default(value: "12:00:34Z")
      awsDateTime: AWSDateTime @default(value: "2007-04-05T14:30:34Z")
    }

    enum Tag {
      NEWS
      RANDOM
    }
  `;

  try {
    await awsS3Client.createBucket({ Bucket: BUCKET_NAME }).promise();
  } catch (e) {
    console.warn(`Could not create bucket: ${e}`);
  }

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new DefaultValueTransformer()],
  });
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
  await cf.wait(10, () => Promise.resolve());
  expect(finishedStack).toBeDefined();
  const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
  const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput);
  const endpoint = getApiEndpoint(finishedStack.Outputs);
  const apiKey = getApiKey(finishedStack.Outputs);

  expect(apiKey).toBeDefined();
  expect(endpoint).toBeDefined();
  GRAPHQL_CLIENT = new GraphQLClient(endpoint, { 'x-api-key': apiKey });
});

afterAll(async () => {
  await cleanupStackAfterTest(BUCKET_NAME, STACK_NAME, cf);
});

test('Test next token with key', async () => {
  await createPost();

  const posts = await listPosts();
  expect(posts.data).toBeDefined();
  expect(posts.data.listPosts.items).toHaveLength(1);
  expect(posts.data.listPosts.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        awsDateTime: '2007-04-05T14:30:34Z',
        awsDateValue: '2016-01-29',
        awsEmailValue: 'local-part@domain-part',
        awsIPAddressValue1: '123.12.34.56',
        awsIPAddressValue2: '1a2b:3c4b::1234:4567',
        awsJsonValue: '{"a":1,"b":3,"string":"234"}',
        awsPhoneValue: '+41 44 668 18 00',
        awsTimeValue: '12:00:34Z',
        awsTimestampValue: 545345345,
        awsURLValue: 'https://www.amazon.com/dp/B000NZW3KC/',
        booleanValue: true,
        enumValue: 'RANDOM',
        floatValue: 123456.34565,
        intVal: 10002000,
        stringValue: 'hello world',
      }),
    ]),
  );
});

async function createPost() {
  return await GRAPHQL_CLIENT.query(
    `mutation CreatePost {
        createPost(input: {}) {
          id
        }
    }`,
  );
}

async function listPosts() {
  return await GRAPHQL_CLIENT.query(
    `query ListPosts {
      listPosts {
        items {
          stringValue
          intVal
          floatValue
          enumValue
          booleanValue
          awsURLValue
          awsTimestampValue
          awsTimeValue
          awsPhoneValue
          awsIPAddressValue2
          awsJsonValue
          awsIPAddressValue1
          awsEmailValue
          awsDateValue
          awsDateTime
        }
      }
    }`,
  );
}
