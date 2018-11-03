import { ResourceConstants } from 'graphql-transformer-common'
import GraphQLTransform from 'graphql-transformer-core'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'
import AppSyncTransformer from 'graphql-appsync-transformer'
import HttpTransformer from '../../../graphql-http-transformer'
import { CloudFormationClient } from '../CloudFormationClient'
import { Output } from 'aws-sdk/clients/cloudformation'
import { GraphQLClient } from '../GraphQLClient'
import * as moment from 'moment';

jest.setTimeout(200000);

const cf = new CloudFormationClient('us-west-2')

const dateAppender = moment().format('YYYYMMDDHHmmss')
const STACK_NAME = `HttpTransformerTest-${dateAppender}`

let GRAPHQL_CLIENT = undefined;

function outputValueSelector(key: string) {
    return (outputs: Output[]) => {
        const output = outputs.find((o: Output) => o.OutputKey === key)
        return output ? output.OutputValue : null
    }
}

beforeAll(async () => {
    const validSchema = `
    type Comment @model {
        id: ID!
        title: String
        simpleGet: CompObj @http(method: GET, url: "https://jsonplaceholder.typicode.com/posts/1")
        simpleGet2: CompObj @http(url: "https://jsonplaceholder.typicode.com/posts/2")
        complexPost(
            id: Int,
            title: String!,
            body: String,
            userId: Int
        ): CompObj @http(method: POST, url: "https://jsonplaceholder.typicode.com/posts")
        complexPut(
            id: Int!,
            title: String,
            body: String,
            userId: Int
        ): CompObj @http(method: PUT, url: "https://jsonplaceholder.typicode.com/posts/:id")
        deleter: String @http(method: DELETE, url: "https://jsonplaceholder.typicode.com/posts/3")
        complexGet(
            data: String!,
            userId: Int!,
            _limit: Int
        ): [CompObj] @http(url: "https://jsonplaceholder.typicode.com/:data")
        complexGet2(
            dataType: String!,
            postId: Int!,
            secondType: String!,
            id: Int
        ): [PostComment] @http(url: "https://jsonplaceholder.typicode.com/:dataType/:postId/:secondType")
    }
    type CompObj {
        userId: Int
        id: Int
        title: String
        body: String
    }
    type PostComment {
        postId: Int
        id: Int
        name: String
        email: String
        body: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new DynamoDBModelTransformer(),
            new HttpTransformer()
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
test('Test HTTP GET request', async () => {
    try {
        const response = await GRAPHQL_CLIENT.query(`mutation {
            createComment(input: { title: "Hello, World!" }) {
                id
                title
                simpleGet {
                    id
                    title
                    body
                }
            }
        }`, {})
        const post1Title = 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit'
        expect(response.data.createComment.id).toBeDefined()
        expect(response.data.createComment.title).toEqual('Hello, World!')
        expect(response.data.createComment.simpleGet).toBeDefined()
        expect(response.data.createComment.simpleGet.title).toEqual(post1Title)
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test HTTP GET request 2', async () => {
    try {
        const response = await GRAPHQL_CLIENT.query(`mutation {
            createComment(input: { title: "Hello, World!" }) {
                id
                title
                simpleGet2 {
                    id
                    title
                    body
                }
            }
        }`, {})
        const post2Title = 'qui est esse'
        expect(response.data.createComment.id).toBeDefined()
        expect(response.data.createComment.title).toEqual('Hello, World!')
        expect(response.data.createComment.simpleGet2).toBeDefined()
        expect(response.data.createComment.simpleGet2.title).toEqual(post2Title)
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test HTTP POST request', async () => {
    try {
        const response = await GRAPHQL_CLIENT.query(`mutation {
            createComment(input: { title: "Hello, World!" }) {
                id
                title
                complexPost(
                    body: {
                        title: "foo",
                        body: "bar",
                        userId: 2
                    }
                ) {
                    id
                    title
                    body
                    userId
                }
            }
        }`, {})
        expect(response.data.createComment.id).toBeDefined()
        expect(response.data.createComment.title).toEqual('Hello, World!')
        expect(response.data.createComment.complexPost).toBeDefined()
        expect(response.data.createComment.complexPost.title).toEqual('foo')
        expect(response.data.createComment.complexPost.userId).toEqual(2)
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test HTTP PUT request', async () => {
    try {
        const response = await GRAPHQL_CLIENT.query(`mutation {
            createComment(input: { title: "Hello, World!" }) {
                id
                title
                complexPut(
                    params: {
                        id: "2"
                    },
                    body: {
                        title: "foo",
                        body: "bar",
                        userId: 2
                    }
                ) {
                    id
                    title
                    body
                    userId
                }
            }
        }`, {})
        expect(response.data.createComment.id).toBeDefined()
        expect(response.data.createComment.title).toEqual('Hello, World!')
        expect(response.data.createComment.complexPut).toBeDefined()
        expect(response.data.createComment.complexPut.title).toEqual('foo')
        expect(response.data.createComment.complexPut.userId).toEqual(2)
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test HTTP DELETE request', async () => {
    try {
        const response = await GRAPHQL_CLIENT.query(`mutation {
            createComment(input: { title: "Hello, World!" }) {
                id
                title
                deleter
            }
        }`, {})
        expect(response.data.createComment.id).toBeDefined()
        expect(response.data.createComment.title).toEqual('Hello, World!')
        expect(response.data.createComment.deleter).toBeDefined()
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test GET with URL param and query values', async () => {
    try {
        const response = await GRAPHQL_CLIENT.query(`mutation {
            createComment(input: { title: "Hello, World!" }) {
                id
                title
                complexGet(
                    params: {
                        data: "posts"
                    },
                    query: {
                        userId: 1,
                        _limit: 7
                    }
                ) {
                    id
                    title
                    body
                }
            }
        }`, {})
        expect(response.data.createComment.id).toBeDefined()
        expect(response.data.createComment.title).toEqual('Hello, World!')
        expect(response.data.createComment.complexGet).toBeDefined()
        expect(response.data.createComment.complexGet.length).toEqual(7)
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test GET with multiple URL params and query values', async () => {
    try {
        const response = await GRAPHQL_CLIENT.query(`mutation {
            createComment(input: { title: "Hello, World!" }) {
                id
                title
                complexGet2(
                    params: {
                        dataType: "posts",
                        postId: "1",
                        secondType: "comments"
                    },
                    query: {
                        id: 2
                    }
                ) {
                    id
                    name
                    email
                }
            }
        }`, {})
        expect(response.data.createComment.id).toBeDefined()
        expect(response.data.createComment.title).toEqual('Hello, World!')
        expect(response.data.createComment.complexGet2).toBeDefined()
        expect(response.data.createComment.complexGet2[0].email).toEqual('Jayne_Kuhic@sydney.com')
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test that GET errors when missing a required Query input object', async () => {
    try {
        const response = await GRAPHQL_CLIENT.query(`mutation {
            createComment(input: { title: "Hello, World!" }) {
                id
                title
                complexGet(
                    params: {
                        data: "posts",
                    }
                ) {
                    id
                    title
                    body
                }
            }
        }`, {})
        expect(response.data).toBeNull()
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test that POST errors when missing a non-null arg in query/body', async () => {
    try {
        const response = await GRAPHQL_CLIENT.query(`mutation {
            createComment(input: { title: "Hello, World!" }) {
                id
                title
                complexPost(
                    body: {
                        id: 1,
                        body: "bar"
                    }
                ) {
                    id
                    title
                    body
                }
            }
        }`, {})
        expect(response.data.createComment.complexPost).toBeNull()
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})
