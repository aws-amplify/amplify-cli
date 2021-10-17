import { ResourceConstants } from 'graphql-transformer-common';
import { GraphQLTransform, gql } from 'graphql-transformer-core';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { FunctionTransformer } from 'graphql-function-transformer';
import { ModelAuthTransformer } from 'graphql-auth-transformer';
import { CloudFormationClient } from '../CloudFormationClient';
import { Output } from 'aws-sdk/clients/cloudformation';
import { default as moment } from 'moment';
import { cleanupStackAfterTest, deploy } from '../deployNestedStacks';
import { S3Client } from '../S3Client';
import { default as S3 } from 'aws-sdk/clients/s3';
import { LambdaHelper } from '../LambdaHelper';
import { IAMHelper } from '../IAMHelper';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import AWS from 'aws-sdk';
import { createUserPool, createUserPoolClient, configureAmplify, signupUser, authenticateUser } from '../cognitoUtils';
import { default as CognitoClient } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import Role from 'cloudform-types/types/iam/role';
import UserPoolClient from 'cloudform-types/types/cognito/userPoolClient';
import IdentityPool from 'cloudform-types/types/cognito/identityPool';
import IdentityPoolRoleAttachment from 'cloudform-types/types/cognito/identityPoolRoleAttachment';
import { Auth } from 'aws-amplify';
import 'isomorphic-fetch';

// to deal with bug in cognito-identity-js
(global as any).fetch = require('node-fetch');

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
// To overcome of the way of how AmplifyJS picks up currentUserCredentials
const anyAWS = AWS as any;

if (anyAWS && anyAWS.config && anyAWS.config.credentials) {
  delete anyAWS.config.credentials;
}

jest.setTimeout(2000000);

const REGION = 'us-west-2';
const cf = new CloudFormationClient(REGION);
const customS3Client = new S3Client(REGION);
const awsS3Client = new S3({ region: REGION });

