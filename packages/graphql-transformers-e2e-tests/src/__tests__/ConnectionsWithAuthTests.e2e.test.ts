import {
    ObjectTypeDefinitionNode, DirectiveNode, parse, FieldDefinitionNode, DocumentNode, DefinitionNode,
    Kind
} from 'graphql'
import Amplify, { Auth } from 'aws-amplify';
import { ResourceConstants } from 'graphql-transformer-common'
import GraphQLTransform from 'graphql-transformer-core'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'
import ModelAuthTransformer from 'graphql-auth-transformer'
import ModelConnectionTransformer from 'graphql-connection-transformer'
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
const STACK_NAME = `ConnectionsWithAuthTests-${BUILD_TIMESTAMP}`
const BUCKET_NAME = `connections-with-auth-test-bucket-${BUILD_TIMESTAMP}`

let GRAPHQL_ENDPOINT = undefined;

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

const TMP_ROOT = '/tmp/connections_with_auth_test/'

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
        author: User @connection(name: "UserPosts", keyField: "owner")
        owner: String
    }
    type User @model @auth(rules: [{ allow: owner }]) {
        id: ID!
        posts: [Post!]! @connection(name: "UserPosts", keyField: "owner")
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(TMP_ROOT),
            new DynamoDBModelTransformer(),
            new ModelAuthTransformer(),
            new ModelConnectionTransformer()
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
 * Tests
 */
test('Test creating a post and immediately view it via the User.posts connection.', async () => {
    try {
        const createUser1 = await GRAPHQL_CLIENT_1.query(`mutation {
            createUser(input: { id: "user1@test.com" }) {
                id
            }
        }`, {})
        console.log(createUser1);
        expect(createUser1.data.createUser.id).toEqual("user1@test.com")

        const response = await GRAPHQL_CLIENT_1.query(`mutation {
            createPost(input: { title: "Hello, World!" }) {
                id
                title
                owner
            }
        }`, {})
        console.log(response);
        expect(response.data.createPost.id).toBeDefined()
        expect(response.data.createPost.title).toEqual('Hello, World!')
        expect(response.data.createPost.owner).toBeDefined()

        const getResponse = await GRAPHQL_CLIENT_1.query(`query {
            getUser(id: "user1@test.com") {
                posts {
                    items {
                        id
                        title
                        owner
                        author {
                            id
                        }
                    }
                }
            }
        }`, {})
        console.log(JSON.stringify(getResponse, null, 4));
        expect(getResponse.data.getUser.posts.items[0].id).toBeDefined()
        expect(getResponse.data.getUser.posts.items[0].title).toEqual("Hello, World!")
        expect(getResponse.data.getUser.posts.items[0].owner).toEqual("user1@test.com")
        expect(getResponse.data.getUser.posts.items[0].author.id).toEqual("user1@test.com")
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})