import { IndexTransformer, PrimaryKeyTransformer } from '@aws-amplify/graphql-index-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { ResourceConstants } from 'graphql-transformer-common';
import { CloudFormationClient } from '../CloudFormationClient';
import { Output } from 'aws-sdk/clients/cloudformation';
import { GraphQLClient } from '../GraphQLClient';
import { default as moment } from 'moment';
import { cleanupStackAfterTest, deploy } from '../deployNestedStacks';
import { S3Client } from '../S3Client';
import { S3, CognitoIdentityServiceProvider as CognitoClient } from 'aws-sdk';
import {
  addUserToGroup,
  authenticateUser,
  configureAmplify,
  createGroup,
  createUserPool,
  createUserPoolClient,
  signupUser,
} from '../cognitoUtils';

jest.setTimeout(2000000);

const AWS_REGION = 'us-west-2';

const cf = new CloudFormationClient(AWS_REGION);
const customS3Client = new S3Client(AWS_REGION);
const awsS3Client = new S3({ region: AWS_REGION });
const cognitoClient = new CognitoClient({ apiVersion: '2016-04-19', region: AWS_REGION });
const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `IndexAuthTransformerTests-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `appsync-auth-index-transformer-test-bucket-${BUILD_TIMESTAMP}`;
const LOCAL_FS_BUILD_DIR = '/tmp/index_with_auth_transformer_tests/';
const S3_ROOT_DIR_KEY = 'deployments';

let GRAPHQL_ENDPOINT = undefined;

/**
 * Client 1 is logged in and is a member of the Admin group.
 */
let GRAPHQL_CLIENT_1: GraphQLClient = undefined;

/**
 * Client 2 is logged in and is a member of the Devs group.
 */
let GRAPHQL_CLIENT_2: GraphQLClient = undefined;

/**
 * Client 3 is logged in and has no group memberships.
 */
let GRAPHQL_CLIENT_3: GraphQLClient = undefined;

let USER_POOL_ID = undefined;

const USERNAME1 = 'user1@test.com';
const USERNAME2 = 'user2@test.com';
const USERNAME3 = 'user3@test.com';
const TMP_PASSWORD = 'Password123!';
const REAL_PASSWORD = 'Password1234!';

const ADMIN_GROUP_NAME = 'Admin';
const DEVS_GROUP_NAME = 'Devs';
const PARTICIPANT_GROUP_NAME = 'Participant';
const WATCHER_GROUP_NAME = 'Watcher';

beforeAll(async () => {
  const validSchema = /* GraphQL */ `
    type Order @model @auth(rules: [{ allow: owner, ownerField: "customerEmail" }, { allow: groups, groups: ["Admin"] }]) {
      customerEmail: String! @primaryKey(sortKeyFields: ["orderId"])
      createdAt: AWSDateTime
      orderId: String! @index(name: "GSI", queryField: "ordersByOrderId")
    }
    type FamilyMember
      @model
      @auth(
        rules: [
          { allow: groups, groups: ["Admin"] }
          { allow: owner, ownerField: "parent", operations: [read] }
          { allow: owner, ownerField: "child", operations: [read] }
        ]
      ) {
      parent: ID! @primaryKey(sortKeyFields: ["child"]) @index(name: "byParent", queryField: "byParent")
      child: ID! @index(name: "byChild", queryField: "byChild")
      createdAt: AWSDateTime
      updatedAt: AWSDateTime
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

  const transformer = new GraphQLTransform({
    featureFlags: {
      getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
        if (name === 'secondaryKeyAsGSI') {
          return true;
        }
        if (name === 'useSubUsernameForDefaultIdentityClaim') {
          return false;
        }
        return defaultValue;
      }),
      getNumber: jest.fn(),
      getObject: jest.fn(),
      getString: jest.fn(),
    },
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new IndexTransformer(), new AuthTransformer()],
  });
  const out = transformer.transform(validSchema);
  const finishedStack = await deploy(
    customS3Client,
    cf,
    STACK_NAME,
    out,
    { AuthCognitoUserPoolId: USER_POOL_ID },
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
  const apiKey = getApiKey(finishedStack.Outputs);
  GRAPHQL_ENDPOINT = getApiEndpoint(finishedStack.Outputs);
  expect(apiKey).not.toBeTruthy();

  // Verify we have all the details
  expect(GRAPHQL_ENDPOINT).toBeTruthy();
  expect(USER_POOL_ID).toBeTruthy();
  expect(userPoolClientId).toBeTruthy();

  // Configure Amplify, create users, and sign in.
  configureAmplify(USER_POOL_ID, userPoolClientId);

  await signupUser(USER_POOL_ID, USERNAME1, TMP_PASSWORD);
  await signupUser(USER_POOL_ID, USERNAME2, TMP_PASSWORD);
  await signupUser(USER_POOL_ID, USERNAME3, TMP_PASSWORD);
  await createGroup(USER_POOL_ID, ADMIN_GROUP_NAME);
  await createGroup(USER_POOL_ID, PARTICIPANT_GROUP_NAME);
  await createGroup(USER_POOL_ID, WATCHER_GROUP_NAME);
  await createGroup(USER_POOL_ID, DEVS_GROUP_NAME);
  await addUserToGroup(ADMIN_GROUP_NAME, USERNAME1, USER_POOL_ID);
  await addUserToGroup(PARTICIPANT_GROUP_NAME, USERNAME1, USER_POOL_ID);
  await addUserToGroup(WATCHER_GROUP_NAME, USERNAME1, USER_POOL_ID);
  await addUserToGroup(DEVS_GROUP_NAME, USERNAME2, USER_POOL_ID);
  const authResAfterGroup: any = await authenticateUser(USERNAME1, TMP_PASSWORD, REAL_PASSWORD);

  const idToken = authResAfterGroup.getIdToken().getJwtToken();
  GRAPHQL_CLIENT_1 = new GraphQLClient(GRAPHQL_ENDPOINT, { Authorization: idToken });

  const authRes2AfterGroup: any = await authenticateUser(USERNAME2, TMP_PASSWORD, REAL_PASSWORD);
  const idToken2 = authRes2AfterGroup.getIdToken().getJwtToken();
  GRAPHQL_CLIENT_2 = new GraphQLClient(GRAPHQL_ENDPOINT, { Authorization: idToken2 });

  const authRes3: any = await authenticateUser(USERNAME3, TMP_PASSWORD, REAL_PASSWORD);
  const idToken3 = authRes3.getIdToken().getJwtToken();
  GRAPHQL_CLIENT_3 = new GraphQLClient(GRAPHQL_ENDPOINT, { Authorization: idToken3 });
});

