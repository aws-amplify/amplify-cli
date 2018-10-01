import {
    ObjectTypeDefinitionNode, DirectiveNode, parse, FieldDefinitionNode, DocumentNode, DefinitionNode,
    Kind
} from 'graphql'
import { ResourceConstants } from 'graphql-transformer-common'
import GraphQLTransform from 'graphql-transformer-core'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'
import AppSyncTransformer from 'graphql-appsync-transformer'
import VersionedModelTransformer from 'graphql-versioned-transformer'
import { CloudFormationClient } from '../CloudFormationClient'
import { Output } from 'aws-sdk/clients/cloudformation'
import { GraphQLClient } from '../GraphQLClient'
import * as moment from 'moment';

jest.setTimeout(2000000);

const cf = new CloudFormationClient('us-west-2')

const dateAppender = moment().format('YYYYMMDDHHmmss')
const STACK_NAME = `GraphQLVersionedTest-${dateAppender}`

let GRAPHQL_CLIENT = undefined;

function outputValueSelector(key: string) {
    return (outputs: Output[]) => {
        const output = outputs.find((o: Output) => o.OutputKey === key)
        return output ? output.OutputValue : null
    }
}

beforeAll(async () => {
    const validSchema = `
    type Post @model @versioned {
        id: ID!
        title: String!
        version: Int!
        createdAt: String
        updatedAt: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new DynamoDBModelTransformer(),
            new VersionedModelTransformer()
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
    const response = await GRAPHQL_CLIENT.query(`mutation {
        createPost(input: { title: "Hello, World!" }) {
            id
            title
            createdAt
            updatedAt
            version
        }
    }`, {})
    expect(response.data.createPost.id).toBeDefined()
    expect(response.data.createPost.title).toEqual('Hello, World!')
    expect(response.data.createPost.createdAt).toBeDefined()
    expect(response.data.createPost.updatedAt).toBeDefined()
    expect(response.data.createPost.version).toEqual(1)
})

test('Test updatePost mutation', async () => {
    const createResponse = await GRAPHQL_CLIENT.query(`mutation {
        createPost(input: { title: "Test Update" }) {
            id
            title
            createdAt
            updatedAt
            version
        }
    }`, {})
    expect(createResponse.data.createPost.id).toBeDefined()
    expect(createResponse.data.createPost.title).toEqual('Test Update')
    expect(createResponse.data.createPost.version).toEqual(1)
    const updateResponse = await GRAPHQL_CLIENT.query(`mutation {
        updatePost(input: {
            id: "${createResponse.data.createPost.id}",
            title: "Bye, World!",
            expectedVersion: ${createResponse.data.createPost.version}
        }) {
            id
            title
            version
        }
    }`, {})
    expect(updateResponse.data.updatePost.title).toEqual('Bye, World!')
    expect(updateResponse.data.updatePost.version).toEqual(2)
})

test('Test failed updatePost mutation with wrong version', async () => {
    const createResponse = await GRAPHQL_CLIENT.query(`mutation {
        createPost(input: { title: "Test Update" }) {
            id
            title
            createdAt
            updatedAt
            version
        }
    }`, {})
    expect(createResponse.data.createPost.id).toBeDefined()
    expect(createResponse.data.createPost.title).toEqual('Test Update')
    expect(createResponse.data.createPost.version).toEqual(1)
    const updateResponse = await GRAPHQL_CLIENT.query(`mutation {
        updatePost(input: {
            id: "${createResponse.data.createPost.id}",
            title: "Bye, World!",
            expectedVersion: 3
        }) {
            id
            title
            version
        }
    }`, {})
    expect(updateResponse.errors.length).toEqual(1)
    expect((updateResponse.errors[0] as any).errorType).toEqual('DynamoDB:ConditionalCheckFailedException')
})

test('Test deletePost mutation', async () => {
    const createResponse = await GRAPHQL_CLIENT.query(`mutation {
        createPost(input: { title: "Test Delete" }) {
            id
            title
            version
            createdAt
            updatedAt
        }
    }`, {})
    expect(createResponse.data.createPost.id).toBeDefined()
    expect(createResponse.data.createPost.title).toEqual('Test Delete')
    expect(createResponse.data.createPost.version).toBeDefined()
    const deleteResponse = await GRAPHQL_CLIENT.query(`mutation {
        deletePost(input: { id: "${createResponse.data.createPost.id}", expectedVersion: ${createResponse.data.createPost.version} }) {
            id
            title
            version
        }
    }`, {})
    expect(deleteResponse.data.deletePost.title).toEqual('Test Delete')
    expect(deleteResponse.data.deletePost.version).toEqual(createResponse.data.createPost.version)
})

test('Test deletePost mutation with wrong version', async () => {
    const createResponse = await GRAPHQL_CLIENT.query(`mutation {
        createPost(input: { title: "Test Delete" }) {
            id
            title
            version
            createdAt
            updatedAt
        }
    }`, {})
    expect(createResponse.data.createPost.id).toBeDefined()
    expect(createResponse.data.createPost.title).toEqual('Test Delete')
    expect(createResponse.data.createPost.version).toBeDefined()
    const deleteResponse = await GRAPHQL_CLIENT.query(`mutation {
        deletePost(input: { id: "${createResponse.data.createPost.id}", expectedVersion: 3 }) {
            id
            title
            version
        }
    }`, {})
    expect(deleteResponse.errors.length).toEqual(1)
    expect((deleteResponse.errors[0] as any).errorType).toEqual('DynamoDB:ConditionalCheckFailedException')
})
