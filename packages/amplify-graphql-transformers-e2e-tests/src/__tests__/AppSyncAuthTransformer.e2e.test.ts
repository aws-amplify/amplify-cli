import {
    ObjectTypeDefinitionNode, DirectiveNode, parse, FieldDefinitionNode, DocumentNode, DefinitionNode,
    Kind
} from 'graphql'
import Amplify, { Auth } from 'aws-amplify';
import { ResourceConstants } from 'amplify-graphql-transformer-common'
import GraphQLTransform from 'amplify-graphql-transform'
import AppSyncDynamoDBTransformer from 'amplify-graphql-dynamodb-transformer'
import AppSyncAuthTransformer from 'amplify-graphql-auth-transformer'
import { CloudFormationClient } from '../CloudFormationClient'
import { Output } from 'aws-sdk/clients/cloudformation'
import TestStorage from '../TestStorage'
import { GraphQLClient } from '../GraphQLClient'

// to deal with bug in cognito-identity-js
(global as any).fetch = require("node-fetch");

jest.setTimeout(200000);

const cf = new CloudFormationClient('us-west-2')
const STACK_NAME = 'TestAppSyncAuthTransformerTest'

let GRAPHQL_ENDPOINT = undefined;

/**
 * Client 1 is logged in as testuser who is is the Admin and Dev groups.
 */
let GRAPHQL_CLIENT_1 = undefined;

/**
 * Client 2 is logged in as invaliduser who is is the Dev group.
 */
let GRAPHQL_CLIENT_2 = undefined;

const USERNAME1 = 'testuser'
const USERPASSWORD1 = '9S^tp^nv5wWJ2jIv'

const USERNAME2 = 'invaliduser'
const USERPASSWORD2 = 'HbD*D94xS86%ymhc'

function outputValueSelector(key: string) {
    return (outputs: Output[]) => {
        const output = outputs.find((o: Output) => o.OutputKey === key)
        return output ? output.OutputValue : null
    }
}

// type Membership @model @auth(allow: groups, groupsField: "group") {
//     id: ID!
//     member: String
//     group: String
// }
// type Editable @model @auth(allow: groups, groupsField: "groups") {
//     id: ID!
//     content: String
//     groups: [String]
// }