const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `FunctionTransformerTests-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `appsync-function-transformer-test-bucket-${BUILD_TIMESTAMP}`;
const LOCAL_FS_BUILD_DIR = '/tmp/nonmodel_auth_function_transformer_tests/';
const S3_ROOT_DIR_KEY = 'deployments';
const ECHO_FUNCTION_NAME = `long-prefix-e2e-test-functions-echo-dev-${BUILD_TIMESTAMP}`;
const LAMBDA_EXECUTION_ROLE_NAME = `amplify_e2e_tests_lambda_basic_${BUILD_TIMESTAMP}`;
const LAMBDA_EXECUTION_POLICY_NAME = `amplify_e2e_tests_lambda_basic_access_${BUILD_TIMESTAMP}`;
let LAMBDA_EXECUTION_POLICY_ARN = '';
const AUTH_ROLE_NAME = `${STACK_NAME}-authRole`;
const UNAUTH_ROLE_NAME = `${STACK_NAME}-unauthRole`;
const IDENTITY_POOL_NAME = `NonModelAuthFunctionTest_${BUILD_TIMESTAMP}_identity_pool`;
const USER_POOL_CLIENTWEB_NAME = `nofuncauth_${BUILD_TIMESTAMP}_clientweb`;
const USER_POOL_CLIENT_NAME = `nofuncauth_${BUILD_TIMESTAMP}_client`;

let USER_POOL_AUTH_CLIENT: AWSAppSyncClient<any> = undefined;
let IAM_UNAUTHCLIENT: AWSAppSyncClient<any> = undefined;

let USER_POOL_ID = undefined;

const USERNAME1 = 'user1@test.com';

const TMP_PASSWORD = 'Password123!';
const REAL_PASSWORD = 'Password1234!';

const cognitoClient = new CognitoClient({ apiVersion: '2016-04-19', region: REGION });

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
        echo(msg: String!): String! @function(name: "${ECHO_FUNCTION_NAME}") @auth (rules: [{ allow: private, provider: iam }])
    }
    `;
  try {
    await awsS3Client.createBucket({ Bucket: BUCKET_NAME }).promise();
  } catch (e) {
    console.warn(`Could not create bucket: ${e}`);
  }
  const userPoolResponse = await createUserPool(cognitoClient, `UserPool${STACK_NAME}`);
  USER_POOL_ID = userPoolResponse.UserPool.Id;
  const userPoolClientResponse = await createUserPoolClient(cognitoClient, USER_POOL_ID, `UserPool${STACK_NAME}`);
  const userPoolClientId = userPoolClientResponse.UserPoolClient.ClientId;

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
  const transformer = new GraphQLTransform({
    featureFlags,
    transformers: [
      new DynamoDBModelTransformer(),
      new FunctionTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'AMAZON_COGNITO_USER_POOLS',
          },
          additionalAuthenticationProviders: [
            {
              authenticationType: 'AWS_IAM',
            },
          ],
        },
      }),
    ],
  });
  const out = transformer.transform(validSchema);

  const authRole = new Role({
    RoleName: AUTH_ROLE_NAME,
    AssumeRolePolicyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: '',
          Effect: 'Allow',
          Principal: {
            Federated: 'cognito-identity.amazonaws.com',
          },
          Action: 'sts:AssumeRoleWithWebIdentity',
          Condition: {
            'ForAnyValue:StringLike': {
              'cognito-identity.amazonaws.com:amr': 'authenticated',
            },
          },
        },
      ],
    },
  });

  const unauthRole = new Role({
    RoleName: UNAUTH_ROLE_NAME,
    AssumeRolePolicyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: '',
          Effect: 'Allow',
          Principal: {
            Federated: 'cognito-identity.amazonaws.com',
          },
          Action: 'sts:AssumeRoleWithWebIdentity',
          Condition: {
            'ForAnyValue:StringLike': {
              'cognito-identity.amazonaws.com:amr': 'unauthenticated',
            },
          },
        },
      ],
    },
    Policies: [
      new Role.Policy({
        PolicyName: 'appsync-unauthrole-policy',
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['appsync:GraphQL'],
              Resource: [
                {
                  'Fn::Join': [
                    '',
                    [
                      'arn:aws:appsync:',
                      { Ref: 'AWS::Region' },
                      ':',
                      { Ref: 'AWS::AccountId' },
                      ':apis/',
                      {
                        'Fn::GetAtt': ['GraphQLAPI', 'ApiId'],
                      },
                      '/*',
                    ],
                  ],
                },
              ],
            },
          ],
        },
      }),
    ],
  });

  const identityPool = new IdentityPool({
    IdentityPoolName: IDENTITY_POOL_NAME,
    CognitoIdentityProviders: [
      {
        ClientId: {
          Ref: 'UserPoolClient',
        },
        ProviderName: {
          'Fn::Sub': [
            'cognito-idp.${region}.amazonaws.com/${client}',
            {
              region: {
                Ref: 'AWS::Region',
              },
              client: USER_POOL_ID,
            },
          ],
        },
      } as unknown,
      {
        ClientId: {
          Ref: 'UserPoolClientWeb',
        },
        ProviderName: {
          'Fn::Sub': [
            'cognito-idp.${region}.amazonaws.com/${client}',
            {
              region: {
                Ref: 'AWS::Region',
              },
              client: USER_POOL_ID,
            },
          ],
        },
      } as unknown,
    ],
    AllowUnauthenticatedIdentities: true,
  });

  const identityPoolRoleMap = new IdentityPoolRoleAttachment({
    IdentityPoolId: { Ref: 'IdentityPool' } as unknown as string,
    Roles: {
      unauthenticated: { 'Fn::GetAtt': ['UnauthRole', 'Arn'] },
      authenticated: { 'Fn::GetAtt': ['AuthRole', 'Arn'] },
    },
  });

  const userPoolClientWeb = new UserPoolClient({
    ClientName: USER_POOL_CLIENTWEB_NAME,
    RefreshTokenValidity: 30,
    UserPoolId: USER_POOL_ID,
  });

  const userPoolClient = new UserPoolClient({
    ClientName: USER_POOL_CLIENT_NAME,
    GenerateSecret: true,
    RefreshTokenValidity: 30,
    UserPoolId: USER_POOL_ID,
  });

  out.rootStack.Resources.IdentityPool = identityPool;
  out.rootStack.Resources.IdentityPoolRoleMap = identityPoolRoleMap;
  out.rootStack.Resources.UserPoolClientWeb = userPoolClientWeb;
  out.rootStack.Resources.UserPoolClient = userPoolClient;
  out.rootStack.Outputs.IdentityPoolId = { Value: { Ref: 'IdentityPool' } };
  out.rootStack.Outputs.IdentityPoolName = { Value: { 'Fn::GetAtt': ['IdentityPool', 'Name'] } };

  out.rootStack.Resources.AuthRole = authRole;
  out.rootStack.Outputs.AuthRoleArn = { Value: { 'Fn::GetAtt': ['AuthRole', 'Arn'] } };
  out.rootStack.Resources.UnauthRole = unauthRole;
  out.rootStack.Outputs.UnauthRoleArn = { Value: { 'Fn::GetAtt': ['UnauthRole', 'Arn'] } };

  // Since we're doing the policy here we've to remove the transformer generated artifacts from
  // the generated stack.
  const maxPolicyCount = 10;
  for (let i = 0; i < maxPolicyCount; i++) {
    const paddedIndex = `${i + 1}`.padStart(2, '0');
    const authResourceName = `${ResourceConstants.RESOURCES.AuthRolePolicy}${paddedIndex}`;
    const unauthResourceName = `${ResourceConstants.RESOURCES.UnauthRolePolicy}${paddedIndex}`;

    if (out.rootStack.Resources[authResourceName]) {
      delete out.rootStack.Resources[authResourceName];
    }

    if (out.rootStack.Resources[unauthResourceName]) {
      delete out.rootStack.Resources[unauthResourceName];
    }
  }

  delete out.rootStack.Parameters.authRoleName;
  delete out.rootStack.Parameters.unauthRoleName;

  for (const key of Object.keys(out.rootStack.Resources)) {
    if (
      out.rootStack.Resources[key].Properties &&
      out.rootStack.Resources[key].Properties.Parameters &&
      out.rootStack.Resources[key].Properties.Parameters.unauthRoleName
    ) {
      delete out.rootStack.Resources[key].Properties.Parameters.unauthRoleName;
    }

    if (
      out.rootStack.Resources[key].Properties &&
      out.rootStack.Resources[key].Properties.Parameters &&
      out.rootStack.Resources[key].Properties.Parameters.authRoleName
    ) {
      delete out.rootStack.Resources[key].Properties.Parameters.authRoleName;
    }
  }

  for (const stackKey of Object.keys(out.stacks)) {
    const stack = out.stacks[stackKey];

    for (const key of Object.keys(stack.Resources)) {
      if (stack.Parameters && stack.Parameters.unauthRoleName) {
        delete stack.Parameters.unauthRoleName;
      }
      if (stack.Parameters && stack.Parameters.authRoleName) {
        delete stack.Parameters.authRoleName;
      }
      if (
        stack.Resources[key].Properties &&
        stack.Resources[key].Properties.Parameters &&
        stack.Resources[key].Properties.Parameters.unauthRoleName
      ) {
        delete stack.Resources[key].Properties.Parameters.unauthRoleName;
      }
      if (
        stack.Resources[key].Properties &&
        stack.Resources[key].Properties.Parameters &&
        stack.Resources[key].Properties.Parameters.authRoleName
      ) {
        delete stack.Resources[key].Properties.Parameters.authRoleName;
      }
    }
  }

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
  const endpoint = getApiEndpoint(finishedStack.Outputs);
  expect(endpoint).toBeDefined();

  const getIdentityPoolId = outputValueSelector('IdentityPoolId');
  const identityPoolId = getIdentityPoolId(finishedStack.Outputs);
  expect(identityPoolId).toBeTruthy();

  // Verify we have all the details
  expect(USER_POOL_ID).toBeTruthy();
  expect(userPoolClientId).toBeTruthy();

  // Configure Amplify, create users, and sign in.
  configureAmplify(USER_POOL_ID, userPoolClientId, identityPoolId);

  const unauthCredentials = await Auth.currentCredentials();

  IAM_UNAUTHCLIENT = new AWSAppSyncClient({
    url: endpoint,
    region: REGION,
    auth: {
      type: AUTH_TYPE.AWS_IAM,
      credentials: {
        accessKeyId: unauthCredentials.accessKeyId,
        secretAccessKey: unauthCredentials.secretAccessKey,
        sessionToken: unauthCredentials.sessionToken,
      },
    },
    offlineConfig: {
      keyPrefix: 'iam',
    },
    disableOffline: true,
  });

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
});

afterAll(async () => {
  await cleanupStackAfterTest(BUCKET_NAME, STACK_NAME, cf, { cognitoClient, userPoolId: USER_POOL_ID });

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

  const response = await IAM_UNAUTHCLIENT.query<{ echo: string }>({
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
