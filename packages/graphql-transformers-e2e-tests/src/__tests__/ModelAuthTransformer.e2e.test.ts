import {
    ObjectTypeDefinitionNode, DirectiveNode, parse, FieldDefinitionNode, DocumentNode, DefinitionNode,
    Kind
} from 'graphql'
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
import { CreateBucketRequest, CreateBucketOutput } from 'aws-sdk/clients/s3'
import {
    CreateGroupRequest, CreateGroupResponse,
    AdminAddUserToGroupRequest
} from 'aws-sdk/clients/cognitoidentityserviceprovider'
import {
    AuthenticationDetails,
} from 'amazon-cognito-identity-js';
import TestStorage from '../TestStorage'
import { GraphQLClient } from '../GraphQLClient'
import AppSyncTransformer from 'graphql-appsync-transformer'
import { S3Client } from '../S3Client';
import * as path from 'path'
import { deploy, cleanupS3Bucket } from '../deploy'
import * as moment from 'moment';

// to deal with bug in cognito-identity-js
(global as any).fetch = require("node-fetch");

jest.setTimeout(2000000);

const cf = new CloudFormationClient('us-west-2')

const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss')
const STACK_NAME = `ModelAuthTransformerTest-${BUILD_TIMESTAMP}`
const BUCKET_NAME = `appsync-auth-transformer-test-bucket-${BUILD_TIMESTAMP}`

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

async function signupUser(userPoolId: string, name: string, pw: string) {
    return new Promise((res, rej) => {
        const createUser = cognitoClient.adminCreateUser.bind(cognitoClient) as any;
        createUser({
            UserPoolId: userPoolId,
            UserAttributes: [{ Name: 'email', Value: name }],
            Username: name,
            TemporaryPassword: pw
        }, (err, data) => err ? rej(err) : res(data));
    })
}

async function authenticateUser(user: any, details: any) {
    return new Promise((res, rej) => {
        user.authenticateUser(details, {
            onSuccess: function (result: any) {
                res(result)
            },
            onFailure: function (err: any) {
                rej(err)
            },
            newPasswordRequired: function (userAttributes: any, requiredAttributes: any) {
                console.log('New password')
                console.log(userAttributes)
                console.log(userAttributes)
                user.completeNewPasswordChallenge(REAL_PASSWORD, user.Attributes, this)
            }
        });
    })
}

async function signupAndAuthenticateUser(userPoolId: string, username: string) {
    try {
        // Sign up then login user 1.ß
        await signupUser(userPoolId, username, TMP_PASSWORD)
    } catch (e) {
        console.log(`Trying to login with temp password`)
    }

    try {
        const authDetails = new AuthenticationDetails({
            Username: username,
            Password: TMP_PASSWORD
        });
        const user = Amplify.Auth.createCognitoUser(username)
        const authRes = await authenticateUser(user, authDetails);
        return authRes;
    } catch (e) { console.log(`Trying to login with real password`) }

    try {
        const authDetails = new AuthenticationDetails({
            Username: username,
            Password: REAL_PASSWORD
        });
        const user = Amplify.Auth.createCognitoUser(username)
        const authRes: any = await authenticateUser(user, authDetails);
        console.log(`Logged in ${username} \n${authRes.getIdToken().getJwtToken()}`)
        return authRes;
    } catch (e) {
        console.error(`Failed to login.\n`)
        console.error(e)
    }
}

async function createGroup(userPoolId: string, name: string): Promise<CreateGroupResponse> {
    return new Promise((res, rej) => {
        const params: CreateGroupRequest = {
            GroupName: name,
            UserPoolId: userPoolId
        }
        cognitoClient.createGroup(params, (err, data) => err ? rej(err) : res(data))
    })
}

async function addUserToGroup(groupName: string, username: string, userPoolId: string) {
    return new Promise((res, rej) => {
        const params: AdminAddUserToGroupRequest = {
            GroupName: groupName,
            Username: username,
            UserPoolId: userPoolId
        }
        cognitoClient.adminAddUserToGroup(params, (err, data) => err ? rej(err) : res(data))
    })
}

