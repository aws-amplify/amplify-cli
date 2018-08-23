import {
    ObjectTypeDefinitionNode, DirectiveNode, parse, FieldDefinitionNode, DocumentNode, DefinitionNode,
    Kind
} from 'graphql'
import { ResourceConstants } from 'graphql-transformer-common'
import GraphQLTransform from 'graphql-transformer-core'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'
import AppSyncTransformer from 'graphql-appsync-transformer'
import { CloudFormationClient } from '../CloudFormationClient'
import { Output } from 'aws-sdk/clients/cloudformation'
import { GraphQLClient } from '../GraphQLClient'
import * as moment from 'moment';

jest.setTimeout(200000);

const cf = new CloudFormationClient('us-west-2')

const dateAppender = moment().format('YYYYMMDDHHmmss')
const STACK_NAME = `DynamoDBModelTransformerTest-${dateAppender}`

let GRAPHQL_CLIENT = undefined;

function outputValueSelector(key: string) {
    return (outputs: Output[]) => {
        const output = outputs.find((o: Output) => o.OutputKey === key)
        return output ? output.OutputValue : null
    }
}

beforeAll(async () => {
    const validSchema = `
    type Post @model {
        id: ID!
        title: String!
        createdAt: AWSDateTime
        updatedAt: AWSDateTime
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new DynamoDBModelTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    try {
        console.log('Creating Stack ' + STACK_NAME)
        const createStackResponse = await cf.createStack(out, STACK_NAME)
        expect(createStackResponse).toBeDefined()
        const finishedStack = await cf.waitForStack(STACK_NAME)
        // Arbitrary wait to make sure everything is ready.
        await cf.wait(10, () => Promise.resolve())
        console.log('Successfully created stack ' + STACK_NAME)
        expect(finishedStack).toBeDefined()
        const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput)
        const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput)
        const endpoint = getApiEndpoint(finishedStack.Outputs)
        const apiKey = getApiKey(finishedStack.Outputs)
        expect(apiKey).toBeDefined()
        expect(endpoint).toBeDefined()
        GRAPHQL_CLIENT = new GraphQLClient(endpoint, { 'x-api-key': apiKey })
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
})

/**
 * Test queries below
 */
test('Test createPost mutation', async () => {
    try {
        const response = await GRAPHQL_CLIENT.query(`mutation {
            createPost(input: { title: "Hello, World!" }) {
                id
                title
                createdAt
                updatedAt
            }
        }`, {})
        expect(response.data.createPost.id).toBeDefined()
        expect(response.data.createPost.title).toEqual('Hello, World!')
        expect(response.data.createPost.createdAt).toBeDefined()
        expect(response.data.createPost.updatedAt).toBeDefined()
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test updatePost mutation', async () => {
    try {
        const createResponse = await GRAPHQL_CLIENT.query(`mutation {
            createPost(input: { title: "Test Update" }) {
                id
                title
                createdAt
                updatedAt
            }
        }`, {})
        console.log(JSON.stringify(createResponse, null, 4))
        expect(createResponse.data.createPost.id).toBeDefined()
        expect(createResponse.data.createPost.title).toEqual('Test Update')
        const updateResponse = await GRAPHQL_CLIENT.query(`mutation {
            updatePost(input: { id: "${createResponse.data.createPost.id}", title: "Bye, World!" }) {
                id
                title
            }
        }`, {})
        console.log(JSON.stringify(updateResponse, null, 4))
        expect(updateResponse.data.updatePost.title).toEqual('Bye, World!')
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test deletePost mutation', async () => {
    try {
        const createResponse = await GRAPHQL_CLIENT.query(`mutation {
            createPost(input: { title: "Test Delete" }) {
                id
                title
                createdAt
                updatedAt
            }
        }`, {})
        console.log(JSON.stringify(createResponse, null, 4))
        expect(createResponse.data.createPost.id).toBeDefined()
        expect(createResponse.data.createPost.title).toEqual('Test Delete')
        const deleteResponse = await GRAPHQL_CLIENT.query(`mutation {
            deletePost(input: { id: "${createResponse.data.createPost.id}" }) {
                id
                title
            }
        }`, {})
        console.log(JSON.stringify(deleteResponse, null, 4))
        expect(deleteResponse.data.deletePost.title).toEqual('Test Delete')
        const getResponse = await GRAPHQL_CLIENT.query(`query {
            getPost(id: "${createResponse.data.createPost.id}") {
                id
                title
            }
        }`, {})
        console.log(JSON.stringify(getResponse, null, 4))
        expect(getResponse.data.getPost).toBeNull()
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test getPost query', async () => {
    try {
        const createResponse = await GRAPHQL_CLIENT.query(`mutation {
            createPost(input: { title: "Test Get" }) {
                id
                title
                createdAt
                updatedAt
            }
        }`, {})
        expect(createResponse.data.createPost.id).toBeDefined()
        expect(createResponse.data.createPost.title).toEqual('Test Get')
        const getResponse = await GRAPHQL_CLIENT.query(`query {
            getPost(id: "${createResponse.data.createPost.id}") {
                id
                title
            }
        }`, {})
        expect(getResponse.data.getPost.title).toEqual('Test Get')
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test listPosts query', async () => {
    try {
        const createResponse = await GRAPHQL_CLIENT.query(`mutation {
            createPost(input: { title: "Test List" }) {
                id
                title
                createdAt
                updatedAt
            }
        }`, {})
        expect(createResponse.data.createPost.id).toBeDefined()
        expect(createResponse.data.createPost.title).toEqual('Test List')
        const listResponse = await GRAPHQL_CLIENT.query(`query {
            listPosts {
                items {
                    id
                    title
                }
            }
        }`, {})
        expect(listResponse.data.listPosts.items).toBeDefined()
        const items = listResponse.data.listPosts.items
        expect(items.length).toBeGreaterThan(0)
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test listPosts query with filter', async () => {
    try {
        const createResponse = await GRAPHQL_CLIENT.query(`mutation {
            createPost(input: { title: "Test List with filter" }) {
                id
                title
                createdAt
                updatedAt
            }
        }`, {})
        expect(createResponse.data.createPost.id).toBeDefined()
        expect(createResponse.data.createPost.title).toEqual('Test List with filter')
        const listWithFilterResponse = await GRAPHQL_CLIENT.query(`query {
            listPosts(filter: {
                title: {
                    contains: "List with filter"
                }
            }) {
                items {
                    id
                    title
                }
            }
        }`, {})
        console.log(JSON.stringify(listWithFilterResponse, null, 4))
        expect(listWithFilterResponse.data.listPosts.items).toBeDefined()
        const items = listWithFilterResponse.data.listPosts.items
        expect(items.length).toEqual(1)
        expect(items[0].title).toEqual('Test List with filter')
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})
