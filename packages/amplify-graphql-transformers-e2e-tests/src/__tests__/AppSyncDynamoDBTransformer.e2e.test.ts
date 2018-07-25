import {
    ObjectTypeDefinitionNode, DirectiveNode, parse, FieldDefinitionNode, DocumentNode, DefinitionNode,
    Kind
} from 'graphql'
import { ResourceConstants } from 'amplify-graphql-transformer-common'
import GraphQLTransform from 'amplify-graphql-transform'
import AppSyncDynamoDBTransformer from 'amplify-graphql-dynamodb-transformer'
import { CloudFormationClient } from '../CloudFormationClient'
import { Output } from 'aws-sdk/clients/cloudformation'
import { GraphQLClient } from '../GraphQLClient'

jest.setTimeout(200000);

const cf = new CloudFormationClient('us-west-2')
const STACK_NAME = 'TestAppSyncDynamoDBTransformerHappy'

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
        createdAt: String
        updatedAt: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncDynamoDBTransformer()
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

test('Test listPost query', async () => {
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
            listPost {
                items {
                    id
                    title
                }
            }
        }`, {})
        expect(listResponse.data.listPost.items).toBeDefined
        const items = listResponse.data.listPost.items
        expect(items.length).toBeGreaterThan(0)
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test listPost query with filter', async () => {
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
            listPost(filter: {
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
        expect(listWithFilterResponse.data.listPost.items).toBeDefined
        const items = listWithFilterResponse.data.listPost.items
        expect(items.length).toEqual(1)
        expect(items[0].title).toEqual('Test List with filter')
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test queryPost query', async () => {
    try {
        const createResponse = await GRAPHQL_CLIENT.query(`mutation {
            createPost(input: { title: "Test Query" }) {
                id
                title
                createdAt
                updatedAt
            }
        }`, {})
        expect(createResponse.data.createPost.id).toBeDefined()
        expect(createResponse.data.createPost.title).toEqual('Test Query')
        const queryResponse = await GRAPHQL_CLIENT.query(`query {
            queryPost {
                items {
                    id
                    title
                }
            }
        }`, {})
        expect(queryResponse.data.queryPost.items).toBeDefined
        const items = queryResponse.data.queryPost.items
        expect(items.length).toBeGreaterThan(0)
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test queryPost query with filter', async () => {
    try {
        const createResponse = await GRAPHQL_CLIENT.query(`mutation {
            createPost(input: { title: "Test Query with filter" }) {
                id
                title
                createdAt
                updatedAt
            }
        }`, {})
        expect(createResponse.data.createPost.id).toBeDefined()
        expect(createResponse.data.createPost.title).toEqual('Test Query with filter')
        const queryWithFilterResponse = await GRAPHQL_CLIENT.query(`query {
            queryPost(filter: {
                title: {
                    contains: "Query with filter"
                }
            }) {
                items {
                    id
                    title
                }
            }
        }`, {})
        expect(queryWithFilterResponse.data.queryPost.items).toBeDefined
        const items = queryWithFilterResponse.data.queryPost.items
        expect(items.length).toEqual(1)
        expect(items[0].title).toEqual('Test Query with filter')
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test queryPost query with filter with sort direction', async () => {
    try {
        const createResponseOne = await GRAPHQL_CLIENT.query(`mutation {
            createPost(input: { title: "Test Query with filter with sort 1" }) {
                id
                title
                createdAt
                updatedAt
            }
        }`, {})
        expect(createResponseOne.data.createPost.id).toBeDefined()
        expect(createResponseOne.data.createPost.title).toEqual('Test Query with filter with sort 1')

        const createResponseTwo = await GRAPHQL_CLIENT.query(`mutation {
            createPost(input: { title: "Test Query with filter with sort 2" }) {
                id
                title
                createdAt
                updatedAt
            }
        }`, {})
        expect(createResponseTwo.data.createPost.id).toBeDefined()
        expect(createResponseTwo.data.createPost.title).toEqual('Test Query with filter with sort 2')

        const queryWithFilterResponse = await GRAPHQL_CLIENT.query(`query {
            queryPost(sortDirection: ASC, filter: {
                title: {
                    contains: "with sort"
                }
            }) {
                items {
                    id
                    title
                }
            }
        }`, {})
        expect(queryWithFilterResponse.data.queryPost.items).toBeDefined
        const items = queryWithFilterResponse.data.queryPost.items
        expect(items.length).toEqual(2)
        expect(items[0].id < items[1].id).toBeTruthy
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

