import Amplify, { Auth } from 'aws-amplify';
import { ResourceConstants } from 'graphql-transformer-common'
import GraphQLTransform from 'graphql-transformer-core'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'
import ModelAuthTransformer from 'graphql-auth-transformer'
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
const STACK_NAME = `ModelAuthTransformerTest-${BUILD_TIMESTAMP}`
const BUCKET_NAME = `appsync-auth-transformer-test-bucket-${BUILD_TIMESTAMP}`
const LOCAL_FS_BUILD_DIR = '/tmp/model_auth_transform_tests/'
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
    type Post @model @auth(rules: [{ allow: owner }]) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
        owner: String
    }
    type Salary @model @auth(
        rules: [
            {allow: owner},
            {allow: groups, groups: ["Admin"]}
        ]
    ) {
        id: ID!
        wage: Int
        owner: String
    }
    type AdminNote @model @auth(
        rules: [
            {allow: groups, groups: ["Admin"]}
        ]
    ) {
        id: ID!
        content: String!
    }
    type ManyGroupProtected @model @auth(rules: [{allow: groups, groupsField: "groups"}]) {
        id: ID!
        value: Int
        groups: [String]
    }
    type SingleGroupProtected @model @auth(rules: [{allow: groups, groupsField: "group"}]) {
        id: ID!
        value: Int
        group: String
    }
    type PWProtected
        @auth(rules: [
            {allow: groups, groupsField: "participants", mutations: [update, delete], queries: [get, list]},
            {allow: groups, groupsField: "watchers", mutations: [], queries: [get, list]}
        ])
        @model
    {
        id: ID!
        content: String!
        participants: String
        watchers: String
    }
    type AllThree
        @auth(rules: [
            {allow: owner, identityField: "username" },
            {allow: owner, ownerField: "editors", identityField: "cognito:username" },
            {allow: groups, groups: ["Admin"]},
            {allow: groups, groups: ["Execs"]},
            {allow: groups, groupsField: "groups"},
            {allow: groups, groupsField: "alternativeGroup"}
        ])
        @model
    {
        id: ID!
        owner: String
        editors: [String]
        groups: [String]
        alternativeGroup: String
    }
    # The owner should always start with https://cognito-idp
    type TestIdentity @model @auth(rules: [{ allow: owner, identityField: "iss" }]) {
        id: ID!
        title: String!
        owner: String
    }
    type OwnerReadProtected @model @auth(rules: [{ allow: owner, operations: [read] }]) {
        id: ID!
        content: String
        owner: String
    }
    type OwnerCreateUpdateDeleteProtected @model @auth(rules: [{ allow: owner, operations: [create, update, delete] }]) {
        id: ID!
        content: String
        owner: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
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
test('Test createPost mutation', async () => {
    const response = await GRAPHQL_CLIENT_1.query(`mutation {
        createPost(input: { title: "Hello, World!" }) {
            id
            title
            createdAt
            updatedAt
            owner
        }
    }`, {})
    console.log(response);
    expect(response.data.createPost.id).toBeDefined()
    expect(response.data.createPost.title).toEqual('Hello, World!')
    expect(response.data.createPost.createdAt).toBeDefined()
    expect(response.data.createPost.updatedAt).toBeDefined()
    expect(response.data.createPost.owner).toEqual(USERNAME1)

    const response2 = await GRAPHQL_CLIENT_1_ACCESS.query(`mutation {
        createPost(input: { title: "Hello, World!" }) {
            id
            title
            createdAt
            updatedAt
            owner
        }
    }`, {})
    console.log(response2);
    expect(response2.data.createPost.id).toBeDefined()
    expect(response2.data.createPost.title).toEqual('Hello, World!')
    expect(response2.data.createPost.createdAt).toBeDefined()
    expect(response2.data.createPost.updatedAt).toBeDefined()
    expect(response2.data.createPost.owner).toEqual(USERNAME1)
})

test('Test getPost query when authorized', async () => {
    const response = await GRAPHQL_CLIENT_1.query(`mutation {
        createPost(input: { title: "Hello, World!" }) {
            id
            title
            createdAt
            updatedAt
            owner
        }
    }`, {})
    expect(response.data.createPost.id).toBeDefined()
    expect(response.data.createPost.title).toEqual('Hello, World!')
    expect(response.data.createPost.createdAt).toBeDefined()
    expect(response.data.createPost.updatedAt).toBeDefined()
    expect(response.data.createPost.owner).toEqual(USERNAME1)
    const getResponse = await GRAPHQL_CLIENT_1.query(`query {
        getPost(id: "${response.data.createPost.id}") {
            id
            title
            createdAt
            updatedAt
            owner
        }
    }`, {})
    expect(getResponse.data.getPost.id).toBeDefined()
    expect(getResponse.data.getPost.title).toEqual('Hello, World!')
    expect(getResponse.data.getPost.createdAt).toBeDefined()
    expect(getResponse.data.getPost.updatedAt).toBeDefined()
    expect(getResponse.data.getPost.owner).toEqual(USERNAME1)

    const getResponseAccess = await GRAPHQL_CLIENT_1_ACCESS.query(`query {
        getPost(id: "${response.data.createPost.id}") {
            id
            title
            createdAt
            updatedAt
            owner
        }
    }`, {})
    expect(getResponseAccess.data.getPost.id).toBeDefined()
    expect(getResponseAccess.data.getPost.title).toEqual('Hello, World!')
    expect(getResponseAccess.data.getPost.createdAt).toBeDefined()
    expect(getResponseAccess.data.getPost.updatedAt).toBeDefined()
    expect(getResponseAccess.data.getPost.owner).toEqual(USERNAME1)
})

test('Test getPost query when not authorized', async () => {
    const response = await GRAPHQL_CLIENT_1.query(`mutation {
        createPost(input: { title: "Hello, World!" }) {
            id
            title
            createdAt
            updatedAt
            owner
        }
    }`, {})
    expect(response.data.createPost.id).toBeDefined()
    expect(response.data.createPost.title).toEqual('Hello, World!')
    expect(response.data.createPost.createdAt).toBeDefined()
    expect(response.data.createPost.updatedAt).toBeDefined()
    expect(response.data.createPost.owner).toBeDefined()
    const getResponse = await GRAPHQL_CLIENT_2.query(`query {
        getPost(id: "${response.data.createPost.id}") {
            id
            title
            createdAt
            updatedAt
            owner
        }
    }`, {})
    expect(getResponse.data.getPost).toEqual(null)
    expect(getResponse.errors.length).toEqual(1)
    expect((getResponse.errors[0] as any).errorType).toEqual('Unauthorized')
})

test('Test updatePost mutation when authorized', async () => {
    const response = await GRAPHQL_CLIENT_1.query(`mutation {
        createPost(input: { title: "Hello, World!" }) {
            id
            title
            createdAt
            updatedAt
            owner
        }
    }`, {})
    expect(response.data.createPost.id).toBeDefined()
    expect(response.data.createPost.title).toEqual('Hello, World!')
    expect(response.data.createPost.createdAt).toBeDefined()
    expect(response.data.createPost.updatedAt).toBeDefined()
    expect(response.data.createPost.owner).toEqual(USERNAME1)
    const updateResponse = await GRAPHQL_CLIENT_1.query(`mutation {
        updatePost(input: { id: "${response.data.createPost.id}", title: "Bye, World!" }) {
            id
            title
            createdAt
            updatedAt
            owner
        }
    }`, {})
    expect(updateResponse.data.updatePost.id).toEqual(response.data.createPost.id)
    expect(updateResponse.data.updatePost.title).toEqual('Bye, World!')
    expect(updateResponse.data.updatePost.updatedAt > response.data.createPost.updatedAt).toEqual(true)

    const updateResponseAccess = await GRAPHQL_CLIENT_1_ACCESS.query(`mutation {
        updatePost(input: { id: "${response.data.createPost.id}", title: "Bye, World!" }) {
            id
            title
            createdAt
            updatedAt
            owner
        }
    }`, {})
    expect(updateResponseAccess.data.updatePost.id).toEqual(response.data.createPost.id)
    expect(updateResponseAccess.data.updatePost.title).toEqual('Bye, World!')
    expect(updateResponseAccess.data.updatePost.updatedAt > response.data.createPost.updatedAt).toEqual(true)
})

test('Test updatePost mutation when not authorized', async () => {
    const response = await GRAPHQL_CLIENT_1.query(`mutation {
        createPost(input: { title: "Hello, World!" }) {
            id
            title
            createdAt
            updatedAt
            owner
        }
    }`, {})
    expect(response.data.createPost.id).toBeDefined()
    expect(response.data.createPost.title).toEqual('Hello, World!')
    expect(response.data.createPost.createdAt).toBeDefined()
    expect(response.data.createPost.updatedAt).toBeDefined()
    expect(response.data.createPost.owner).toBeDefined()
    const updateResponse = await GRAPHQL_CLIENT_2.query(`mutation {
        updatePost(input: { id: "${response.data.createPost.id}", title: "Bye, World!" }) {
            id
            title
            createdAt
            updatedAt
            owner
        }
    }`, {})
    expect(updateResponse.data.updatePost).toEqual(null)
    expect(updateResponse.errors.length).toEqual(1)
    expect((updateResponse.errors[0] as any).errorType).toEqual('DynamoDB:ConditionalCheckFailedException')
})

test('Test deletePost mutation when authorized', async () => {
    const response = await GRAPHQL_CLIENT_1.query(`mutation {
        createPost(input: { title: "Hello, World!" }) {
            id
            title
            createdAt
            updatedAt
            owner
        }
    }`, {})
    expect(response.data.createPost.id).toBeDefined()
    expect(response.data.createPost.title).toEqual('Hello, World!')
    expect(response.data.createPost.createdAt).toBeDefined()
    expect(response.data.createPost.updatedAt).toBeDefined()
    expect(response.data.createPost.owner).toEqual(USERNAME1)
    const deleteResponse = await GRAPHQL_CLIENT_1.query(`mutation {
        deletePost(input: { id: "${response.data.createPost.id}" }) {
            id
        }
    }`, {})
    expect(deleteResponse.data.deletePost.id).toEqual(response.data.createPost.id)

    const responseAccess = await GRAPHQL_CLIENT_1_ACCESS.query(`mutation {
        createPost(input: { title: "Hello, World!" }) {
            id
            title
            createdAt
            updatedAt
            owner
        }
    }`, {})
    expect(responseAccess.data.createPost.id).toBeDefined()
    expect(responseAccess.data.createPost.title).toEqual('Hello, World!')
    expect(responseAccess.data.createPost.createdAt).toBeDefined()
    expect(responseAccess.data.createPost.updatedAt).toBeDefined()
    expect(responseAccess.data.createPost.owner).toEqual(USERNAME1)
    const deleteResponseAccess = await GRAPHQL_CLIENT_1_ACCESS.query(`mutation {
        deletePost(input: { id: "${responseAccess.data.createPost.id}" }) {
            id
        }
    }`, {})
    expect(deleteResponseAccess.data.deletePost.id).toEqual(responseAccess.data.createPost.id)
})

test('Test deletePost mutation when not authorized', async () => {
    const response = await GRAPHQL_CLIENT_1.query(`mutation {
        createPost(input: { title: "Hello, World!" }) {
            id
            title
            createdAt
            updatedAt
            owner
        }
    }`, {})
    expect(response.data.createPost.id).toBeDefined()
    expect(response.data.createPost.title).toEqual('Hello, World!')
    expect(response.data.createPost.createdAt).toBeDefined()
    expect(response.data.createPost.updatedAt).toBeDefined()
    expect(response.data.createPost.owner).toEqual(USERNAME1)
    const deleteResponse = await GRAPHQL_CLIENT_2.query(`mutation {
        deletePost(input: { id: "${response.data.createPost.id}" }) {
            id
        }
    }`, {})
    expect(deleteResponse.data.deletePost).toEqual(null)
    expect(deleteResponse.errors.length).toEqual(1)
    expect((deleteResponse.errors[0] as any).errorType).toEqual('DynamoDB:ConditionalCheckFailedException')
})

test('Test listPosts query when authorized', async () => {
    const firstPost = await GRAPHQL_CLIENT_1.query(`mutation {
        createPost(input: { title: "testing list" }) {
            id
            title
            createdAt
            updatedAt
            owner
        }
    }`, {})
    expect(firstPost.data.createPost.id).toBeDefined()
    expect(firstPost.data.createPost.title).toEqual('testing list')
    expect(firstPost.data.createPost.createdAt).toBeDefined()
    expect(firstPost.data.createPost.updatedAt).toBeDefined()
    expect(firstPost.data.createPost.owner).toEqual(USERNAME1)
    const secondPost = await GRAPHQL_CLIENT_2.query(`mutation {
        createPost(input: { title: "testing list" }) {
            id
            title
            createdAt
            updatedAt
            owner
        }
    }`, {})
    // There are two posts but only 1 created by me.
    const listResponse = await GRAPHQL_CLIENT_1.query(`query {
        listPosts(filter: { title: { eq: "testing list" } }, limit: 25) {
            items {
                id
            }
        }
    }`, {})
    console.log(JSON.stringify(listResponse, null, 4))
    expect(listResponse.data.listPosts.items.length).toEqual(1)

    const listResponseAccess = await GRAPHQL_CLIENT_1_ACCESS.query(`query {
        listPosts(filter: { title: { eq: "testing list" } }, limit: 25) {
            items {
                id
            }
        }
    }`, {})
    console.log(JSON.stringify(listResponseAccess, null, 4))
    expect(listResponseAccess.data.listPosts.items.length).toEqual(1)
})

/**
 * Static Group Auth
 */
test(`Test createSalary w/ Admin group protection authorized`, async () => {
    const req = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createSalary(input: { wage: 10 }) {
            id
            wage
        }
    }
    `)
    expect(req.data.createSalary.id).toBeDefined()
    expect(req.data.createSalary.wage).toEqual(10)
})

test(`Test update my own salary without admin permission`, async () => {
    const req = await GRAPHQL_CLIENT_2.query(`
    mutation {
        createSalary(input: { wage: 10 }) {
            id
            wage
        }
    }
    `)
    console.log(JSON.stringify(req, null, 4))
    expect(req.data.createSalary.wage).toEqual(10)
    const req2 = await GRAPHQL_CLIENT_2.query(`
    mutation {
        updateSalary(input: { id: "${req.data.createSalary.id}", wage: 14 }) {
            id
            wage
        }
    }
    `)
    console.log(JSON.stringify(req2, null, 4))
    expect(req2.data.updateSalary.wage).toEqual(14)
})

test(`Test updating someone else's salary as an admin`, async () => {
    const req = await GRAPHQL_CLIENT_2.query(`
    mutation {
        createSalary(input: { wage: 11 }) {
            id
            wage
        }
    }
    `)
    console.log(JSON.stringify(req, null, 4))
    expect(req.data.createSalary.id).toBeDefined()
    expect(req.data.createSalary.wage).toEqual(11)
    const req2 = await GRAPHQL_CLIENT_1.query(`
    mutation {
        updateSalary(input: { id: "${req.data.createSalary.id}", wage: 12 }) {
            id
            wage
        }
    }
    `)
    console.log(JSON.stringify(req2, null, 4))
    expect(req2.data.updateSalary.id).toEqual(req.data.createSalary.id)
    expect(req2.data.updateSalary.wage).toEqual(12)
})

