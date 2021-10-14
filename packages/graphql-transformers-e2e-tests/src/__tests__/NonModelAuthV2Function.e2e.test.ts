import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { FunctionTransformer } from '@aws-amplify/graphql-function-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { Auth } from 'aws-amplify';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import { CognitoIdentity } from 'aws-sdk';
import { Output } from 'aws-sdk/clients/cloudformation';
import { default as CognitoClient } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { default as S3 } from 'aws-sdk/clients/s3';
import { ResourceConstants } from 'graphql-transformer-common';
import gql from 'graphql-tag';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import 'isomorphic-fetch';
import { default as moment } from 'moment';
import { CloudFormationClient } from '../CloudFormationClient';
import { configureAmplify, createIdentityPool, createUserPool, createUserPoolClient, signupUser, authenticateUser } from '../cognitoUtils';
import { cleanupStackAfterTest, deploy } from '../deployNestedStacks';
import { IAMHelper } from '../IAMHelper';
import { LambdaHelper } from '../LambdaHelper';
import { S3Client } from '../S3Client';

// to deal with bug in cognito-identity-js
(global as any).fetch = require('node-fetch');

jest.setTimeout(2000000);

const REGION = 'us-west-2';
const cf = new CloudFormationClient(REGION);
const identityClient = new CognitoIdentity({ apiVersion: '2014-06-30', region: REGION });
const cognitoClient = new CognitoClient({ apiVersion: '2016-04-19', region: REGION });
const customS3Client = new S3Client(REGION);
const awsS3Client = new S3({ region: REGION });
const iamHelper = new IAMHelper(REGION);

