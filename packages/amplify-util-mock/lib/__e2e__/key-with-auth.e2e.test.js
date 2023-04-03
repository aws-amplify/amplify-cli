"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_auth_transformer_1 = require("graphql-auth-transformer");
const graphql_dynamodb_transformer_1 = require("graphql-dynamodb-transformer");
const graphql_key_transformer_1 = require("graphql-key-transformer");
const graphql_transformer_core_1 = require("graphql-transformer-core");
const cognito_utils_1 = require("./utils/cognito-utils");
const graphql_client_1 = require("./utils/graphql-client");
const index_1 = require("./utils/index");
require("isomorphic-fetch");
jest.setTimeout(2000000);
let GRAPHQL_ENDPOINT = undefined;
let ddbEmulator = null;
let dbPath = null;
let server;
let GRAPHQL_CLIENT_1 = undefined;
let GRAPHQL_CLIENT_2 = undefined;
let GRAPHQL_CLIENT_3 = undefined;
let USER_POOL_ID = 'fake_user_pool';
const USERNAME1 = 'user1@test.com';
const USERNAME2 = 'user2@test.com';
const USERNAME3 = 'user3@test.com';
const ADMIN_GROUP_NAME = 'Admin';
const DEVS_GROUP_NAME = 'Devs';
const PARTICIPANT_GROUP_NAME = 'Participant';
beforeAll(async () => {
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
    const transformer = new graphql_transformer_core_1.GraphQLTransform({
        transformers: [
            new graphql_dynamodb_transformer_1.DynamoDBModelTransformer(),
            new graphql_key_transformer_1.KeyTransformer(),
            new graphql_auth_transformer_1.ModelAuthTransformer({
                authConfig: {
                    defaultAuthentication: {
                        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
                    },
                    additionalAuthenticationProviders: [],
                },
            }),
        ],
        featureFlags: {
            getBoolean: (name) => (name === 'improvePluralization' ? true : false),
        },
    });
    try {
        const out = transformer.transform(validSchema);
        let ddbClient;
        ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await (0, index_1.launchDDBLocal)());
        const result = await (0, index_1.deploy)(out, ddbClient);
        server = result.simulator;
        GRAPHQL_ENDPOINT = server.url + '/graphql';
        (0, index_1.logDebug)(`Using graphql url: ${GRAPHQL_ENDPOINT}`);
        expect(GRAPHQL_ENDPOINT).toBeTruthy();
        const idToken = (0, cognito_utils_1.signUpAddToGroupAndGetJwtToken)(USER_POOL_ID, USERNAME1, USERNAME1, [
            ADMIN_GROUP_NAME,
            PARTICIPANT_GROUP_NAME,
            PARTICIPANT_GROUP_NAME,
        ]);
        GRAPHQL_CLIENT_1 = new graphql_client_1.GraphQLClient(GRAPHQL_ENDPOINT, {
            Authorization: idToken,
        });
        const idToken2 = (0, cognito_utils_1.signUpAddToGroupAndGetJwtToken)(USER_POOL_ID, USERNAME2, USERNAME2, [DEVS_GROUP_NAME]);
        GRAPHQL_CLIENT_2 = new graphql_client_1.GraphQLClient(GRAPHQL_ENDPOINT, {
            Authorization: idToken2,
        });
        const idToken3 = (0, cognito_utils_1.signUpAddToGroupAndGetJwtToken)(USER_POOL_ID, USERNAME3, USERNAME3, []);
        GRAPHQL_CLIENT_3 = new graphql_client_1.GraphQLClient(GRAPHQL_ENDPOINT, {
            Authorization: idToken3,
        });
        await new Promise((res) => setTimeout(() => res(), 5000));
    }
    catch (e) {
        console.error(e);
        expect(true).toEqual(false);
    }
});
afterAll(async () => {
    try {
        if (server) {
            await server.stop();
        }
        await (0, index_1.terminateDDB)(ddbEmulator, dbPath);
    }
    catch (e) {
        console.error(e);
        expect(true).toEqual(false);
    }
});
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
async function createOrder(client, customerEmail, orderId) {
    const result = await client.query(`mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
            customerEmail
            orderId
            createdAt
        }
    }`, {
        input: { customerEmail, orderId },
    });
    (0, index_1.logDebug)(JSON.stringify(result, null, 4));
    return result;
}
async function updateOrder(client, customerEmail, orderId) {
    const result = await client.query(`mutation UpdateOrder($input: UpdateOrderInput!) {
        updateOrder(input: $input) {
            customerEmail
            orderId
            createdAt
        }
    }`, {
        input: { customerEmail, orderId },
    });
    (0, index_1.logDebug)(JSON.stringify(result, null, 4));
    return result;
}
async function deleteOrder(client, customerEmail, orderId) {
    const result = await client.query(`mutation DeleteOrder($input: DeleteOrderInput!) {
        deleteOrder(input: $input) {
            customerEmail
            orderId
            createdAt
        }
    }`, {
        input: { customerEmail, orderId },
    });
    (0, index_1.logDebug)(JSON.stringify(result, null, 4));
    return result;
}
async function getOrder(client, customerEmail, orderId) {
    const result = await client.query(`query GetOrder($customerEmail: String!, $orderId: String!) {
        getOrder(customerEmail: $customerEmail, orderId: $orderId) {
            customerEmail
            orderId
            createdAt
        }
    }`, { customerEmail, orderId });
    (0, index_1.logDebug)(JSON.stringify(result, null, 4));
    return result;
}
async function listOrders(client, customerEmail, orderId) {
    const result = await client.query(`query ListOrder($customerEmail: String, $orderId: ModelStringKeyConditionInput) {
        listOrders(customerEmail: $customerEmail, orderId: $orderId) {
            items {
                customerEmail
                orderId
                createdAt
            }
            nextToken
        }
    }`, { customerEmail, orderId });
    (0, index_1.logDebug)(JSON.stringify(result, null, 4));
    return result;
}
async function ordersByOrderId(client, orderId) {
    const result = await client.query(`query OrdersByOrderId($orderId: String!) {
        ordersByOrderId(orderId: $orderId) {
            items {
                customerEmail
                orderId
                createdAt
            }
            nextToken
        }
    }`, { orderId });
    (0, index_1.logDebug)(JSON.stringify(result, null, 4));
    return result;
}
//# sourceMappingURL=key-with-auth.e2e.test.js.map