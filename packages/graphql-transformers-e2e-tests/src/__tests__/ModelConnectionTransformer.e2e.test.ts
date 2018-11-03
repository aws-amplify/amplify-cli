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
import * as moment from 'moment';

jest.setTimeout(2000000);

const cf = new CloudFormationClient('us-west-2')

const dateAppender = moment().format('YYYYMMDDHHmmss')
const STACK_NAME = `ModelConnectionTransformerTest-${dateAppender}`

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
        sortedComments: [SortedComment] @connection(name: "SortedPostComments", keyField: "postId", sortField: "when")
    }
    type Comment @model {
        id: ID!
        content: String!
        post: Post @connection(name: "PostComments", keyField: "postId")
    }
    type SortedComment @model{
        id: ID!
        content: String!
        when: String!
        post: Post @connection(name: "SortedPostComments", keyField: "postId")
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

const title = "Test Query with Sort Field"
const comment1 = "a comment and a date! - 1"
const comment2 = "a comment and a date! - 2"
const when1 = "2018-10-01T00:00:00.000Z"
const when2 = "2018-10-01T00:00:01.000Z"

test('Test queryPost query with sortField', async () => {
    try {
        const createResponse = await GRAPHQL_CLIENT.query(`mutation {
            createPost(input: { title: "${title}" }) {
                id
                title
            }
        }`, {})
        expect(createResponse.data.createPost.id).toBeDefined()
        expect(createResponse.data.createPost.title).toEqual(title)
        const createCommentResponse1 = await GRAPHQL_CLIENT.query(`mutation {
            createSortedComment(input:
                { content: "${comment1}",
                    when: "${when1}"
                    postId: "${createResponse.data.createPost.id}"
                }) {
                id
                content
                post {
                    id
                    title
                }
            }
        }`, {})
        expect(createCommentResponse1.data.createSortedComment.id).toBeDefined()
        expect(createCommentResponse1.data.createSortedComment.content).toEqual(comment1)
        expect(createCommentResponse1.data.createSortedComment.post.id).toEqual(createResponse.data.createPost.id)
        expect(createCommentResponse1.data.createSortedComment.post.title).toEqual(createResponse.data.createPost.title)

        // create 2nd comment, 1 second later
        const createCommentResponse2 = await GRAPHQL_CLIENT.query(`mutation {
            createSortedComment(input:
                { content: "${comment2}",
                    when: "${when2}"
                    postId: "${createResponse.data.createPost.id}"
                }) {
                id
                content
                post {
                    id
                    title
                }
            }
        }`, {})
        expect(createCommentResponse2.data.createSortedComment.id).toBeDefined()
        expect(createCommentResponse2.data.createSortedComment.content).toEqual(comment2)
        expect(createCommentResponse2.data.createSortedComment.post.id).toEqual(createResponse.data.createPost.id)
        expect(createCommentResponse2.data.createSortedComment.post.title).toEqual(createResponse.data.createPost.title)

        const queryResponse = await GRAPHQL_CLIENT.query(`query {
            getPost(id: "${createResponse.data.createPost.id}") {
                id
                title
                sortedComments {
                    items {
                        id
                        when
                        content
                    }
                }
            }
        }`, {})
        expect(queryResponse.data.getPost).toBeDefined()
        const items = queryResponse.data.getPost.sortedComments.items
        expect(items.length).toEqual(2)
        expect(items[0].id).toEqual(createCommentResponse1.data.createSortedComment.id)
        expect(items[1].id).toEqual(createCommentResponse2.data.createSortedComment.id)

        const queryResponseDesc = await GRAPHQL_CLIENT.query(`query {
            getPost(id: "${createResponse.data.createPost.id}") {
                id
                title
                sortedComments(sortDirection: DESC) {
                    items {
                        id
                        when
                        content
                    }
                }
            }
        }`, {})
        expect(queryResponseDesc.data.getPost).toBeDefined()
        const itemsDesc = queryResponseDesc.data.getPost.sortedComments.items
        expect(itemsDesc.length).toEqual(2)
        expect(itemsDesc[0].id).toEqual(createCommentResponse2.data.createSortedComment.id)
        expect(itemsDesc[1].id).toEqual(createCommentResponse1.data.createSortedComment.id)
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test create comment without a post and then querying the comment.', async () => {
    try {
        const createCommentResponse1 = await GRAPHQL_CLIENT.query(`mutation {
            createComment(input:
                { content: "${comment1}" }) {
                id
                content
                post {
                    id
                    title
                }
            }
        }`, {})
        expect(createCommentResponse1.data.createComment.id).toBeDefined()
        expect(createCommentResponse1.data.createComment.content).toEqual(comment1)
        expect(createCommentResponse1.data.createComment.post).toBeNull()

        const queryResponseDesc = await GRAPHQL_CLIENT.query(`query {
            getComment(id: "${createCommentResponse1.data.createComment.id}") {
                id
                content
                post {
                    id
                }
            }
        }`, {})
        expect(queryResponseDesc.data.getComment).toBeDefined()
        expect(queryResponseDesc.data.getComment.post).toBeNull()
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})