test(`Test updating someone else's salary when I am not admin.`, async () => {
    const req = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createSalary(input: { wage: 13 }) {
            id
            wage
        }
    }
    `)
    console.log(JSON.stringify(req, null, 4))
    expect(req.data.createSalary.id).toBeDefined()
    expect(req.data.createSalary.wage).toEqual(13)
    const req2 = await GRAPHQL_CLIENT_2.query(`
    mutation {
        updateSalary(input: { id: "${req.data.createSalary.id}", wage: 14 }) {
            id
            wage
        }
    }
    `)
    expect(req2.data.updateSalary).toEqual(null)
    expect(req2.errors.length).toEqual(1)
    expect((req2.errors[0] as any).errorType).toEqual('DynamoDB:ConditionalCheckFailedException')
})

test(`Test deleteSalary w/ Admin group protection authorized`, async () => {
    const req = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createSalary(input: { wage: 15 }) {
            id
            wage
        }
    }
    `)
    console.log(JSON.stringify(req, null, 4))
    expect(req.data.createSalary.id).toBeDefined()
    expect(req.data.createSalary.wage).toEqual(15)
    const req2 = await GRAPHQL_CLIENT_1.query(`
    mutation {
        deleteSalary(input: { id: "${req.data.createSalary.id}" }) {
            id
            wage
        }
    }
    `)
    console.log(JSON.stringify(req2, null, 4))
    expect(req2.data.deleteSalary.id).toEqual(req.data.createSalary.id)
    expect(req2.data.deleteSalary.wage).toEqual(15)
})

