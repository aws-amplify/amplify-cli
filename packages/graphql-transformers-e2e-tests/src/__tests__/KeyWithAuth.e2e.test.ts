import Amplify, { Auth } from 'aws-amplify';
import { ResourceConstants } from 'graphql-transformer-common'
import GraphQLTransform from 'graphql-transformer-core'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'
import ModelAuthTransformer from 'graphql-auth-transformer'
import KeyTransformer from 'graphql-key-transformer'
import * as fs from 'fs'
import { CloudFormationClient } from '../CloudFormationClient'
import { Output } from 'aws-sdk/clients/cloudformation'
import * as CognitoClient from 'aws-sdk/clients/cognitoidentityserviceprovider'
import * as S3 from 'aws-sdk/clients/s3'
import { GraphQLClient } from '../GraphQLClient'
import { S3Client } from '../S3Client';
import * as path from 'path'
import { deploy } from '../deployNestedStacks'
import * as moment from 'moment';
import emptyBucket from '../emptyBucket';
import {
    createUserPool, createUserPoolClient, deleteUserPool,
    signupAndAuthenticateUser, createGroup, addUserToGroup,
    configureAmplify
 } from '../cognitoUtils';

// to deal with bug in cognito-identity-js
(global as any).fetch = require("node-fetch");

jest.setTimeout(2000000);

const cf = new CloudFormationClient('us-west-2')

const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss')
const STACK_NAME = `KeyWithAuth-${BUILD_TIMESTAMP}`
const BUCKET_NAME = `appsync-key-with-auth-test-bucket-${BUILD_TIMESTAMP}`
const LOCAL_FS_BUILD_DIR = '/tmp/key_auth_transform_tests/'
const S3_ROOT_DIR_KEY = 'deployments'

let GRAPHQL_ENDPOINT = undefined;

/**
 * Client 1 is logged in and is a member of the Admin group.
 */
let GRAPHQL_CLIENT_1 = undefined;

/**
 * Client 1 is logged in and is a member of the Admin group via an access token.
 */
let GRAPHQL_CLIENT_1_ACCESS = undefined;

/**
 * Client 2 is logged in and is a member of the Devs group.
 */
let GRAPHQL_CLIENT_2 = undefined;

/**
 * Client 3 is logged in and has no group memberships.
 */
let GRAPHQL_CLIENT_3 = undefined;

let USER_POOL_ID = undefined;

const USERNAME1 = 'user1@test.com'
const USERNAME2 = 'user2@test.com'
const USERNAME3 = 'user3@test.com'
const TMP_PASSWORD = 'Password123!'
const REAL_PASSWORD = 'Password1234!'

const ADMIN_GROUP_NAME = 'Admin';
const DEVS_GROUP_NAME = 'Devs';
const PARTICIPANT_GROUP_NAME = 'Participant';
const WATCHER_GROUP_NAME = 'Watcher';

const cognitoClient = new CognitoClient({ apiVersion: '2016-04-19', region: 'us-west-2' })
const customS3Client = new S3Client('us-west-2')
const awsS3Client = new S3({ region: 'us-west-2' })

function outputValueSelector(key: string) {
    return (outputs: Output[]) => {
        const output = outputs.find((o: Output) => o.OutputKey === key)
        return output ? output.OutputValue : null
    }
}