beforeAll(async () => {
    // Create a stack for the post model with auth enabled.
    const validSchema = `
    type Post @model @auth(allow: owner) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
        owner: String
    }
    type Salary @model @auth(allow: groups, groups: ["Admin"]) {
        id: ID!
        wage: Int
    }
    type ManyGroupProtected @model @auth(allow: groups, groupsField: "groups") {
        id: ID!
        value: Int
        groups: [String]
    }
    type SingleGroupProtected @model @auth(allow: groups, groupsField: "group") {
        id: ID!
        value: Int
        group: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncDynamoDBTransformer(),
            new AppSyncAuthTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    try {
        console.log('Creating Stack ' + STACK_NAME)
        const userPoolId = 'us-west-2_21A7JBDkX'
        const createStackResponse = await cf.createStack(out, STACK_NAME, userPoolId)
        expect(createStackResponse).toBeDefined()
        const finishedStack = await cf.waitForStack(STACK_NAME)
        // Arbitrary wait to make sure everything is ready.
        await cf.wait(10, () => Promise.resolve())
        console.log('Successfully created stack ' + STACK_NAME)
        expect(finishedStack).toBeDefined()
        const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput)
        const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput)
        // const getUserPoolId = outputValueSelector(ResourceConstants.OUTPUTS.AuthCognitoUserPoolIdOutput)
        const getUserPoolClientID = outputValueSelector(ResourceConstants.OUTPUTS.AuthCognitoUserPoolJSClientOutput)
        GRAPHQL_ENDPOINT = getApiEndpoint(finishedStack.Outputs)
        const apiKey = getApiKey(finishedStack.Outputs)
        const userPoolClientId = getUserPoolClientID(finishedStack.Outputs)
        console.log(`UserPoolId: ${userPoolId}. UserPoolClientId: ${userPoolClientId}`)
        expect(apiKey).toBeDefined()
        expect(GRAPHQL_ENDPOINT).toBeDefined()
        expect(userPoolId).toBeDefined()
        expect(userPoolClientId).toBeDefined()
        Amplify.configure({
            Auth: {
                // REQUIRED - Amazon Cognito Region
                region: 'us-west-2',
                userPoolId: userPoolId,
                userPoolWebClientId: userPoolClientId,
                storage: new TestStorage()
            }
        })
        console.log(`Signing in as ${USERNAME1}`)
        await Auth.signIn(USERNAME1, USERPASSWORD1)
        const session = await Auth.currentSession()
        const idToken = session.getIdToken().getJwtToken()
        console.log("USER TOKEN!")
        console.log(idToken)
        GRAPHQL_CLIENT_1 = new GraphQLClient(GRAPHQL_ENDPOINT, { Authorization: idToken })

        console.log(`Signing in as ${USERNAME2}`)
        await Auth.signIn(USERNAME2, USERPASSWORD2)
        const session2 = await Auth.currentSession()
        const idToken2 = session2.getIdToken().getJwtToken()
        console.log("USER TOKEN 2!")
        console.log(idToken2)
        GRAPHQL_CLIENT_2 = new GraphQLClient(GRAPHQL_ENDPOINT, { Authorization: idToken2 })
        console.log(`Signing up for pool ${userPoolId} w/ client ${userPoolClientId}`)

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
        // await cf.deleteStack(STACK_NAME)
        // await cf.waitForStack(STACK_NAME)
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
        expect(response.data.createPost.id).toBeDefined()
        expect(response.data.createPost.title).toEqual('Hello, World!')
        expect(response.data.createPost.createdAt).toBeDefined()
        expect(response.data.createPost.updatedAt).toBeDefined()
        expect(response.data.createPost.owner).toBeDefined()
    } catch (e) {
        console.error(JSON.stringify(e.response.data))
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
        expect(response.data.createPost.owner).toBeDefined()
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
        expect(getResponse.data.getPost.owner).toBeDefined()
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
        expect(response.data.createPost.owner).toBeDefined()
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
        expect(response.data.createPost.owner).toBeDefined()
        const deleteResponse = await GRAPHQL_CLIENT_1.query(`mutation {
            deletePost(input: { id: "${response.data.createPost.id}" }) {
                id
            }
        }`, {})
        expect(deleteResponse.data.deletePost.id).toEqual(response.data.createPost.id)
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
        expect(response.data.createPost.owner).toBeDefined()
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
        console.error(JSON.stringify(e.response.data))
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test listPost mutation when authorized', async () => {
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
        expect(firstPost.data.createPost.owner).toBeDefined()
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
            listPost(filter: { title: { eq: "testing list" } }, limit: 25) {
                items {
                    id
                }
            }
        }`, {})
        console.log(JSON.stringify(listResponse, null, 4))
        expect(listResponse.data.listPost.items.length).toEqual(1)
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
        console.log(JSON.stringify(req, null, 4))
        expect(req.data.createSalary.id).toBeDefined()
        expect(req.data.createSalary.wage).toEqual(10)
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

test(`Test createSalary w/ Admin group protection not unauthorized`, async () => {
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
        expect(req.data.createSalary).toEqual(null)
        expect(req.errors.length).toEqual(1)
        expect((req.errors[0] as any).errorType).toEqual('Unauthorized')
    } catch (e) {
        expect(e).toBeUndefined()
    }
})

test(`Test updateSalary w/ Admin group protection authorized`, async () => {
    try {
        const req = await GRAPHQL_CLIENT_1.query(`
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
        expect(req2.data.updateSalary.id).toEqual(req.data.createSalary.id)
        expect(req2.data.updateSalary.wage).toEqual(12)
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

test(`Test updateSalary w/ Admin group protection not authorized`, async () => {
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
        expect((req2.errors[0] as any).errorType).toEqual('Unauthorized')
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
        expect((req2.errors[0] as any).errorType).toEqual('Unauthorized')
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

test(`Test getSalary w/ Admin group protection authorized`, async () => {
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

test(`Test listSalary w/ Admin group protection authorized`, async () => {
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
            listSalary(filter: { wage: { eq: 101 }}) {
                items {
                    id
                    wage
                }
            }
        }
        `)
        expect(req2.data.listSalary.items.length).toEqual(1)
        expect(req2.data.listSalary.items[0].id).toEqual(req.data.createSalary.id)
        expect(req2.data.listSalary.items[0].wage).toEqual(101)
    } catch (e) {
        console.error(e)
        expect(e).toBeUndefined()
    }
})

test(`Test listSalary w/ Admin group protection not authorized`, async () => {
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
            listSalary(filter: { wage: { eq: 102 }}) {
                items {
                    id
                    wage
                }
            }
        }
        `)
        expect(req2.data.listSalary).toEqual(null)
        expect(req2.errors.length).toEqual(1)
        expect((req2.errors[0] as any).errorType).toEqual('Unauthorized')
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
