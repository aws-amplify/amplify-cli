import {
    ObjectTypeDefinitionNode, DirectiveNode, parse, FieldDefinitionNode, DocumentNode, DefinitionNode,
    Kind
} from 'graphql'
import { ResourceConstants } from 'graphql-transformer-common'
import GraphQLTransform from 'graphql-transformer-core'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'
import AppSyncTransformer from 'graphql-appsync-transformer'
import ModelConnectionTransformer from 'graphql-connection-transformer'
import { CloudFormationClient } from '../CloudFormationClient'
import { Output } from 'aws-sdk/clients/cloudformation'
import { GraphQLClient } from '../GraphQLClient'

jest.setTimeout(2000000);

const cf = new CloudFormationClient('us-west-2')
const STACK_NAME = 'ModelConnectionTransformerTest'

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
        comments: [Comment] @connection(name: "PostComments", keyField: "postId")
    }
    type Comment @model {
        id: ID!
        content: String!
        post: Post @connection(name: "PostComments", keyField: "postId")
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new DynamoDBModelTransformer(),
            new ModelConnectionTransformer()
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

test('Test queryPost query', async () => {
    try {
        const createResponse = await GRAPHQL_CLIENT.query(`mutation {
            createPost(input: { title: "Test Query" }) {
                id
                title
            }
        }`, {})
        expect(createResponse.data.createPost.id).toBeDefined()
        expect(createResponse.data.createPost.title).toEqual('Test Query')
        const createCommentResponse = await GRAPHQL_CLIENT.query(`mutation {
            createComment(input: { content: "A comment!", postId: "${createResponse.data.createPost.id}" }) {
                id
                content
                post {
                    id
                    title
                }
            }
        }`, {})
        expect(createCommentResponse.data.createComment.id).toBeDefined()
        expect(createCommentResponse.data.createComment.content).toEqual('A comment!')
        expect(createCommentResponse.data.createComment.post.id).toEqual(createResponse.data.createPost.id)
        expect(createCommentResponse.data.createComment.post.title).toEqual(createResponse.data.createPost.title)
        const queryResponse = await GRAPHQL_CLIENT.query(`query {
            getPost(id: "${createResponse.data.createPost.id}") {
                id
                title
                comments {
                    items {
                        id
                        content
                    }
                }
            }
        }`, {})
        expect(queryResponse.data.getPost).toBeDefined()
        const items = queryResponse.data.getPost.comments.items
        expect(items.length).toEqual(1)
        expect(items[0].id).toEqual(createCommentResponse.data.createComment.id)
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})