test(`Test deleteSalary w/ Admin group protection not authorized`, async () => {
    const req = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createSalary(input: { wage: 16 }) {
            id
            wage
        }
    }
    `)
    console.log(JSON.stringify(req, null, 4))
    expect(req.data.createSalary.id).toBeDefined()
    expect(req.data.createSalary.wage).toEqual(16)
    const req2 = await GRAPHQL_CLIENT_2.query(`
    mutation {
        deleteSalary(input: { id: "${req.data.createSalary.id}" }) {
            id
            wage
        }
    }
    `)
    expect(req2.data.deleteSalary).toEqual(null)
    expect(req2.errors.length).toEqual(1)
    expect((req2.errors[0] as any).errorType).toEqual('DynamoDB:ConditionalCheckFailedException')
})

test(`Test and Admin can get a salary created by any user`, async () => {
    const req = await GRAPHQL_CLIENT_2.query(`
    mutation {
        createSalary(input: { wage: 15 }) {
            id
            wage
        }
    }
    `)
    console.log(JSON.stringify(req, null, 4))
    expect(req.data.createSalary.id).toBeDefined()
    expect(req.data.createSalary.wage).toEqual(15)
    const req2 = await GRAPHQL_CLIENT_1.query(`
    query {
        getSalary(id: "${req.data.createSalary.id}") {
            id
            wage
        }
    }
    `)
    expect(req2.data.getSalary.id).toEqual(req.data.createSalary.id)
    expect(req2.data.getSalary.wage).toEqual(15)
})

test(`Test owner can create and get a salary when not admin`, async () => {
    const req = await GRAPHQL_CLIENT_2.query(`
    mutation {
        createSalary(input: { wage: 15 }) {
            id
            wage
        }
    }
    `)
    console.log(JSON.stringify(req, null, 4))
    expect(req.data.createSalary.id).toBeDefined()
    expect(req.data.createSalary.wage).toEqual(15)
    const req2 = await GRAPHQL_CLIENT_2.query(`
    query {
        getSalary(id: "${req.data.createSalary.id}") {
            id
            wage
        }
    }
    `)
    expect(req2.data.getSalary.id).toEqual(req.data.createSalary.id)
    expect(req2.data.getSalary.wage).toEqual(15)
})

test(`Test getSalary w/ Admin group protection not authorized`, async () => {
    const req = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createSalary(input: { wage: 16 }) {
            id
            wage
        }
    }
    `)
    console.log(JSON.stringify(req, null, 4))
    expect(req.data.createSalary.id).toBeDefined()
    expect(req.data.createSalary.wage).toEqual(16)
    const req2 = await GRAPHQL_CLIENT_2.query(`
    query {
        getSalary(id: "${req.data.createSalary.id}") {
            id
            wage
        }
    }
    `)
    expect(req2.data.getSalary).toEqual(null)
    expect(req2.errors.length).toEqual(1)
    expect((req2.errors[0] as any).errorType).toEqual('Unauthorized')
})

test(`Test listSalarys w/ Admin group protection authorized`, async () => {
    const req = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createSalary(input: { wage: 101 }) {
            id
            wage
        }
    }
    `)
    console.log(JSON.stringify(req, null, 4))
    expect(req.data.createSalary.id).toBeDefined()
    expect(req.data.createSalary.wage).toEqual(101)
    const req2 = await GRAPHQL_CLIENT_1.query(`
    query {
        listSalarys(filter: { wage: { eq: 101 }}) {
            items {
                id
                wage
            }
        }
    }
    `)
    expect(req2.data.listSalarys.items.length).toEqual(1)
    expect(req2.data.listSalarys.items[0].id).toEqual(req.data.createSalary.id)
    expect(req2.data.listSalarys.items[0].wage).toEqual(101)
})

test(`Test listSalarys w/ Admin group protection not authorized`, async () => {
    const req = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createSalary(input: { wage: 102 }) {
            id
            wage
        }
    }
    `)
    console.log(JSON.stringify(req, null, 4))
    expect(req.data.createSalary.id).toBeDefined()
    expect(req.data.createSalary.wage).toEqual(102)
    const req2 = await GRAPHQL_CLIENT_2.query(`
    query {
        listSalarys(filter: { wage: { eq: 102 }}) {
            items {
                id
                wage
            }
        }
    }
    `)
    expect(req2.data.listSalarys.items).toEqual([])
})

/**
 * Dynamic Group Auth
 */
test(`Test createManyGroupProtected w/ dynamic group protection authorized`, async () => {
    const req = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createManyGroupProtected(input: { value: 10, groups: ["Admin"] }) {
            id
            value
            groups
        }
    }
    `)
    console.log(JSON.stringify(req, null, 4))
    expect(req.data.createManyGroupProtected.id).toBeDefined()
    expect(req.data.createManyGroupProtected.value).toEqual(10)
    expect(req.data.createManyGroupProtected.groups).toEqual(["Admin"])
})

test(`Test createManyGroupProtected w/ dynamic group protection when not authorized`, async () => {
    const req = await GRAPHQL_CLIENT_2.query(`
    mutation {
        createManyGroupProtected(input: { value: 10, groups: ["Admin"] }) {
            id
            value
            groups
        }
    }
    `)
    console.log(JSON.stringify(req, null, 4))
    expect(req.data.createManyGroupProtected).toEqual(null)
    expect(req.errors.length).toEqual(1)
    expect((req.errors[0] as any).errorType).toEqual('Unauthorized')
})

test(`Test createSingleGroupProtected w/ dynamic group protection authorized`, async () => {
    const req = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createSingleGroupProtected(input: { value: 10, group: "Admin" }) {
            id
            value
            group
        }
    }
    `)
    console.log(JSON.stringify(req, null, 4))
    expect(req.data.createSingleGroupProtected.id).toBeDefined()
    expect(req.data.createSingleGroupProtected.value).toEqual(10)
    expect(req.data.createSingleGroupProtected.group).toEqual("Admin")
})

test(`Test createSingleGroupProtected w/ dynamic group protection when not authorized`, async () => {
    const req = await GRAPHQL_CLIENT_2.query(`
    mutation {
        createSingleGroupProtected(input: { value: 10, group: "Admin" }) {
            id
            value
            group
        }
    }
    `)
    console.log(JSON.stringify(req, null, 4))
    expect(req.data.createSingleGroupProtected).toEqual(null)
    expect(req.errors.length).toEqual(1)
    expect((req.errors[0] as any).errorType).toEqual('Unauthorized')
})

test(`Test listPWProtecteds when the user is authorized.`, async () => {
    const req = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createPWProtected(input: { content: "Foobie", participants: "${PARTICIPANT_GROUP_NAME}", watchers: "${WATCHER_GROUP_NAME}" }) {
            id
            content
            participants
            watchers
        }
    }
    `)
    console.log(JSON.stringify(req, null, 4))
    expect(req.data.createPWProtected).toBeTruthy()

    const uReq = await GRAPHQL_CLIENT_1.query(`
    mutation {
        updatePWProtected(input: { id: "${req.data.createPWProtected.id}", content: "Foobie2" }) {
            id
            content
            participants
            watchers
        }
    }
    `)
    console.log(JSON.stringify(uReq, null, 4))
    expect(uReq.data.updatePWProtected).toBeTruthy()

    const req2 = await GRAPHQL_CLIENT_1.query(`
    query {
        listPWProtecteds {
            items {
                id
                content
                participants
                watchers
            }
            nextToken
        }
    }
    `)
    expect(req2.data.listPWProtecteds.items.length).toEqual(1)
    expect(req2.data.listPWProtecteds.items[0].id).toEqual(req.data.createPWProtected.id)
    expect(req2.data.listPWProtecteds.items[0].content).toEqual("Foobie2")


    const req3 = await GRAPHQL_CLIENT_1.query(`
    query {
        getPWProtected(id: "${req.data.createPWProtected.id}") {
            id
            content
            participants
            watchers
        }
    }
    `)
    console.log(JSON.stringify(req3, null, 4))
    expect(req3.data.getPWProtected).toBeTruthy()

    const dReq = await GRAPHQL_CLIENT_1.query(`
    mutation {
        deletePWProtected(input: { id: "${req.data.createPWProtected.id}" }) {
            id
            content
            participants
            watchers
        }
    }
    `)
    console.log(JSON.stringify(dReq, null, 4))
    expect(dReq.data.deletePWProtected).toBeTruthy()
})

test(`Test listPWProtecteds when groups is null in dynamodb.`, async () => {
    const req = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createPWProtected(input: { content: "Foobie" }) {
            id
            content
            participants
            watchers
        }
    }
    `)
    console.log(JSON.stringify(req, null, 4))
    expect(req.data.createPWProtected).toBeTruthy()

    const req2 = await GRAPHQL_CLIENT_1.query(`
    query {
        listPWProtecteds {
            items {
                id
                content
                participants
                watchers
            }
            nextToken
        }
    }
    `)
    expect(req2.data.listPWProtecteds.items.length).toEqual(0)

    const req3 = await GRAPHQL_CLIENT_1.query(`
    query {
        getPWProtected(id: "${req.data.createPWProtected.id}") {
            id
            content
            participants
            watchers
        }
    }
    `)
    console.log(JSON.stringify(req3, null, 4))
    expect(req3.data.getPWProtected).toEqual(null)
    expect(req3.errors.length).toEqual(1)
    expect((req3.errors[0] as any).errorType).toEqual('Unauthorized')
})