const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `FunctionTransformerTestsV2-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `appsync-function-v2-transformer-test-bucket-${BUILD_TIMESTAMP}`;
const LOCAL_FS_BUILD_DIR = '/tmp/nonmodel_auth_function_v2_transformer_tests/';
const S3_ROOT_DIR_KEY = 'deployments';
const ECHO_FUNCTION_NAME = `long-prefix-e2e-test-functions-echo-dev-${BUILD_TIMESTAMP}`;
const LAMBDA_EXECUTION_ROLE_NAME = `amplify_e2e_tests_lambda_basic_${BUILD_TIMESTAMP}`;
const LAMBDA_EXECUTION_POLICY_NAME = `amplify_e2e_tests_lambda_basic_access_${BUILD_TIMESTAMP}`;
let LAMBDA_EXECUTION_POLICY_ARN = '';
const AUTH_ROLE_NAME = `${STACK_NAME}-authRole`;
const UNAUTH_ROLE_NAME = `${STACK_NAME}-unauthRole`;
let IAM_AUTH_CLIENT: AWSAppSyncClient<any> = undefined;
let USER_POOL_AUTH_CLIENT: AWSAppSyncClient<any> = undefined;
let USER_POOL_ID: string;
let IDENTITY_POOL_ID: string;
let GRAPHQL_ENDPOINT: string;

const USERNAME1 = 'user1@test.com';

const TMP_PASSWORD = 'Password123!';
const REAL_PASSWORD = 'Password1234!';

const LAMBDA_HELPER = new LambdaHelper();
const IAM_HELPER = new IAMHelper();

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}

beforeAll(async () => {
  try {
    const role = await IAM_HELPER.createLambdaExecutionRole(LAMBDA_EXECUTION_ROLE_NAME);
    await wait(5000);
    const policy = await IAM_HELPER.createLambdaExecutionPolicy(LAMBDA_EXECUTION_POLICY_NAME);
    await wait(5000);
    LAMBDA_EXECUTION_POLICY_ARN = policy.Policy.Arn;
    await IAM_HELPER.attachLambdaExecutionPolicy(policy.Policy.Arn, role.Role.RoleName);
    await wait(10000);
    await LAMBDA_HELPER.createFunction(ECHO_FUNCTION_NAME, role.Role.Arn, 'echoResolverFunction');
  } catch (e) {
    console.warn(`Could not setup function: ${e}`);
  }

  const validSchema = `
    type Query {
        echo(msg: String!): String! @function(name: "${ECHO_FUNCTION_NAME}") @auth (rules: [{ allow: private, provider: iam }])
    }
  `;

  try {
    await awsS3Client.createBucket({ Bucket: BUCKET_NAME }).promise();
  } catch (e) {
    console.warn(`Could not create bucket: ${e}`);
  }

  const transformer = new GraphQLTransform({
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [
        {
          authenticationType: 'API_KEY',
          apiKeyConfig: {
            description: 'E2E Test API Key',
            apiKeyExpirationDays: 300,
          },
        },
        {
          authenticationType: 'AWS_IAM',
        },
      ],
    },
    transformers: [
      new ModelTransformer(),
      new FunctionTransformer(),
      new AuthTransformer({
        addAwsIamAuthInOutputSchema: false,
      }),
    ],
  });
  const out = transformer.transform(validSchema);

  // create userpool
  const userPoolResponse = await createUserPool(cognitoClient, `UserPool${STACK_NAME}`);
  USER_POOL_ID = userPoolResponse.UserPool.Id;
  const userPoolClientResponse = await createUserPoolClient(cognitoClient, USER_POOL_ID, `UserPool${STACK_NAME}`);
  const userPoolClientId = userPoolClientResponse.UserPoolClient.ClientId;
  // create auth and unauth roles
  const roles = await iamHelper.createRoles(AUTH_ROLE_NAME, UNAUTH_ROLE_NAME);
  // create identity pool
  IDENTITY_POOL_ID = await createIdentityPool(identityClient, `IdentityPool${STACK_NAME}`, {
    authRoleArn: roles.authRole.Arn,
    unauthRoleArn: roles.unauthRole.Arn,
    providerName: `cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`,
    clientId: userPoolClientId,
  });

  const finishedStack = await deploy(
    customS3Client,
    cf,
    STACK_NAME,
    out,
    { AuthCognitoUserPoolId: USER_POOL_ID, authRoleName: roles.authRole.RoleName, unauthRoleName: roles.unauthRole.RoleName },
    LOCAL_FS_BUILD_DIR,
    BUCKET_NAME,
    S3_ROOT_DIR_KEY,
    BUILD_TIMESTAMP,
  );

  // Arbitrary wait to make sure everything is ready.
  await cf.wait(5, () => Promise.resolve());
  expect(finishedStack).toBeDefined();
  const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
  const endpoint = getApiEndpoint(finishedStack.Outputs);
  expect(endpoint).toBeDefined();
  GRAPHQL_ENDPOINT = getApiEndpoint(finishedStack.Outputs);
  expect(GRAPHQL_ENDPOINT).toBeTruthy();

  // Verify we have all the details
  expect(USER_POOL_ID).toBeTruthy();
  expect(userPoolClientId).toBeTruthy();

  // Configure Amplify, create users, and sign in.
  configureAmplify(USER_POOL_ID, userPoolClientId, IDENTITY_POOL_ID);

  await signupUser(USER_POOL_ID, USERNAME1, TMP_PASSWORD);
  const authRes = await authenticateUser(USERNAME1, TMP_PASSWORD, REAL_PASSWORD);
  const idToken = authRes.getIdToken().getJwtToken();

  USER_POOL_AUTH_CLIENT = new AWSAppSyncClient({
    url: endpoint,
    region: REGION,
    auth: {
      type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
      jwtToken: () => idToken,
    },
    offlineConfig: {
      keyPrefix: 'userPools',
    },
    disableOffline: true,
  });

  await Auth.signIn(USERNAME1, REAL_PASSWORD);
  const authCredentials = await Auth.currentCredentials();
  IAM_AUTH_CLIENT = new AWSAppSyncClient({
    url: GRAPHQL_ENDPOINT,
    region: REGION,
    auth: {
      type: AUTH_TYPE.AWS_IAM,
      credentials: authCredentials,
    },
    disableOffline: true,
  });
});

afterAll(async () => {
  await cleanupStackAfterTest(
    BUCKET_NAME,
    STACK_NAME,
    cf,
    { cognitoClient, userPoolId: USER_POOL_ID },
    { identityClient, identityPoolId: IDENTITY_POOL_ID },
  );

  try {
    await IAM_HELPER.deleteRole(AUTH_ROLE_NAME);
  } catch (e) {
    console.warn(`Error during auth role cleanup ${e}`);
  }
  try {
    await IAM_HELPER.deleteRole(UNAUTH_ROLE_NAME);
  } catch (e) {
    console.warn(`Error during unauth role cleanup ${e}`);
  }

  try {
    await LAMBDA_HELPER.deleteFunction(ECHO_FUNCTION_NAME);
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
test('Test calling echo function as a user via IAM', async () => {
  const query = gql`
    query {
      echo(msg: "Hello")
    }
  `;

  const response = await IAM_AUTH_CLIENT.query<{ echo: string }>({
    query,
    fetchPolicy: 'no-cache',
  });

  expect(response.data.echo).toEqual('Hello');
});

function wait(ms: number) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}