afterAll(async () => {
  await cleanupStackAfterTest(BUCKET_NAME, STACK_NAME, cf, { cognitoClient, userPoolId: USER_POOL_ID });
});

/**
 * Test queries below
 */

test('Test createOrder mutation as admin', async () => {
  const response = await createOrder(GRAPHQL_CLIENT_1, USERNAME2, 'order1');
  expect(response.data.createOrder.customerEmail).toBeDefined();
  expect(response.data.createOrder.orderId).toEqual('order1');
  expect(response.data.createOrder.createdAt).toBeDefined();
});

test('Test createOrder mutation as owner', async () => {
  const response = await createOrder(GRAPHQL_CLIENT_2, USERNAME2, 'order2');
  expect(response.data.createOrder.customerEmail).toBeDefined();
  expect(response.data.createOrder.orderId).toEqual('order2');
  expect(response.data.createOrder.createdAt).toBeDefined();
});

test('Test createOrder mutation as owner', async () => {
  const response = await createOrder(GRAPHQL_CLIENT_3, USERNAME2, 'order3');
  expect(response.data.createOrder).toBeNull();
  expect(response.errors).toHaveLength(1);
});

test('Test list orders as owner', async () => {
  await createOrder(GRAPHQL_CLIENT_3, USERNAME3, 'owned1');
  await createOrder(GRAPHQL_CLIENT_3, USERNAME3, 'owned2');
  const listResponse = await listOrders(GRAPHQL_CLIENT_3, USERNAME3, { beginsWith: 'owned' });
  expect(listResponse.data.listOrders.items).toHaveLength(2);
});

test('Test list orders as non owner', async () => {
  await createOrder(GRAPHQL_CLIENT_3, USERNAME3, 'unowned1');
  await createOrder(GRAPHQL_CLIENT_3, USERNAME3, 'unowned2');
  const listResponse = await listOrders(GRAPHQL_CLIENT_2, USERNAME3, { beginsWith: 'unowned' });
  expect(listResponse.data.listOrders).toBeNull();
  expect(listResponse.errors).toHaveLength(1);
});

test('Test get orders as owner', async () => {
  await createOrder(GRAPHQL_CLIENT_2, USERNAME2, 'myobj');
  const getResponse = await getOrder(GRAPHQL_CLIENT_2, USERNAME2, 'myobj');
  expect(getResponse.data.getOrder.orderId).toEqual('myobj');
});

test('Test get orders as non-owner', async () => {
  await createOrder(GRAPHQL_CLIENT_2, USERNAME2, 'notmyobj');
  const getResponse = await getOrder(GRAPHQL_CLIENT_3, USERNAME2, 'notmyobj');
  expect(getResponse.data.getOrder).toBeNull();
  expect(getResponse.errors).toHaveLength(1);
});