test(`Test Protecteds when the user is not authorized.`, async () => {
    const req = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createPWProtected(input: { content: "Barbie", participants: "${PARTICIPANT_GROUP_NAME}", watchers: "${WATCHER_GROUP_NAME}" }) {
            id
            content
            participants
            watchers
        }
    }
    `)
    console.log(JSON.stringify(req, null, 4))
    expect(req.data.createPWProtected).toBeTruthy()

    const req2 = await GRAPHQL_CLIENT_2.query(`
    query {
        listPWProtecteds {
            items {
                id
                content
                participants
                watchers
            }
            nextToken
        }
    }
    `)
    console.log(JSON.stringify(req2, null, 4))
    expect(req2.data.listPWProtecteds.items.length).toEqual(0)
    expect(req2.data.listPWProtecteds.nextToken).toBeNull()

    const uReq = await GRAPHQL_CLIENT_2.query(`
    mutation {
        updatePWProtected(input: { id: "${req.data.createPWProtected.id}", content: "Foobie2" }) {
            id
            content
            participants
            watchers
        }
    }
    `)
    console.log(JSON.stringify(uReq, null, 4))
    expect(uReq.data.updatePWProtected).toBeNull()

    const req3 = await GRAPHQL_CLIENT_2.query(`
    query {
        getPWProtected(id: "${req.data.createPWProtected.id}") {
            id
            content
            participants
            watchers
        }
    }
    `)
    console.log(JSON.stringify(req3, null, 4))
    expect(req3.data.getPWProtected).toBeNull()

    const dReq = await GRAPHQL_CLIENT_2.query(`
    mutation {
        deletePWProtected(input: { id: "${req.data.createPWProtected.id}" }) {
            id
            content
            participants
            watchers
        }
    }
    `)
    console.log(JSON.stringify(dReq, null, 4))
    expect(dReq.data.deletePWProtected).toBeNull()

    // The record should still exist after delete.
    const getReq = await GRAPHQL_CLIENT_1.query(`
    query {
        getPWProtected(id: "${req.data.createPWProtected.id}") {
            id
            content
            participants
            watchers
        }
    }
    `)
    console.log(JSON.stringify(getReq, null, 4))
    expect(getReq.data.getPWProtected).toBeTruthy()
})

test(`Test creating, updating, and deleting an admin note as an admin`, async () => {
    const req = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createAdminNote(input: { content: "Hello" }) {
            id
            content
        }
    }
    `)
    console.log(JSON.stringify(req, null, 4))
    expect(req.data.createAdminNote.id).toBeDefined()
    expect(req.data.createAdminNote.content).toEqual("Hello")
    const req2 = await GRAPHQL_CLIENT_1.query(`
    mutation {
        updateAdminNote(input: { id: "${req.data.createAdminNote.id}", content: "Hello 2" }) {
            id
            content
        }
    }
    `)
    console.log(JSON.stringify(req2, null, 4))
    expect(req2.data.updateAdminNote.id).toEqual(req.data.createAdminNote.id)
    expect(req2.data.updateAdminNote.content).toEqual("Hello 2")
    const req3 = await GRAPHQL_CLIENT_1.query(`
    mutation {
        deleteAdminNote(input: { id: "${req.data.createAdminNote.id}" }) {
            id
            content
        }
    }
    `)
    console.log(JSON.stringify(req3, null, 4))
    expect(req3.data.deleteAdminNote.id).toEqual(req.data.createAdminNote.id)
    expect(req3.data.deleteAdminNote.content).toEqual("Hello 2")
})

test(`Test creating, updating, and deleting an admin note as a non admin`, async () => {
    const adminReq = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createAdminNote(input: { content: "Hello" }) {
            id
            content
        }
    }
    `)
    console.log(JSON.stringify(adminReq, null, 4))
    expect(adminReq.data.createAdminNote.id).toBeDefined()
    expect(adminReq.data.createAdminNote.content).toEqual("Hello")


    const req = await GRAPHQL_CLIENT_2.query(`
    mutation {
        createAdminNote(input: { content: "Hello" }) {
            id
            content
        }
    }
    `)
    console.log(JSON.stringify(req, null, 4))
    expect(req.errors.length).toEqual(1)
    expect((req.errors[0] as any).errorType).toEqual('Unauthorized')

    const req2 = await GRAPHQL_CLIENT_2.query(`
    mutation {
        updateAdminNote(input: { id: "${adminReq.data.createAdminNote.id}", content: "Hello 2" }) {
            id
            content
        }
    }
    `)
    console.log(JSON.stringify(req2, null, 4))
    expect(req2.errors.length).toEqual(1)
    expect((req2.errors[0] as any).errorType).toEqual('Unauthorized')

    const req3 = await GRAPHQL_CLIENT_2.query(`
    mutation {
        deleteAdminNote(input: { id: "${adminReq.data.createAdminNote.id}" }) {
            id
            content
        }
    }
    `)
    console.log(JSON.stringify(req3, null, 4))
    expect(req3.errors.length).toEqual(1)
    expect((req3.errors[0] as any).errorType).toEqual('Unauthorized')
})

/**
 * Get Query Tests
 */

test(`Test getAllThree as admin.`, async () => {
    const ownedBy2 = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createAllThree(input: {
            owner: "user2@test.com"
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedBy2, null, 4))
    expect(ownedBy2.data.createAllThree).toBeTruthy()

    const fetchOwnedBy2AsAdmin = await GRAPHQL_CLIENT_1.query(`
    query {
        getAllThree(id: "${ownedBy2.data.createAllThree.id}") {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(fetchOwnedBy2AsAdmin, null, 4))
    expect(fetchOwnedBy2AsAdmin.data.getAllThree).toBeTruthy()

    const deleteReq = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedBy2.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedBy2.data.createAllThree.id)
})