async function createBucket(name: string) {
    return new Promise((res, rej) => {
        const params: CreateBucketRequest = {
            Bucket: name,
        }
        awsS3Client.createBucket(params, (err, data) => err ? rej(err) : res(data))
    })
}

async function deleteBucket(name: string) {
    return new Promise((res, rej) => {
        const params: CreateBucketRequest = {
            Bucket: name,
        }
        awsS3Client.deleteBucket(params, (err, data) => err ? rej(err) : res(data))
    })
}

const TMP_ROOT = '/tmp/model_auth_transform_tests/'

const ROOT_KEY = ''

beforeAll(async () => {
    // Create a stack for the post model with auth enabled.
    if (!fs.existsSync(TMP_ROOT)) {
        fs.mkdirSync(TMP_ROOT);
    }
    await createBucket(BUCKET_NAME)
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
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(TMP_ROOT),
            new DynamoDBModelTransformer(),
            new ModelAuthTransformer()
        ]
    })
    try {
        // Clean the bucket
        deleteDirectory(TMP_ROOT)
        const out = transformer.transform(validSchema)

        const finishedStack = await deploy(
            customS3Client, cf, STACK_NAME, out, {}, TMP_ROOT, BUCKET_NAME, ROOT_KEY,
            BUILD_TIMESTAMP
        )
        expect(finishedStack).toBeDefined()
        const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput)
        GRAPHQL_ENDPOINT = getApiEndpoint(finishedStack.Outputs)
        console.log(`Using graphql url: ${GRAPHQL_ENDPOINT}`);

        // Get the details of the created user pool
        const userPoolIdSelector = outputValueSelector(ResourceConstants.OUTPUTS.AuthCognitoUserPoolIdOutput)
        const userPoolClientIdSelector = outputValueSelector(ResourceConstants.OUTPUTS.AuthCognitoUserPoolJSClientOutput)
        const userPoolId = userPoolIdSelector(finishedStack.Outputs);
        const userPoolClientId = userPoolClientIdSelector(finishedStack.Outputs);


        // Verify we have all the details
        expect(GRAPHQL_ENDPOINT).toBeTruthy()
        expect(userPoolId).toBeTruthy()
        expect(userPoolClientId).toBeTruthy()

        // Configure Amplify, create users, and sign in.
        Amplify.configure({
            Auth: {
                // REQUIRED - Amazon Cognito Region
                region: 'us-west-2',
                userPoolId: userPoolId,
                userPoolWebClientId: userPoolClientId,
                storage: new TestStorage()
            }
        })

        const authRes: any = await signupAndAuthenticateUser(userPoolId, USERNAME1)
        const authRes2: any = await signupAndAuthenticateUser(userPoolId, USERNAME2)
        const authRes3: any = await signupAndAuthenticateUser(userPoolId, USERNAME3)

        await createGroup(userPoolId, ADMIN_GROUP_NAME)
        await createGroup(userPoolId, PARTICIPANT_GROUP_NAME)
        await createGroup(userPoolId, WATCHER_GROUP_NAME)
        await createGroup(userPoolId, DEVS_GROUP_NAME)
        await addUserToGroup(ADMIN_GROUP_NAME, USERNAME1, userPoolId)
        await addUserToGroup(PARTICIPANT_GROUP_NAME, USERNAME1, userPoolId)
        await addUserToGroup(WATCHER_GROUP_NAME, USERNAME1, userPoolId)
        await addUserToGroup(DEVS_GROUP_NAME, USERNAME2, userPoolId)
        const authResAfterGroup: any = await signupAndAuthenticateUser(userPoolId, USERNAME1)

        const idToken = authResAfterGroup.getIdToken().getJwtToken()
        GRAPHQL_CLIENT_1 = new GraphQLClient(GRAPHQL_ENDPOINT, { Authorization: idToken })

        const accessToken = authResAfterGroup.getAccessToken().getJwtToken()
        GRAPHQL_CLIENT_1_ACCESS = new GraphQLClient(GRAPHQL_ENDPOINT, { Authorization: accessToken })

        const authRes2AfterGroup: any = await signupAndAuthenticateUser(userPoolId, USERNAME2)
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
        console.log('[start] deleting deployment bucket')
        await cleanupS3Bucket(customS3Client, TMP_ROOT, BUCKET_NAME, ROOT_KEY, BUILD_TIMESTAMP)
        await deleteBucket(BUCKET_NAME)
        console.log('[done] deleting deployment bucket')
    } catch (e) {
        console.log(`[error] deleting deployment bucket`)
        console.log(e);
    }
})

