import { ModelAuthTransformer } from 'graphql-auth-transformer';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { KeyTransformer } from 'graphql-key-transformer';
import { GraphQLTransform } from 'graphql-transformer-core';
import { signUpAddToGroupAndGetJwtToken } from './utils/cognito-utils';
import { GraphQLClient } from './utils/graphql-client';
import { deploy, launchDDBLocal, logDebug, terminateDDB } from './utils/index';

// to deal with bug in cognito-identity-js
(global as any).fetch = require('node-fetch');

jest.setTimeout(2000000);

let GRAPHQL_ENDPOINT = undefined;
let ddbEmulator = null;
let dbPath = null;
let server;
/**
 * Client 1 is logged in and is a member of the Admin group.
 */
let GRAPHQL_CLIENT_1 = undefined;

/**
 * Client 2 is logged in and is a member of the Devs group.
 */
let GRAPHQL_CLIENT_2 = undefined;

/**
 * Client 3 is logged in and has no group memberships.
 */
let GRAPHQL_CLIENT_3 = undefined;

let USER_POOL_ID = 'fake_user_pool';

const USERNAME1 = 'user1@test.com';
const USERNAME2 = 'user2@test.com';
const USERNAME3 = 'user3@test.com';

const ADMIN_GROUP_NAME = 'Admin';
const DEVS_GROUP_NAME = 'Devs';
const PARTICIPANT_GROUP_NAME = 'Participant';

beforeAll(async () => {
  // Create a stack for the post model with auth enabled.
  const validSchema = `
    type Order
        @model
        @key(fields: ["customerEmail", "orderId"])
        @key(name: "GSI", fields: ["orderId"], queryField: "ordersByOrderId")
        @auth(rules: [{ allow: owner, ownerField: "customerEmail" }, { allow: groups, groups: ["Admin"] }])
    {
        customerEmail: String!
        createdAt: String
        orderId: String!
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new KeyTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'AMAZON_COGNITO_USER_POOLS',
          },
          additionalAuthenticationProviders: [],
        },
      }),
    ],
  });

  try {
    // Clean the bucket
    const out = transformer.transform(validSchema);

    let ddbClient;
    ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await launchDDBLocal());

    const result = await deploy(out, ddbClient);
    server = result.simulator;

    GRAPHQL_ENDPOINT = server.url + '/graphql';
    logDebug(`Using graphql url: ${GRAPHQL_ENDPOINT}`);

    // Verify we have all the details
    expect(GRAPHQL_ENDPOINT).toBeTruthy();

    const idToken = signUpAddToGroupAndGetJwtToken(USER_POOL_ID, USERNAME1, USERNAME1, [
      ADMIN_GROUP_NAME,
      PARTICIPANT_GROUP_NAME,
      PARTICIPANT_GROUP_NAME,
    ]);
    GRAPHQL_CLIENT_1 = new GraphQLClient(GRAPHQL_ENDPOINT, {
      Authorization: idToken,
    });

    const idToken2 = signUpAddToGroupAndGetJwtToken(USER_POOL_ID, USERNAME2, USERNAME2, [DEVS_GROUP_NAME]);
    GRAPHQL_CLIENT_2 = new GraphQLClient(GRAPHQL_ENDPOINT, {
      Authorization: idToken2,
    });

    const idToken3 = signUpAddToGroupAndGetJwtToken(USER_POOL_ID, USERNAME3, USERNAME3, []);
    GRAPHQL_CLIENT_3 = new GraphQLClient(GRAPHQL_ENDPOINT, {
      Authorization: idToken3,
    });

    // Wait for any propagation to avoid random
    // "The security token included in the request is invalid" errors
    await new Promise(res => setTimeout(() => res(), 5000));
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
  const listResponse = await listOrders(GRAPHQL_CLIENT_3, USERNAME3, {
    beginsWith: 'owned',
  });
  expect(listResponse.data.listOrders.items).toHaveLength(2);
});

test('Test list orders as non owner', async () => {
  await createOrder(GRAPHQL_CLIENT_3, USERNAME3, 'unowned1');
  await createOrder(GRAPHQL_CLIENT_3, USERNAME3, 'unowned2');
  const listResponse = await listOrders(GRAPHQL_CLIENT_2, USERNAME3, {
    beginsWith: 'unowned',
  });
  expect(listResponse.data.listOrders.items).toHaveLength(0);
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
    }
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function updateOrder(client: GraphQLClient, customerEmail: string, orderId: string) {
  const result = await client.query(
    `mutation UpdateOrder($input: UpdateOrderInput!) {
        updateOrder(input: $input) {
            customerEmail
            orderId
            createdAt
        }
    }`,
    {
      input: { customerEmail, orderId },
    }
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}

async function deleteOrder(client: GraphQLClient, customerEmail: string, orderId: string) {
  const result = await client.query(
    `mutation DeleteOrder($input: DeleteOrderInput!) {
        deleteOrder(input: $input) {
            customerEmail
            orderId
            createdAt
        }
    }`,
    {
      input: { customerEmail, orderId },
    }
  );
  logDebug(JSON.stringify(result, null, 4));
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
    { customerEmail, orderId }
  );
  logDebug(JSON.stringify(result, null, 4));
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
    { customerEmail, orderId }
  );
  logDebug(JSON.stringify(result, null, 4));
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
    { orderId }
  );
  logDebug(JSON.stringify(result, null, 4));
  return result;
}