test(`Test getAllThree as owner.`, async () => {
    const ownedBy2 = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createAllThree(input: {
            owner: "user2@test.com"
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedBy2, null, 4))
    expect(ownedBy2.data.createAllThree).toBeTruthy()

    const fetchOwnedBy2AsOwner = await GRAPHQL_CLIENT_2.query(`
    query {
        getAllThree(id: "${ownedBy2.data.createAllThree.id}") {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(fetchOwnedBy2AsOwner, null, 4))
    expect(fetchOwnedBy2AsOwner.data.getAllThree).toBeTruthy()

    const deleteReq = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedBy2.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedBy2.data.createAllThree.id)
})

test(`Test getAllThree as one of a set of editors.`, async () => {
    const ownedBy2 = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createAllThree(input: {
            editors: ["user2@test.com"]
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedBy2, null, 4))
    expect(ownedBy2.data.createAllThree).toBeTruthy()

    const fetchOwnedBy2AsEditor = await GRAPHQL_CLIENT_2.query(`
    query {
        getAllThree(id: "${ownedBy2.data.createAllThree.id}") {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(fetchOwnedBy2AsEditor, null, 4))
    expect(fetchOwnedBy2AsEditor.data.getAllThree).toBeTruthy()

    const deleteReq = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedBy2.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedBy2.data.createAllThree.id)
})

test(`Test getAllThree as a member of a dynamic group.`, async () => {
    const ownedByAdmins = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createAllThree(input: {
            groups: ["Devs"]
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedByAdmins, null, 4))
    expect(ownedByAdmins.data.createAllThree).toBeTruthy()

    const fetchOwnedByAdminsAsAdmin = await GRAPHQL_CLIENT_2.query(`
    query {
        getAllThree(id: "${ownedByAdmins.data.createAllThree.id}") {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(fetchOwnedByAdminsAsAdmin, null, 4))
    expect(fetchOwnedByAdminsAsAdmin.data.getAllThree).toBeTruthy()

    const fetchOwnedByAdminsAsNonAdmin = await GRAPHQL_CLIENT_3.query(`
    query {
        getAllThree(id: "${ownedByAdmins.data.createAllThree.id}") {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(fetchOwnedByAdminsAsNonAdmin, null, 4))
    expect(fetchOwnedByAdminsAsNonAdmin.errors.length).toEqual(1)
    expect((fetchOwnedByAdminsAsNonAdmin.errors[0] as any).errorType).toEqual('Unauthorized')

    const deleteReq = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedByAdmins.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedByAdmins.data.createAllThree.id)
})

test(`Test getAllThree as a member of the alternative group.`, async () => {
    const ownedByAdmins = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createAllThree(input: {
            alternativeGroup: "Devs"
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedByAdmins, null, 4))
    expect(ownedByAdmins.data.createAllThree).toBeTruthy()

    const fetchOwnedByAdminsAsAdmin = await GRAPHQL_CLIENT_2.query(`
    query {
        getAllThree(id: "${ownedByAdmins.data.createAllThree.id}") {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(fetchOwnedByAdminsAsAdmin, null, 4))
    expect(fetchOwnedByAdminsAsAdmin.data.getAllThree).toBeTruthy()

    const fetchOwnedByAdminsAsNonAdmin = await GRAPHQL_CLIENT_3.query(`
    query {
        getAllThree(id: "${ownedByAdmins.data.createAllThree.id}") {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(fetchOwnedByAdminsAsNonAdmin, null, 4))
    expect(fetchOwnedByAdminsAsNonAdmin.errors.length).toEqual(1)
    expect((fetchOwnedByAdminsAsNonAdmin.errors[0] as any).errorType).toEqual('Unauthorized')

    const deleteReq = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedByAdmins.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedByAdmins.data.createAllThree.id)
})

/**
 * List Query Tests
 */

test(`Test listAllThrees as admin.`, async () => {
    const ownedBy2 = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createAllThree(input: {
            owner: "user2@test.com"
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedBy2, null, 4))
    expect(ownedBy2.data.createAllThree).toBeTruthy()

    const fetchOwnedBy2AsAdmin = await GRAPHQL_CLIENT_1.query(`
    query {
        listAllThrees {
            items {
                id
                owner
                editors
                groups
                alternativeGroup
            }
        }
    }
    `)
    console.log(JSON.stringify(fetchOwnedBy2AsAdmin, null, 4))
    expect(fetchOwnedBy2AsAdmin.data.listAllThrees.items).toHaveLength(1)
    expect(fetchOwnedBy2AsAdmin.data.listAllThrees.items[0].id).toEqual(ownedBy2.data.createAllThree.id)

    const deleteReq = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedBy2.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedBy2.data.createAllThree.id)
})

test(`Test listAllThrees as owner.`, async () => {
    const ownedBy2 = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createAllThree(input: {
            owner: "user2@test.com"
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedBy2, null, 4))
    expect(ownedBy2.data.createAllThree).toBeTruthy()

    const fetchOwnedBy2AsOwner = await GRAPHQL_CLIENT_2.query(`
    query {
        listAllThrees {
            items {
                id
                owner
                editors
                groups
                alternativeGroup
            }
        }
    }
    `)
    console.log(JSON.stringify(fetchOwnedBy2AsOwner, null, 4))
    expect(fetchOwnedBy2AsOwner.data.listAllThrees.items).toHaveLength(1)
    expect(fetchOwnedBy2AsOwner.data.listAllThrees.items[0].id).toEqual(ownedBy2.data.createAllThree.id)

    const deleteReq = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedBy2.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedBy2.data.createAllThree.id)
})

test(`Test listAllThrees as one of a set of editors.`, async () => {
    const ownedBy2 = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createAllThree(input: {
            editors: ["user2@test.com"]
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedBy2, null, 4))
    expect(ownedBy2.data.createAllThree).toBeTruthy()

    const fetchOwnedBy2AsEditor = await GRAPHQL_CLIENT_2.query(`
    query {
        listAllThrees {
            items {
                id
                owner
                editors
                groups
                alternativeGroup
            }
        }
    }
    `)
    console.log(JSON.stringify(fetchOwnedBy2AsEditor, null, 4))
    expect(fetchOwnedBy2AsEditor.data.listAllThrees.items).toHaveLength(1)
    expect(fetchOwnedBy2AsEditor.data.listAllThrees.items[0].id).toEqual(ownedBy2.data.createAllThree.id)

    const deleteReq = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedBy2.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedBy2.data.createAllThree.id)
})

test(`Test listAllThrees as a member of a dynamic group.`, async () => {
    const ownedByAdmins = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createAllThree(input: {
            groups: ["Devs"]
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedByAdmins, null, 4))
    expect(ownedByAdmins.data.createAllThree).toBeTruthy()

    const fetchOwnedByAdminsAsAdmin = await GRAPHQL_CLIENT_2.query(`
    query {
        listAllThrees {
            items {
                id
                owner
                editors
                groups
                alternativeGroup
            }
        }
    }
    `)
    console.log(JSON.stringify(fetchOwnedByAdminsAsAdmin, null, 4))
    expect(fetchOwnedByAdminsAsAdmin.data.listAllThrees.items).toHaveLength(1)
    expect(fetchOwnedByAdminsAsAdmin.data.listAllThrees.items[0].id).toEqual(ownedByAdmins.data.createAllThree.id)

    const fetchOwnedByAdminsAsNonAdmin = await GRAPHQL_CLIENT_3.query(`
    query {
        listAllThrees {
            items {
                id
                owner
                editors
                groups
                alternativeGroup
            }
        }
    }
    `)
    console.log(JSON.stringify(fetchOwnedByAdminsAsNonAdmin, null, 4))
    expect(fetchOwnedByAdminsAsNonAdmin.data.listAllThrees.items).toHaveLength(0)

    const deleteReq = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedByAdmins.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedByAdmins.data.createAllThree.id)
})

test(`Test getAllThree as a member of the alternative group.`, async () => {
    const ownedByAdmins = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createAllThree(input: {
            alternativeGroup: "Devs"
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedByAdmins, null, 4))
    expect(ownedByAdmins.data.createAllThree).toBeTruthy()

    const fetchOwnedByAdminsAsAdmin = await GRAPHQL_CLIENT_2.query(`
    query {
        listAllThrees {
            items {
                id
                owner
                editors
                groups
                alternativeGroup
            }
        }
    }
    `)
    console.log(JSON.stringify(fetchOwnedByAdminsAsAdmin, null, 4))
    expect(fetchOwnedByAdminsAsAdmin.data.listAllThrees.items).toHaveLength(1)
    expect(fetchOwnedByAdminsAsAdmin.data.listAllThrees.items[0].id).toEqual(ownedByAdmins.data.createAllThree.id)

    const fetchOwnedByAdminsAsNonAdmin = await GRAPHQL_CLIENT_3.query(`
    query {
        listAllThrees {
            items {
                id
                owner
                editors
                groups
                alternativeGroup
            }
        }
    }
    `)
    console.log(JSON.stringify(fetchOwnedByAdminsAsNonAdmin, null, 4))
    expect(fetchOwnedByAdminsAsNonAdmin.data.listAllThrees.items).toHaveLength(0)

    const deleteReq = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedByAdmins.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedByAdmins.data.createAllThree.id)
})

/**
 * Create Mutation Tests
 */

test(`Test createAllThree as admin.`, async () => {
    const ownedBy2 = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createAllThree(input: {
            owner: "user2@test.com"
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedBy2, null, 4))
    expect(ownedBy2.data.createAllThree).toBeTruthy()
    // set by input
    expect(ownedBy2.data.createAllThree.owner).toEqual("user2@test.com")
    // auto filled as logged in user.
    expect(ownedBy2.data.createAllThree.editors[0]).toEqual("user1@test.com")
    expect(ownedBy2.data.createAllThree.groups).toBeNull()
    expect(ownedBy2.data.createAllThree.alternativeGroup).toBeNull()

    const ownedBy2NoEditors = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createAllThree(input: {
            owner: "user2@test.com",
            editors: []
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedBy2NoEditors, null, 4))
    expect(ownedBy2NoEditors.data.createAllThree).toBeTruthy()
    // set by input
    expect(ownedBy2NoEditors.data.createAllThree.owner).toEqual("user2@test.com")
    // set by input
    expect(ownedBy2NoEditors.data.createAllThree.editors).toHaveLength(0)
    expect(ownedBy2NoEditors.data.createAllThree.groups).toBeNull()
    expect(ownedBy2NoEditors.data.createAllThree.alternativeGroup).toBeNull()

    const deleteReq = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedBy2.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedBy2.data.createAllThree.id)

    const deleteReq2 = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedBy2NoEditors.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq2, null, 4))
    expect(deleteReq2.data.deleteAllThree.id).toEqual(ownedBy2NoEditors.data.createAllThree.id)
})