function deleteDirectory(directory: string) {
    const files = fs.readdirSync(directory)
    for (const file of files) {
        const contentPath = path.join(directory, file)
        if (fs.lstatSync(contentPath).isDirectory()) {
            deleteDirectory(contentPath)
            fs.rmdirSync(contentPath)
        } else {
            fs.unlinkSync(contentPath)
        }
    }
}

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
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new KeyTransformer(),
            new ModelAuthTransformer({ authMode: 'AMAZON_COGNITO_USER_POOLS' })
        ]
    })
    try {
        await awsS3Client.createBucket({Bucket: BUCKET_NAME}).promise()
    } catch (e) {
        console.error(`Failed to create bucket: ${e}`)
    }
    const userPoolResponse = await createUserPool(cognitoClient, `UserPool${STACK_NAME}`);
    USER_POOL_ID = userPoolResponse.UserPool.Id;
    const userPoolClientResponse = await createUserPoolClient(cognitoClient, USER_POOL_ID, `UserPool${STACK_NAME}`);
    const userPoolClientId = userPoolClientResponse.UserPoolClient.ClientId;
    try {
        // Clean the bucket
        const out = transformer.transform(validSchema)
        const finishedStack = await deploy(
            customS3Client, cf, STACK_NAME, out, { AuthCognitoUserPoolId: USER_POOL_ID }, LOCAL_FS_BUILD_DIR, BUCKET_NAME, S3_ROOT_DIR_KEY,
            BUILD_TIMESTAMP
        )
        expect(finishedStack).toBeDefined()
        const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput)
        const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput)
        GRAPHQL_ENDPOINT = getApiEndpoint(finishedStack.Outputs)
        console.log(`Using graphql url: ${GRAPHQL_ENDPOINT}`);

        const apiKey = getApiKey(finishedStack.Outputs)
        console.log(`API KEY: ${apiKey}`);
        expect(apiKey).not.toBeTruthy()

        // Verify we have all the details
        expect(GRAPHQL_ENDPOINT).toBeTruthy()
        expect(USER_POOL_ID).toBeTruthy()
        expect(userPoolClientId).toBeTruthy()

        // Configure Amplify, create users, and sign in.
        configureAmplify(USER_POOL_ID, userPoolClientId)

        const authRes: any = await signupAndAuthenticateUser(USER_POOL_ID, USERNAME1, TMP_PASSWORD, REAL_PASSWORD)
        const authRes2: any = await signupAndAuthenticateUser(USER_POOL_ID, USERNAME2, TMP_PASSWORD, REAL_PASSWORD)
        const authRes3: any = await signupAndAuthenticateUser(USER_POOL_ID, USERNAME3, TMP_PASSWORD, REAL_PASSWORD)

        await createGroup(USER_POOL_ID, ADMIN_GROUP_NAME)
        await createGroup(USER_POOL_ID, PARTICIPANT_GROUP_NAME)
        await createGroup(USER_POOL_ID, WATCHER_GROUP_NAME)
        await createGroup(USER_POOL_ID, DEVS_GROUP_NAME)
        await addUserToGroup(ADMIN_GROUP_NAME, USERNAME1, USER_POOL_ID)
        await addUserToGroup(PARTICIPANT_GROUP_NAME, USERNAME1, USER_POOL_ID)
        await addUserToGroup(WATCHER_GROUP_NAME, USERNAME1, USER_POOL_ID)
        await addUserToGroup(DEVS_GROUP_NAME, USERNAME2, USER_POOL_ID)
        const authResAfterGroup: any = await signupAndAuthenticateUser(USER_POOL_ID, USERNAME1, TMP_PASSWORD, REAL_PASSWORD)

        const idToken = authResAfterGroup.getIdToken().getJwtToken()
        GRAPHQL_CLIENT_1 = new GraphQLClient(GRAPHQL_ENDPOINT, { Authorization: idToken })

        const accessToken = authResAfterGroup.getAccessToken().getJwtToken()
        GRAPHQL_CLIENT_1_ACCESS = new GraphQLClient(GRAPHQL_ENDPOINT, { Authorization: accessToken })

        const authRes2AfterGroup: any = await signupAndAuthenticateUser(USER_POOL_ID, USERNAME2, TMP_PASSWORD, REAL_PASSWORD)
        const idToken2 = authRes2AfterGroup.getIdToken().getJwtToken()
        GRAPHQL_CLIENT_2 = new GraphQLClient(GRAPHQL_ENDPOINT, { Authorization: idToken2 })

        const idToken3 = authRes3.getIdToken().getJwtToken()
        GRAPHQL_CLIENT_3 = new GraphQLClient(GRAPHQL_ENDPOINT, { Authorization: idToken3 })

        // Wait for any propagation to avoid random
        // "The security token included in the request is invalid" errors
        await new Promise((res) => setTimeout(() => res(), 5000))
    } catch (e) {
        console.error(e)
        expect(true).toEqual(false)
    }
});


afterAll(async () => {
    try {
        console.log('Deleting stack ' + STACK_NAME)
        await cf.deleteStack(STACK_NAME)
        await deleteUserPool(cognitoClient, USER_POOL_ID)
        await cf.waitForStack(STACK_NAME)
        console.log('Successfully deleted stack ' + STACK_NAME)
    } catch (e) {
        if (e.code === 'ValidationError' && e.message === `Stack with id ${STACK_NAME} does not exist`) {
            // The stack was deleted. This is good.
            expect(true).toEqual(true)
            console.log('Successfully deleted stack ' + STACK_NAME)
        } else {
            console.error(e)
            expect(true).toEqual(false)
        }
    }
    try {
        await emptyBucket(BUCKET_NAME);
    } catch (e) {
        console.error(`Failed to empty S3 bucket: ${e}`)
    }
})

/**
 * Test queries below
 */
test('Test createOrder mutation as admin', async () => {
    const response = await createOrder(GRAPHQL_CLIENT_1, USERNAME2, "order1");
    expect(response.data.createOrder.customerEmail).toBeDefined()
    expect(response.data.createOrder.orderId).toEqual('order1')
    expect(response.data.createOrder.createdAt).toBeDefined()
})