test('Test query orders as owner', async () => {
  await createOrder(GRAPHQL_CLIENT_3, USERNAME3, 'ownedby3a');
  const listResponse = await ordersByOrderId(GRAPHQL_CLIENT_3, 'ownedby3a');
  expect(listResponse.data.ordersByOrderId.items).toHaveLength(1);
});

test('Test query orders as non owner', async () => {
  await createOrder(GRAPHQL_CLIENT_3, USERNAME3, 'notownedby2a');
  const listResponse = await ordersByOrderId(GRAPHQL_CLIENT_2, 'notownedby2a');
  expect(listResponse.data.ordersByOrderId.items).toHaveLength(0);
});

test('listX with primaryKey', async () => {
  await createFamilyMember(GRAPHQL_CLIENT_1, USERNAME1, USERNAME2);
  await createFamilyMember(GRAPHQL_CLIENT_1, USERNAME2, 'no_name_user@test.com');
  let listResponse = await listFamilyMembers(GRAPHQL_CLIENT_2);
  expect(listResponse.data.listFamilyMembers.items).toHaveLength(2);
  listResponse = await listFamilyMembers(GRAPHQL_CLIENT_3);
  expect(listResponse.data.listFamilyMembers.items).toHaveLength(0);

  // should be able to see one record
  listResponse = await listFamilyMembers(GRAPHQL_CLIENT_2, { parent: USERNAME1 });
  const items = listResponse.data.listFamilyMembers.items;
  expect(items).toHaveLength(1);
  expect(items[0]).toEqual(
    expect.objectContaining({
      parent: USERNAME1,
      child: USERNAME2,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }),
  );
});

test('listX expect error when primaryKey and sortKeyField does not match auth conditions', async () => {
  await createFamilyMember(GRAPHQL_CLIENT_1, USERNAME1, USERNAME3);
  const listResponse = await listFamilyMembers(GRAPHQL_CLIENT_2, { parent: USERNAME1, child: { eq: USERNAME3 } });
  expect(listResponse.data.listFamilyMembers).toBeNull();
  expect(listResponse.errors).toHaveLength(1);
});

// helper functions
function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}

async function createFamilyMember(client: GraphQLClient, parent: string, child: string) {
  const result = await client.query(
    `mutation CreateFamilyMember(
      $input: CreateFamilyMemberInput!
      $condition: ModelFamilyMemberConditionInput
    ) {
      createFamilyMember(input: $input, condition: $condition) {
        parent
        child
        createdAt
        updatedAt
      }
    }`,
    { input: { parent, child } },
  );
  return result;
}

async function listFamilyMembers(client: GraphQLClient, args?: Record<string, any>) {
  const result = await client.query(
    `query ListFamilyMembers(
      $parent: ID
      $child: ModelIDKeyConditionInput
      $filter: ModelFamilyMemberFilterInput
      $limit: Int
      $nextToken: String
      $sortDirection: ModelSortDirection
    ) {
      listFamilyMembers(
        parent: $parent
        child: $child
        filter: $filter
        limit: $limit
        nextToken: $nextToken
        sortDirection: $sortDirection
      ) {
        items {
          parent
          child
          createdAt
          updatedAt
        }
        nextToken
      }
    }`,
    args,
  );
  return result;
}

async function createOrder(client: GraphQLClient, customerEmail: string, orderId: string) {
  const result = await client.query(
    `mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
            customerEmail
            orderId
            createdAt
        }
    }`,
    {
      input: { customerEmail, orderId },
    },
  );
  return result;
}

async function getOrder(client: GraphQLClient, customerEmail: string, orderId: string) {
  const result = await client.query(
    `query GetOrder($customerEmail: String!, $orderId: String!) {
        getOrder(customerEmail: $customerEmail, orderId: $orderId) {
            customerEmail
            orderId
            createdAt
        }
    }`,
    { customerEmail, orderId },
  );
  return result;
}

async function listOrders(client: GraphQLClient, customerEmail: string, orderId: { beginsWith: string }) {
  const result = await client.query(
    `query ListOrder($customerEmail: String, $orderId: ModelStringKeyConditionInput) {
        listOrders(customerEmail: $customerEmail, orderId: $orderId) {
            items {
                customerEmail
                orderId
                createdAt
            }
            nextToken
        }
    }`,
    { customerEmail, orderId },
  );
  return result;
}

async function ordersByOrderId(client: GraphQLClient, orderId: string) {
  const result = await client.query(
    `query OrdersByOrderId($orderId: String!) {
        ordersByOrderId(orderId: $orderId) {
            items {
                customerEmail
                orderId
                createdAt
            }
            nextToken
        }
    }`,
    { orderId },
  );
  return result;
}