test(`Test createAllThree as owner.`, async () => {
    const ownedBy2 = await GRAPHQL_CLIENT_2.query(`
    mutation {
        createAllThree(input: {
            owner: "user2@test.com",
            editors: []
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedBy2, null, 4))
    expect(ownedBy2.data.createAllThree).toBeTruthy()
    expect(ownedBy2.data.createAllThree.owner).toEqual("user2@test.com")
    expect(ownedBy2.data.createAllThree.editors).toHaveLength(0)
    expect(ownedBy2.data.createAllThree.groups).toBeNull()
    expect(ownedBy2.data.createAllThree.alternativeGroup).toBeNull()

    const ownedBy1 = await GRAPHQL_CLIENT_2.query(`
    mutation {
        createAllThree(input: {
            owner: "user1@test.com",
            editors: []
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedBy1, null, 4))
    expect(ownedBy1.errors.length).toEqual(1)
    expect((ownedBy1.errors[0] as any).errorType).toEqual('Unauthorized')


    const deleteReq = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedBy2.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedBy2.data.createAllThree.id)
})

test(`Test createAllThree as one of a set of editors.`, async () => {
    const ownedBy2 = await GRAPHQL_CLIENT_2.query(`
    mutation {
        createAllThree(input: {
            owner: null,
            editors: ["user2@test.com"]
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedBy2, null, 4))
    expect(ownedBy2.data.createAllThree).toBeTruthy()
    expect(ownedBy2.data.createAllThree.owner).toBeNull()
    expect(ownedBy2.data.createAllThree.editors[0]).toEqual("user2@test.com")
    expect(ownedBy2.data.createAllThree.groups).toBeNull()
    expect(ownedBy2.data.createAllThree.alternativeGroup).toBeNull()

    const ownedBy2WithDefaultOwner = await GRAPHQL_CLIENT_2.query(`
    mutation {
        createAllThree(input: {
            editors: ["user2@test.com"]
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedBy2WithDefaultOwner, null, 4))
    expect(ownedBy2WithDefaultOwner.data.createAllThree).toBeTruthy()
    expect(ownedBy2WithDefaultOwner.data.createAllThree.owner).toEqual("user2@test.com")
    expect(ownedBy2WithDefaultOwner.data.createAllThree.editors[0]).toEqual("user2@test.com")
    expect(ownedBy2WithDefaultOwner.data.createAllThree.groups).toBeNull()
    expect(ownedBy2WithDefaultOwner.data.createAllThree.alternativeGroup).toBeNull()

    const ownedByEditorsUnauthed = await GRAPHQL_CLIENT_2.query(`
    mutation {
        createAllThree(input: {
            owner: null,
            editors: ["user1@test.com"]
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedByEditorsUnauthed, null, 4))
    expect(ownedByEditorsUnauthed.errors.length).toEqual(1)
    expect((ownedByEditorsUnauthed.errors[0] as any).errorType).toEqual('Unauthorized')


    const deleteReq = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedBy2.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedBy2.data.createAllThree.id)

    const deleteReq2 = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedBy2WithDefaultOwner.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq2, null, 4))
    expect(deleteReq2.data.deleteAllThree.id).toEqual(ownedBy2WithDefaultOwner.data.createAllThree.id)
})

test(`Test createAllThree as a member of a dynamic group.`, async () => {
    const ownedByDevs = await GRAPHQL_CLIENT_2.query(`
    mutation {
        createAllThree(input: {
            owner: null,
            editors: [],
            groups: ["Devs"]
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedByDevs, null, 4))
    expect(ownedByDevs.data.createAllThree).toBeTruthy()
    expect(ownedByDevs.data.createAllThree.owner).toBeNull()
    expect(ownedByDevs.data.createAllThree.editors).toHaveLength(0)
    expect(ownedByDevs.data.createAllThree.groups[0]).toEqual("Devs")
    expect(ownedByDevs.data.createAllThree.alternativeGroup).toBeNull()

    const ownedByAdminsUnauthed = await GRAPHQL_CLIENT_3.query(`
    mutation {
        createAllThree(input: {
            owner: null,
            editors: [],
            groups: ["Devs"]
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedByAdminsUnauthed, null, 4))
    expect(ownedByAdminsUnauthed.errors.length).toEqual(1)
    expect((ownedByAdminsUnauthed.errors[0] as any).errorType).toEqual('Unauthorized')

    const deleteReq = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedByDevs.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedByDevs.data.createAllThree.id)
})

test(`Test createAllThree as a member of the alternative group.`, async () => {
    const ownedByAdmins = await GRAPHQL_CLIENT_2.query(`
    mutation {
        createAllThree(input: {
            owner: null,
            editors: [],
            alternativeGroup: "Devs"
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedByAdmins, null, 4))
    expect(ownedByAdmins.data.createAllThree).toBeTruthy()
    expect(ownedByAdmins.data.createAllThree.owner).toBeNull()
    expect(ownedByAdmins.data.createAllThree.editors).toHaveLength(0)
    expect(ownedByAdmins.data.createAllThree.alternativeGroup).toEqual("Devs")

    const ownedByAdminsUnauthed = await GRAPHQL_CLIENT_3.query(`
    mutation {
        createAllThree(input: {
            owner: null,
            editors: [],
            alternativeGroup: "Admin"
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedByAdminsUnauthed, null, 4))
    expect(ownedByAdminsUnauthed.errors.length).toEqual(1)
    expect((ownedByAdminsUnauthed.errors[0] as any).errorType).toEqual('Unauthorized')

    const deleteReq = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedByAdmins.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedByAdmins.data.createAllThree.id)
})

/**
 * Update Mutation Tests
 */


test(`Test updateAllThree and deleteAllThree as admin.`, async () => {
    const ownedBy2 = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createAllThree(input: {
            editors: []
            owner: "user2@test.com"
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedBy2, null, 4))
    expect(ownedBy2.data.createAllThree).toBeTruthy()
    // set by input
    expect(ownedBy2.data.createAllThree.owner).toEqual("user2@test.com")
    // auto filled as logged in user.
    expect(ownedBy2.data.createAllThree.editors).toHaveLength(0)
    expect(ownedBy2.data.createAllThree.groups).toBeNull()
    expect(ownedBy2.data.createAllThree.alternativeGroup).toBeNull()

    const ownedByTwoUpdate = await GRAPHQL_CLIENT_1.query(`
    mutation {
        updateAllThree(input: {
            id: "${ownedBy2.data.createAllThree.id}",
            alternativeGroup: "Devs"
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedByTwoUpdate, null, 4))
    expect(ownedByTwoUpdate.data.updateAllThree).toBeTruthy()
    // set by input
    expect(ownedByTwoUpdate.data.updateAllThree.owner).toEqual("user2@test.com")
    // set by input
    expect(ownedByTwoUpdate.data.updateAllThree.editors).toHaveLength(0)
    expect(ownedByTwoUpdate.data.updateAllThree.groups).toBeNull()
    expect(ownedByTwoUpdate.data.updateAllThree.alternativeGroup).toEqual("Devs")

    const deleteReq = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedBy2.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedBy2.data.createAllThree.id)
})

test(`Test updateAllThree and deleteAllThree as owner.`, async () => {
    const ownedBy2 = await GRAPHQL_CLIENT_2.query(`
    mutation {
        createAllThree(input: {
            owner: "user2@test.com",
            editors: []
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedBy2, null, 4))
    expect(ownedBy2.data.createAllThree).toBeTruthy()
    expect(ownedBy2.data.createAllThree.owner).toEqual("user2@test.com")
    expect(ownedBy2.data.createAllThree.editors).toHaveLength(0)
    expect(ownedBy2.data.createAllThree.groups).toBeNull()
    expect(ownedBy2.data.createAllThree.alternativeGroup).toBeNull()

    const ownedBy2Update = await GRAPHQL_CLIENT_2.query(`
    mutation {
        updateAllThree(input: {
            id: "${ownedBy2.data.createAllThree.id}",
            alternativeGroup: "Devs"
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedBy2Update, null, 4))
    expect(ownedBy2Update.data.updateAllThree).toBeTruthy()
    // set by input
    expect(ownedBy2Update.data.updateAllThree.owner).toEqual("user2@test.com")
    // set by input
    expect(ownedBy2Update.data.updateAllThree.editors).toHaveLength(0)
    expect(ownedBy2Update.data.updateAllThree.groups).toBeNull()
    expect(ownedBy2Update.data.updateAllThree.alternativeGroup).toEqual("Devs")


    const deleteReq = await GRAPHQL_CLIENT_2.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedBy2.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedBy2.data.createAllThree.id)
})

test(`Test updateAllThree and deleteAllThree as one of a set of editors.`, async () => {
    const ownedBy2 = await GRAPHQL_CLIENT_2.query(`
    mutation {
        createAllThree(input: {
            owner: null,
            editors: ["user2@test.com"]
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedBy2, null, 4))
    expect(ownedBy2.data.createAllThree).toBeTruthy()
    expect(ownedBy2.data.createAllThree.owner).toBeNull()
    expect(ownedBy2.data.createAllThree.editors[0]).toEqual("user2@test.com")
    expect(ownedBy2.data.createAllThree.groups).toBeNull()
    expect(ownedBy2.data.createAllThree.alternativeGroup).toBeNull()

    const ownedByUpdate = await GRAPHQL_CLIENT_2.query(`
    mutation {
        updateAllThree(input: {
            id: "${ownedBy2.data.createAllThree.id}",
            alternativeGroup: "Devs"
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedByUpdate, null, 4))
    expect(ownedByUpdate.data.updateAllThree).toBeTruthy()
    // set by input
    expect(ownedByUpdate.data.updateAllThree.owner).toBeNull()
    // set by input
    expect(ownedByUpdate.data.updateAllThree.editors[0]).toEqual("user2@test.com")
    expect(ownedByUpdate.data.updateAllThree.groups).toBeNull()
    expect(ownedByUpdate.data.updateAllThree.alternativeGroup).toEqual("Devs")

    const deleteReq = await GRAPHQL_CLIENT_2.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedBy2.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedBy2.data.createAllThree.id)
})

test(`Test updateAllThree and deleteAllThree as a member of a dynamic group.`, async () => {
    const ownedByDevs = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createAllThree(input: {
            owner: null,
            editors: [],
            groups: ["Devs"]
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedByDevs, null, 4))
    expect(ownedByDevs.data.createAllThree).toBeTruthy()
    expect(ownedByDevs.data.createAllThree.owner).toBeNull()
    expect(ownedByDevs.data.createAllThree.editors).toHaveLength(0)
    expect(ownedByDevs.data.createAllThree.groups[0]).toEqual("Devs")
    expect(ownedByDevs.data.createAllThree.alternativeGroup).toBeNull()

    const ownedByUpdate = await GRAPHQL_CLIENT_2.query(`
    mutation {
        updateAllThree(input: {
            id: "${ownedByDevs.data.createAllThree.id}",
            alternativeGroup: "Devs"
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedByUpdate, null, 4))
    expect(ownedByUpdate.data.updateAllThree).toBeTruthy()
    // set by input
    expect(ownedByUpdate.data.updateAllThree.owner).toBeNull()
    // set by input
    expect(ownedByUpdate.data.updateAllThree.editors).toHaveLength(0)
    expect(ownedByUpdate.data.updateAllThree.groups[0]).toEqual("Devs")
    expect(ownedByUpdate.data.updateAllThree.alternativeGroup).toEqual("Devs")

    const ownedByAdminsUnauthed = await GRAPHQL_CLIENT_3.query(`
    mutation {
        createAllThree(input: {
            owner: null,
            editors: [],
            groups: ["Devs"]
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedByAdminsUnauthed, null, 4))
    expect(ownedByAdminsUnauthed.errors.length).toEqual(1)
    expect((ownedByAdminsUnauthed.errors[0] as any).errorType).toEqual('Unauthorized')

    const deleteReq = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedByDevs.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedByDevs.data.createAllThree.id)
})

test(`Test updateAllThree and deleteAllThree as a member of the alternative group.`, async () => {
    const ownedByDevs = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createAllThree(input: {
            owner: null,
            editors: [],
            alternativeGroup: "Devs"
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedByDevs, null, 4))
    expect(ownedByDevs.data.createAllThree).toBeTruthy()
    expect(ownedByDevs.data.createAllThree.owner).toBeNull()
    expect(ownedByDevs.data.createAllThree.editors).toHaveLength(0)
    expect(ownedByDevs.data.createAllThree.alternativeGroup).toEqual("Devs")

    const ownedByUpdate = await GRAPHQL_CLIENT_2.query(`
    mutation {
        updateAllThree(input: {
            id: "${ownedByDevs.data.createAllThree.id}",
            alternativeGroup: "Admin"
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedByUpdate, null, 4))
    expect(ownedByUpdate.data.updateAllThree).toBeTruthy()
    // set by input
    expect(ownedByUpdate.data.updateAllThree.owner).toBeNull()
    // set by input
    expect(ownedByUpdate.data.updateAllThree.editors).toHaveLength(0)
    expect(ownedByUpdate.data.updateAllThree.groups).toBeNull()
    expect(ownedByUpdate.data.updateAllThree.alternativeGroup).toEqual("Admin")

    const ownedByAdminsUnauthed = await GRAPHQL_CLIENT_2.query(`
    mutation {
        updateAllThree(input: {
            id: "${ownedByDevs.data.createAllThree.id}",
            alternativeGroup: "Dev"
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedByAdminsUnauthed, null, 4))
    expect(ownedByAdminsUnauthed.errors.length).toEqual(1)
    expect((ownedByAdminsUnauthed.errors[0] as any).errorType).toEqual('DynamoDB:ConditionalCheckFailedException')

    const ownedByDevs2 = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createAllThree(input: {
            owner: null,
            editors: [],
            alternativeGroup: "Devs"
        }) {
            id
            owner
            editors
            groups
            alternativeGroup
        }
    }
    `)
    console.log(JSON.stringify(ownedByDevs2, null, 4))
    expect(ownedByDevs2.data.createAllThree).toBeTruthy()
    expect(ownedByDevs2.data.createAllThree.owner).toBeNull()
    expect(ownedByDevs2.data.createAllThree.editors).toHaveLength(0)
    expect(ownedByDevs2.data.createAllThree.alternativeGroup).toEqual("Devs")

    const deleteReq2 = await GRAPHQL_CLIENT_2.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedByDevs2.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq2, null, 4))
    expect(deleteReq2.data.deleteAllThree.id).toEqual(ownedByDevs2.data.createAllThree.id)

    const deleteReq = await GRAPHQL_CLIENT_1.query(`
        mutation {
            deleteAllThree(input: { id: "${ownedByDevs.data.createAllThree.id}" }) {
                id
            }
        }
    `)
    console.log(JSON.stringify(deleteReq, null, 4))
    expect(deleteReq.data.deleteAllThree.id).toEqual(ownedByDevs.data.createAllThree.id)
})

test(`Test createTestIdentity as admin.`, async () => {
    const ownedBy2 = await GRAPHQL_CLIENT_1.query(`
    mutation {
        createTestIdentity(input: {
            title: "Test title"
        }) {
            id
            title
            owner
        }
    }
    `)
    console.log(JSON.stringify(ownedBy2, null, 4))
    expect(ownedBy2.data.createTestIdentity).toBeTruthy()
    expect(ownedBy2.data.createTestIdentity.title).toEqual("Test title")
    expect(ownedBy2.data.createTestIdentity.owner.slice(0, 19)).toEqual("https://cognito-idp")

    // user 2 should be able to update because they share the same issuer.
    const update = await GRAPHQL_CLIENT_3.query(`
    mutation {
        updateTestIdentity(input: {
            id: "${ownedBy2.data.createTestIdentity.id}",
            title: "Test title update"
        }) {
            id
            title
            owner
        }
    }
    `)
    console.log(JSON.stringify(update, null, 4))
    expect(update.data.updateTestIdentity).toBeTruthy()
    expect(update.data.updateTestIdentity.title).toEqual("Test title update")
    expect(update.data.updateTestIdentity.owner.slice(0, 19)).toEqual("https://cognito-idp")

    // user 2 should be able to get because they share the same issuer.
    const getReq = await GRAPHQL_CLIENT_3.query(`
    query {
        getTestIdentity(id: "${ownedBy2.data.createTestIdentity.id}") {
            id
            title
            owner
        }
    }
    `)
    console.log(JSON.stringify(getReq, null, 4))
    expect(getReq.data.getTestIdentity).toBeTruthy()
    expect(getReq.data.getTestIdentity.title).toEqual("Test title update")
    expect(getReq.data.getTestIdentity.owner.slice(0, 19)).toEqual("https://cognito-idp")

    const listResponse = await GRAPHQL_CLIENT_3.query(`query {
        listTestIdentitys(filter: { title: { eq: "Test title update" } }, limit: 100) {
            items {
                id
                title
                owner
            }
        }
    }`, {})
    const relevantPost = listResponse.data.listTestIdentitys.items.find(p => p.id === getReq.data.getTestIdentity.id)
    console.log(JSON.stringify(listResponse, null, 4))
    expect(relevantPost).toBeTruthy()
    expect(relevantPost.title).toEqual("Test title update")
    expect(relevantPost.owner.slice(0, 19)).toEqual("https://cognito-idp")

    // user 2 should be able to delete because they share the same issuer.
    const delReq = await GRAPHQL_CLIENT_3.query(`
    mutation {
        deleteTestIdentity(input: {
            id: "${ownedBy2.data.createTestIdentity.id}"
        }) {
            id
            title
            owner
        }
    }
    `)
    console.log(JSON.stringify(delReq, null, 4))
    expect(delReq.data.deleteTestIdentity).toBeTruthy()
    expect(delReq.data.deleteTestIdentity.title).toEqual("Test title update")
    expect(delReq.data.deleteTestIdentity.owner.slice(0, 19)).toEqual("https://cognito-idp")
})

/**
 * Test 'operations' argument
 */
test('Test get and list with \'read\' operation set', async () => {
    const response = await GRAPHQL_CLIENT_1.query(`mutation {
        createOwnerReadProtected(input: { content: "Hello, World!", owner: "${USERNAME1}" }) {
            id
            content
            owner
        }
    }`, {})
    console.log(response);
    expect(response.data.createOwnerReadProtected.id).toBeDefined()
    expect(response.data.createOwnerReadProtected.content).toEqual('Hello, World!')
    expect(response.data.createOwnerReadProtected.owner).toEqual(USERNAME1)

    const response2 = await GRAPHQL_CLIENT_2.query(`query {
        getOwnerReadProtected(id: "${response.data.createOwnerReadProtected.id}") {
            id content owner
        }
    }`, {})
    console.log(response2);
    expect(response2.data.getOwnerReadProtected).toBeNull()
    expect(response2.errors).toHaveLength(1)

    const response3 = await GRAPHQL_CLIENT_1.query(`query {
        getOwnerReadProtected(id: "${response.data.createOwnerReadProtected.id}") {
            id content owner
        }
    }`, {})
    console.log(response3);
    expect(response3.data.getOwnerReadProtected.id).toBeDefined()
    expect(response3.data.getOwnerReadProtected.content).toEqual('Hello, World!')
    expect(response3.data.getOwnerReadProtected.owner).toEqual(USERNAME1)

    const response4 = await GRAPHQL_CLIENT_1.query(`query {
        listOwnerReadProtecteds {
            items {
                id content owner
            }
        }
    }`, {})
    console.log(response4);
    expect(response4.data.listOwnerReadProtecteds.items.length).toBeGreaterThanOrEqual(1);

    const response5 = await GRAPHQL_CLIENT_2.query(`query {
        listOwnerReadProtecteds {
            items {
                id content owner
            }
        }
    }`, {})
    console.log(response5);
    expect(response5.data.listOwnerReadProtecteds.items).toHaveLength(0);
})

test('Test createOwnerCreateUpdateDeleteProtected with \'create\' operation set', async () => {
    const response = await GRAPHQL_CLIENT_1.query(`mutation {
        createOwnerCreateUpdateDeleteProtected(input: { content: "Hello, World!", owner: "${USERNAME1}" }) {
            id
            content
            owner
        }
    }`, {})
    console.log(response);
    expect(response.data.createOwnerCreateUpdateDeleteProtected.id).toBeDefined()
    expect(response.data.createOwnerCreateUpdateDeleteProtected.content).toEqual('Hello, World!')
    expect(response.data.createOwnerCreateUpdateDeleteProtected.owner).toEqual(USERNAME1)

    const response2 = await GRAPHQL_CLIENT_1.query(`mutation {
        createOwnerCreateUpdateDeleteProtected(input: { content: "Hello, World!", owner: "${USERNAME2}" }) {
            id
            content
            owner
        }
    }`, {})
    console.log(response2);
    expect(response2.data.createOwnerCreateUpdateDeleteProtected).toBeNull()
    expect(response2.errors).toHaveLength(1)
})

test('Test updateOwnerCreateUpdateDeleteProtected with \'update\' operation set', async () => {
    const response = await GRAPHQL_CLIENT_1.query(`mutation {
        createOwnerCreateUpdateDeleteProtected(input: { content: "Hello, World!", owner: "${USERNAME1}" }) {
            id
            content
            owner
        }
    }`, {})
    console.log(response);
    expect(response.data.createOwnerCreateUpdateDeleteProtected.id).toBeDefined()
    expect(response.data.createOwnerCreateUpdateDeleteProtected.content).toEqual('Hello, World!')
    expect(response.data.createOwnerCreateUpdateDeleteProtected.owner).toEqual(USERNAME1)

    const response2 = await GRAPHQL_CLIENT_2.query(`mutation {
        updateOwnerCreateUpdateDeleteProtected(
            input: {
                id: "${response.data.createOwnerCreateUpdateDeleteProtected.id}",
                content: "Bye, World!"
            }
        ) {
            id
            content
            owner
        }
    }`, {})
    console.log(response2);
    expect(response2.data.updateOwnerCreateUpdateDeleteProtected).toBeNull()
    expect(response2.errors).toHaveLength(1)

    const response3 = await GRAPHQL_CLIENT_1.query(`mutation {
        updateOwnerCreateUpdateDeleteProtected(
            input: {
                id: "${response.data.createOwnerCreateUpdateDeleteProtected.id}",
                content: "Bye, World!"
            }
        ) {
            id
            content
            owner
        }
    }`, {})
    console.log(response3);
    expect(response3.data.updateOwnerCreateUpdateDeleteProtected.id).toBeDefined()
    expect(response3.data.updateOwnerCreateUpdateDeleteProtected.content).toEqual('Bye, World!')
    expect(response3.data.updateOwnerCreateUpdateDeleteProtected.owner).toEqual(USERNAME1)
})

test('Test deleteOwnerCreateUpdateDeleteProtected with \'update\' operation set', async () => {
    const response = await GRAPHQL_CLIENT_1.query(`mutation {
        createOwnerCreateUpdateDeleteProtected(input: { content: "Hello, World!", owner: "${USERNAME1}" }) {
            id
            content
            owner
        }
    }`, {})
    console.log(response);
    expect(response.data.createOwnerCreateUpdateDeleteProtected.id).toBeDefined()
    expect(response.data.createOwnerCreateUpdateDeleteProtected.content).toEqual('Hello, World!')
    expect(response.data.createOwnerCreateUpdateDeleteProtected.owner).toEqual(USERNAME1)

    const response2 = await GRAPHQL_CLIENT_2.query(`mutation {
        deleteOwnerCreateUpdateDeleteProtected(
            input: {
                id: "${response.data.createOwnerCreateUpdateDeleteProtected.id}"
            }
        ) {
            id
            content
            owner
        }
    }`, {})
    console.log(response2);
    expect(response2.data.deleteOwnerCreateUpdateDeleteProtected).toBeNull()
    expect(response2.errors).toHaveLength(1)

    const response3 = await GRAPHQL_CLIENT_1.query(`mutation {
        deleteOwnerCreateUpdateDeleteProtected(
            input: {
                id: "${response.data.createOwnerCreateUpdateDeleteProtected.id}"
            }
        ) {
            id
            content
            owner
        }
    }`, {})
    console.log(response3);
    expect(response3.data.deleteOwnerCreateUpdateDeleteProtected.id).toBeDefined()
    expect(response3.data.deleteOwnerCreateUpdateDeleteProtected.content).toEqual('Hello, World!')
    expect(response3.data.deleteOwnerCreateUpdateDeleteProtected.owner).toEqual(USERNAME1)
})