/**
 * Test queries below
 */
test('Test createPost mutation', async () => {
    try {
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
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test getPost query when authorized', async () => {
    try {
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
    } catch (e) {
        console.error(e)
        console.error(JSON.stringify(e.response.data))
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test getPost query when not authorized', async () => {
    try {
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
    } catch (e) {
        console.error(e)
        console.error(JSON.stringify(e.response.data))
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test updatePost mutation when authorized', async () => {
    try {
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
    } catch (e) {
        console.error(e)
        console.error(JSON.stringify(e.response.data))
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test updatePost mutation when not authorized', async () => {
    try {
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
    } catch (e) {
        console.error(e)
        console.error(JSON.stringify(e.response.data))
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test deletePost mutation when authorized', async () => {
    try {
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
    } catch (e) {
        console.error(e)
        console.error(JSON.stringify(e.response.data))
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test deletePost mutation when not authorized', async () => {
    try {
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
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test listPosts query when authorized', async () => {
    try {
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
    } catch (e) {
        console.error(e)
        console.error(JSON.stringify(e.response.data))
        // fail
        expect(e).toBeUndefined()
    }
})

/**
 * Static Group Auth
 */
test(`Test createSalary w/ Admin group protection authorized`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

test(`Test update my own salary without admin permission`, async () => {
    try {
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
    } catch (e) {
        expect(e).toBeUndefined()
    }
})

test(`Test updating someone else's salary as an admin`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

test(`Test updating someone else's salary when I am not admin.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

test(`Test deleteSalary w/ Admin group protection authorized`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

test(`Test deleteSalary w/ Admin group protection not authorized`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

test(`Test and Admin can get a salary created by any user`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

test(`Test owner can create and get a salary when not admin`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

test(`Test getSalary w/ Admin group protection not authorized`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

test(`Test listSalarys w/ Admin group protection authorized`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

test(`Test listSalarys w/ Admin group protection not authorized`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

/**
 * Dynamic Group Auth
 */
test(`Test createManyGroupProtected w/ dynamic group protection authorized`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

test(`Test createManyGroupProtected w/ dynamic group protection when not authorized`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

test(`Test createSingleGroupProtected w/ dynamic group protection authorized`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

test(`Test createSingleGroupProtected w/ dynamic group protection when not authorized`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

test(`Test listPWProtecteds when the user is authorized.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
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
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

test(`Test creating, updating, and deleting an admin note as a non admin`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

/**
 * Get Query Tests
 */

test(`Test getAllThree as admin.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

test(`Test getAllThree as owner.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

test(`Test getAllThree as one of a set of editors.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

test(`Test getAllThree as a member of a dynamic group.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

test(`Test getAllThree as a member of the alternative group.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

/**
 * List Query Tests
 */

test(`Test listAllThrees as admin.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

test(`Test listAllThrees as owner.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

test(`Test listAllThrees as one of a set of editors.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

test(`Test listAllThrees as a member of a dynamic group.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

test(`Test getAllThree as a member of the alternative group.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

/**
 * Create Mutation Tests
 */

test(`Test createAllThree as admin.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

test(`Test createAllThree as owner.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

test(`Test createAllThree as one of a set of editors.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

test(`Test createAllThree as a member of a dynamic group.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

test(`Test createAllThree as a member of the alternative group.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

/**
 * Update Mutation Tests
 */


test(`Test updateAllThree and deleteAllThree as admin.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

test(`Test updateAllThree and deleteAllThree as owner.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

test(`Test updateAllThree and deleteAllThree as one of a set of editors.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

test(`Test updateAllThree and deleteAllThree as a member of a dynamic group.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

test(`Test updateAllThree and deleteAllThree as a member of the alternative group.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})

test(`Test createTestIdentity as admin.`, async () => {
    try {
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
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined();
    }
})