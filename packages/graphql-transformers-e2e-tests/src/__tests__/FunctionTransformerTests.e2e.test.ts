import { ResourceConstants } from 'graphql-transformer-common';
import { GraphQLTransform } from 'graphql-transformer-core';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { FunctionTransformer } from 'graphql-function-transformer';
import { ModelAuthTransformer } from 'graphql-auth-transformer';
import { CloudFormationClient } from '../CloudFormationClient';
import { Output } from 'aws-sdk/clients/cloudformation';
import { GraphQLClient } from '../GraphQLClient';
import { default as moment } from 'moment';
import { cleanupStackAfterTest, deploy } from '../deployNestedStacks';
import { S3Client } from '../S3Client';
import { default as S3 } from 'aws-sdk/clients/s3';
import { LambdaHelper } from '../LambdaHelper';
import { IAMHelper } from '../IAMHelper';

jest.setTimeout(2000000);

const cf = new CloudFormationClient('us-west-2');
const customS3Client = new S3Client('us-west-2');
const awsS3Client = new S3({ region: 'us-west-2' });

const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `FunctionTransformerTests-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `appsync-function-transformer-test-bucket-${BUILD_TIMESTAMP}`;
const LOCAL_FS_BUILD_DIR = '/tmp/function_transformer_tests/';
const S3_ROOT_DIR_KEY = 'deployments';
const ECHO_FUNCTION_NAME = `long-prefix-e2e-test-functions-echo-dev-${BUILD_TIMESTAMP}`;
const HELLO_FUNCTION_NAME = `long-prefix-e2e-test-functions-hello-${BUILD_TIMESTAMP}`;
const LAMBDA_EXECUTION_ROLE_NAME = `amplify_e2e_tests_lambda_basic_${BUILD_TIMESTAMP}`;
const LAMBDA_EXECUTION_POLICY_NAME = `amplify_e2e_tests_lambda_basic_access_${BUILD_TIMESTAMP}`;
let LAMBDA_EXECUTION_POLICY_ARN = '';

let GRAPHQL_CLIENT = undefined;

const LAMBDA_HELPER = new LambdaHelper();
const IAM_HELPER = new IAMHelper();

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}

beforeAll(async () => {
  const validSchema = `
    type Query {
        echo(msg: String!): Context @function(name: "${ECHO_FUNCTION_NAME}")
        e_cho(msg: String!): Context @function(name: "${ECHO_FUNCTION_NAME}")
        echoEnv(msg: String!): Context @function(name: "long-prefix-e2e-test-functions-echo-\${env}-${BUILD_TIMESTAMP}")
        duplicate(msg: String!): Context @function(name: "long-prefix-e2e-test-functions-echo-dev-${BUILD_TIMESTAMP}")
        pipeline(msg: String!): String
            @function(name: "${ECHO_FUNCTION_NAME}")
            @function(name: "${HELLO_FUNCTION_NAME}")
        pipelineReverse(msg: String!): Context
            @function(name: "${HELLO_FUNCTION_NAME}")
            @function(name: "${ECHO_FUNCTION_NAME}")
    }
    type Context {
        arguments: Arguments
        typeName: String
        fieldName: String
    }
    type Arguments {
        msg: String!
    }
    `;
  try {
    await awsS3Client.createBucket({ Bucket: BUCKET_NAME }).promise();
  } catch (e) {
    console.warn(`Could not create bucket: ${e}`);
    expect(true).toEqual(false);
  }
  try {
    const role = await IAM_HELPER.createLambdaExecutionRole(LAMBDA_EXECUTION_ROLE_NAME);
    await wait(5000);
    const policy = await IAM_HELPER.createLambdaExecutionPolicy(LAMBDA_EXECUTION_POLICY_NAME);
    await wait(5000);
    LAMBDA_EXECUTION_POLICY_ARN = policy.Policy.Arn;
    await IAM_HELPER.attachLambdaExecutionPolicy(policy.Policy.Arn, role.Role.RoleName);
    await wait(10000);
    await LAMBDA_HELPER.createFunction(ECHO_FUNCTION_NAME, role.Role.Arn, 'echoFunction');
    await LAMBDA_HELPER.createFunction(HELLO_FUNCTION_NAME, role.Role.Arn, 'hello');
  } catch (e) {
    console.warn(`Could not setup function: ${e}`);
    expect(true).toEqual(false);
  }
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new FunctionTransformer(),
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
  const out = transformer.transform(validSchema);
  const finishedStack = await deploy(
    customS3Client,
    cf,
    STACK_NAME,
    out,
    { CreateAPIKey: '1', env: 'dev' },
    LOCAL_FS_BUILD_DIR,
    BUCKET_NAME,
    S3_ROOT_DIR_KEY,
    BUILD_TIMESTAMP,
  );
  // Arbitrary wait to make sure everything is ready.
  await cf.wait(5, () => Promise.resolve());
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

  try {
    await LAMBDA_HELPER.deleteFunction(ECHO_FUNCTION_NAME);
  } catch (e) {
    console.warn(`Error during function cleanup: ${e}`);
  }
  try {
    await LAMBDA_HELPER.deleteFunction(HELLO_FUNCTION_NAME);
  } catch (e) {
    console.warn(`Error during function cleanup: ${e}`);
  }
  try {
    await IAM_HELPER.detachLambdaExecutionPolicy(LAMBDA_EXECUTION_POLICY_ARN, LAMBDA_EXECUTION_ROLE_NAME);
  } catch (e) {
    console.warn(`Error during policy dissociation: ${e}`);
  }
  try {
    await IAM_HELPER.deleteRole(LAMBDA_EXECUTION_ROLE_NAME);
  } catch (e) {
    console.warn(`Error during role cleanup: ${e}`);
  }
  try {
    await IAM_HELPER.deletePolicy(LAMBDA_EXECUTION_POLICY_ARN);
  } catch (e) {
    console.warn(`Error during policy cleanup: ${e}`);
  }
});

/**
 * Test queries below
 */
test('Test simple echo function', async () => {
  const response = await GRAPHQL_CLIENT.query(
    `query {
        echo(msg: "Hello") {
            arguments {
                msg
            }
            typeName
            fieldName
        }
    }`,
    {},
  );
  expect(response.data.echo.arguments.msg).toEqual('Hello');
  expect(response.data.echo.typeName).toEqual('Query');
  expect(response.data.echo.fieldName).toEqual('echo');
});

test('Test simple echoEnv function', async () => {
  const response = await GRAPHQL_CLIENT.query(
    `query {
        echoEnv(msg: "Hello") {
            arguments {
                msg
            }
            typeName
            fieldName
        }
    }`,
    {},
  );
  expect(response.data.echoEnv.arguments.msg).toEqual('Hello');
  expect(response.data.echoEnv.typeName).toEqual('Query');
  expect(response.data.echoEnv.fieldName).toEqual('echoEnv');
});

test('Test simple duplicate function', async () => {
  const response = await GRAPHQL_CLIENT.query(
    `query {
        duplicate(msg: "Hello") {
            arguments {
                msg
            }
            typeName
            fieldName
        }
    }`,
    {},
  );
  expect(response.data.duplicate.arguments.msg).toEqual('Hello');
  expect(response.data.duplicate.typeName).toEqual('Query');
  expect(response.data.duplicate.fieldName).toEqual('duplicate');
});

test('Test pipeline of @function(s)', async () => {
  const response = await GRAPHQL_CLIENT.query(
    `query {
        pipeline(msg: "IGNORED")
    }`,
    {},
  );
  expect(response.data.pipeline).toEqual('Hello, world!');
});

test('Test pipelineReverse of @function(s)', async () => {
  const response = await GRAPHQL_CLIENT.query(
    `query {
        pipelineReverse(msg: "Hello") {
            arguments {
                msg
            }
            typeName
            fieldName
        }
    }`,
    {},
  );
  expect(response.data.pipelineReverse.arguments.msg).toEqual('Hello');
  expect(response.data.pipelineReverse.typeName).toEqual('Query');
  expect(response.data.pipelineReverse.fieldName).toEqual('pipelineReverse');
});

function wait(ms: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}