test('Test createOrder mutation as owner', async () => {
    const response = await createOrder(GRAPHQL_CLIENT_2, USERNAME2, "order2");
    expect(response.data.createOrder.customerEmail).toBeDefined()
    expect(response.data.createOrder.orderId).toEqual('order2')
    expect(response.data.createOrder.createdAt).toBeDefined()
})

test('Test createOrder mutation as owner', async () => {
    const response = await createOrder(GRAPHQL_CLIENT_3, USERNAME2, "order3");
    expect(response.data.createOrder).toBeNull();
    expect(response.errors).toHaveLength(1);
})

test('Test list orders as owner', async () => {
    await createOrder(GRAPHQL_CLIENT_3, USERNAME3, "owned1")
    await createOrder(GRAPHQL_CLIENT_3, USERNAME3, "owned2")
    const listResponse = await listOrders(GRAPHQL_CLIENT_3, USERNAME3, { beginsWith: "owned" })
    expect(listResponse.data.listOrders.items).toHaveLength(2);
})

test('Test list orders as non owner', async () => {
    await createOrder(GRAPHQL_CLIENT_3, USERNAME3, "unowned1")
    await createOrder(GRAPHQL_CLIENT_3, USERNAME3, "unowned2")
    const listResponse = await listOrders(GRAPHQL_CLIENT_2, USERNAME3, { beginsWith: "unowned" })
    expect(listResponse.data.listOrders.items).toHaveLength(0);
})

test('Test get orders as owner', async () => {
    await createOrder(GRAPHQL_CLIENT_2, USERNAME2, "myobj")
    const getResponse = await getOrder(GRAPHQL_CLIENT_2, USERNAME2, "myobj")
    expect(getResponse.data.getOrder.orderId).toEqual("myobj");
})

test('Test get orders as non-owner', async () => {
    await createOrder(GRAPHQL_CLIENT_2, USERNAME2, "notmyobj")
    const getResponse = await getOrder(GRAPHQL_CLIENT_3, USERNAME2, "notmyobj")
    expect(getResponse.data.getOrder).toBeNull();
    expect(getResponse.errors).toHaveLength(1);
})

test('Test query orders as owner', async () => {
    await createOrder(GRAPHQL_CLIENT_3, USERNAME3, "ownedby3a")
    const listResponse = await ordersByOrderId(GRAPHQL_CLIENT_3, "ownedby3a")
    expect(listResponse.data.ordersByOrderId.items).toHaveLength(1);
})

test('Test query orders as non owner', async () => {
    await createOrder(GRAPHQL_CLIENT_3, USERNAME3, "notownedby2a")
    const listResponse = await ordersByOrderId(GRAPHQL_CLIENT_2, "notownedby2a")
    expect(listResponse.data.ordersByOrderId.items).toHaveLength(0);
})

async function createOrder(client: GraphQLClient, customerEmail: string, orderId: string) {
    const result = await client.query(`mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
            customerEmail
            orderId
            createdAt
        }
    }`, {
        input: { customerEmail, orderId }
    });
    console.log(JSON.stringify(result, null, 4));
    return result;
}

async function updateOrder(client: GraphQLClient, customerEmail: string, orderId: string) {
    const result = await client.query(`mutation UpdateOrder($input: UpdateOrderInput!) {
        updateOrder(input: $input) {
            customerEmail
            orderId
            createdAt
        }
    }`, {
        input: { customerEmail, orderId }
    });
    console.log(JSON.stringify(result, null, 4));
    return result;
}

async function deleteOrder(client: GraphQLClient, customerEmail: string, orderId: string) {
    const result = await client.query(`mutation DeleteOrder($input: DeleteOrderInput!) {
        deleteOrder(input: $input) {
            customerEmail
            orderId
            createdAt
        }
    }`, {
        input: { customerEmail, orderId }
    });
    console.log(JSON.stringify(result, null, 4));
    return result;
}

async function getOrder(client: GraphQLClient, customerEmail: string, orderId: string) {
    const result = await client.query(`query GetOrder($customerEmail: String!, $orderId: String!) {
        getOrder(customerEmail: $customerEmail, orderId: $orderId) {
            customerEmail
            orderId
            createdAt
        }
    }`, { customerEmail, orderId });
    console.log(JSON.stringify(result, null, 4));
    return result;
}

async function listOrders(client: GraphQLClient, customerEmail: string, orderId: { beginsWith: string }) {
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
    console.log(JSON.stringify(result, null, 4));
    return result;
}

async function ordersByOrderId(client: GraphQLClient, orderId: string) {
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
    console.log(JSON.stringify(result, null, 4));
    return result;
}