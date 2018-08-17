import {
    ObjectTypeDefinitionNode, DirectiveNode, parse, FieldDefinitionNode, DocumentNode, DefinitionNode,
    Kind
} from 'graphql'
import { ResourceConstants } from 'graphql-transformer-common'
import GraphQLTransform from 'graphql-transform'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'
import SearchableModelTransformer from 'graphql-elasticsearch-transformer'
import AppSyncFileTransformer from 'graphql-appsync-transformer'
import { CloudFormationClient } from '../CloudFormationClient'
import { S3Client } from '../S3Client'
import { Output } from 'aws-sdk/clients/cloudformation'
import { GraphQLClient } from '../GraphQLClient'

jest.setTimeout(60000 * 60);

const s3 = new S3Client('us-west-2')
const cf = new CloudFormationClient('us-west-2')
const STACK_NAME = 'TestSearchableModelTransformer'
const BUCKET_NAME = 'testSearchableModelTransformer'
const FUNCTION_NAME = 'python_streaming_function.zip'
const FUNCTION_PATH = `${__dirname}/../../node_modules/graphql-elasticsearch-transformer/streaming-lambda.zip`

const createPosts = async () => {
    await GRAPHQL_CLIENT.query(getCreatePostsQuery(
        "snvishna", "test", 157, 10, 97.4, true
    ), {})
    await GRAPHQL_CLIENT.query(getCreatePostsQuery(
        "snvishna", "test title", 60, 30, 21.0, false
    ), {})
    await GRAPHQL_CLIENT.query(getCreatePostsQuery(
        "snvishna", "test title", 160, 30, 97.6, false
    ), {})
    await GRAPHQL_CLIENT.query(getCreatePostsQuery(
        "snvishna", "test TITLE", 170, 30, 88.8, true
    ), {})
    await GRAPHQL_CLIENT.query(getCreatePostsQuery(
        "snvishna", "test title", 200, 50, 11.9, false
    ), {})
    await GRAPHQL_CLIENT.query(getCreatePostsQuery(
        "snvishna", "test title", 170, 30, 88.8, true
    ), {})
    await GRAPHQL_CLIENT.query(getCreatePostsQuery(
        "snvishna", "test title", 160, 30, 97.6, false
    ), {})
    await GRAPHQL_CLIENT.query(getCreatePostsQuery(
        "snvishna", "test title", 170, 30, 77.7, true
    ), {})

    // Waiting for the ES Cluster + Streaming Lambda infra to be setup
    await cf.wait(120, () => Promise.resolve())
}

const setup = async () => {
    const validSchema = `
    type Post @model @searchable {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncFileTransformer(),
            new DynamoDBModelTransformer(),
            new SearchableModelTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    try {
        // create stack with additional params
        const additionalParams = generateParams()
        console.log('Creating Stack ' + STACK_NAME)
        const createStackResponse = await cf.createStack(out, STACK_NAME, additionalParams)
        expect(createStackResponse).toBeDefined()
        const finishedStack = await cf.waitForStack(STACK_NAME, undefined, undefined, undefined, 300, 10)
        // Arbitrary wait to make sure everything is ready.
        await cf.wait(120, () => Promise.resolve())
        console.log('Successfully created stack ' + STACK_NAME)
        expect(finishedStack).toBeDefined()
        const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput)
        const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput)
        const endpoint = getApiEndpoint(finishedStack.Outputs)
        const apiKey = getApiKey(finishedStack.Outputs)
        expect(apiKey).toBeDefined()
        expect(endpoint).toBeDefined()
        GRAPHQL_CLIENT = new GraphQLClient(endpoint, { 'x-api-key': apiKey })

        // Create sample mutations to test search queries
        createPosts();
    } catch (e: AlreadyExistsException) {
        console.log('Setup failed with AlreadyExistsException, cleaning up resources. ' + e)
        await cleanup()

        console.log('Calling Setup again')
        await setup()
    } catch (e: Exception) {
        console.error(e)
        expect(true).toEqual(false)
    }
}

const cleanup = async () => {
    try {
        console.log('Deleting S3 resources')
        await s3.cleanUpS3Resources(BUCKET_NAME, FUNCTION_NAME)
        console.log('Successfully deleted s3 resources')

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
}

let GRAPHQL_CLIENT = undefined;

beforeAll(setup);
afterAll(cleanup);

test('Test searchPost query without filter', async () => {
    try {
        await GRAPHQL_CLIENT.query(`mutation {
            createPost(input: { title: "Hello, World 2!" }) {
                id
                title
                createdAt
                updatedAt
            }
        }`, {})

        await cf.wait(120, () => Promise.resolve())

        const response = await GRAPHQL_CLIENT.query(`query {
            searchPost {
                items {
                    id
                    title
                }
            }
        }`, {})
        console.log('Test searchPost query without filter: ' + JSON.stringify(response, null, 4))
        expect(response).toBeDefined
        expect(response.data.searchPost.items).toBeDefined
        const items = response.data.searchPost.items
        expect(items.length).toBeGreaterThan(0)
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test searchPost query with basic filter', async () => {
    try {
        const response = await GRAPHQL_CLIENT.query(`query {
            searchPost(filter: {
                author: { eq: "snvishna" }
            }) {
                items {
                    id
                    title
                }
            }
        }`, {})
        console.log('Test searchPost query with basic filter: ' + JSON.stringify(response, null, 4))
        expect(response).toBeDefined
        expect(response.data.searchPost.items).toBeDefined
        const items = response.data.searchPost.items
        expect(items.length).toEqual(8)
    } catch (e) {
        console.error(e)
        // fail
        expect(e).toBeUndefined()
    }
})

function generateParams() {
    const params = {
        [ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Bucket]: BUCKET_NAME,
        [ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Key]: FUNCTION_NAME,
        [ResourceConstants.PARAMETERS.ElasticSearchAccessIAMRoleName]: 'ElasticSearchAccessIAMRoleTest',
        [ResourceConstants.PARAMETERS.ElasticSearchStreamingIAMRoleName]: 'ElasticSearchStreamingIAMRoleTest'
    }

    return params
}

function getCreatePostsQuery(
    author: string,
    title: string,
    ups: number,
    downs: number,
    percantageUp: number,
    isPublished: boolean
): string {
    return `mutation {
        createPost(input: {
            author: ${author}
            title: ${title}
            ups: ${ups}
            downs: ${downs}
            percentageUp: ${percantageUp}
            isPublished: ${isPublished}
        }) {
            id
            author
            title
            ups
            downs
            percentageUp
            isPublished
        }
    }`
}

function outputValueSelector(key: string) {
    return (outputs: Output[]) => {
        const output = outputs.find((o: Output) => o.OutputKey === key)
        return output ? output.OutputValue : null
    }
}
