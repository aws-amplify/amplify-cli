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
import * as moment from 'moment';

jest.setTimeout(60000 * 60);

const s3 = new S3Client('us-west-2')
const cf = new CloudFormationClient('us-west-2')

const dateAppender = moment().format('YYYYMMDDHHmmss')
const STACK_NAME = `TestSearchableModelTransformer-${dateAppender}`
const BUCKET_NAME = `testsearchablemodeltransformer-${dateAppender}`
const FUNCTION_NAME = 'python_streaming_function.zip'
const FUNCTION_PATH = `${__dirname}/../../node_modules/graphql-elasticsearch-transformer/lib/streaming-lambda.zip`

const selectionSet = `
    id
    author
    title
    ups
    downs
    percentageUp
    isPublished
`;

const createPosts = async () => {
    const logContent = 'createPost response: '

    await runQuery(getCreatePostsQuery(
        "snvishna", "test", 157, 10, 97.4, true
    ), logContent)
    await runQuery(getCreatePostsQuery(
        "snvishna", "test title", 60, 30, 21.0, false
    ), logContent)
    await runQuery(getCreatePostsQuery(
        "shankar", "test title", 160, 30, 97.6, false
    ), logContent)
    await runQuery(getCreatePostsQuery(
        "snvishna", "test TITLE", 170, 30, 88.8, true
    ), logContent)
    await runQuery(getCreatePostsQuery(
        "snvishna", "test title", 200, 50, 11.9, false
    ), logContent)
    await runQuery(getCreatePostsQuery(
        "snvishna", "test title", 170, 30, 88.8, true
    ), logContent)
    await runQuery(getCreatePostsQuery(
        "snvishna", "test title", 160, 30, 97.6, false
    ), logContent)
    await runQuery(getCreatePostsQuery(
        "snvishna", "test title", 170, 30, 77.7, true
    ), logContent)

    // Waiting for the ES Cluster + Streaming Lambda infra to be setup
    console.log('Waiting for the ES Cluster + Streaming Lambda infra to be setup')
    await cf.wait(120, () => Promise.resolve())
}

const runQuery = async (query: string, logContent: string) => {
    try {
        const response = await GRAPHQL_CLIENT.query(query,  {});
        console.log(logContent + JSON.stringify(response, null, 4));
        return response;
    } catch (e) {
        console.error(e);
        return null;
    }
}

let GRAPHQL_CLIENT = undefined;

beforeAll(async () => {
    const validSchema = `
    type Post @model @searchable {
        id: ID!
        author: String!
        title: String
        content: String
        url: String
        ups: Int
        downs: Int
        version: Int
        relatedPosts: [Post]
        postedAt: String
        comments: [String!]
        ratings: [Int!]
        percentageUp: Float
        isPublished: Boolean
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
        // create bucket, upload file and get version
        console.log('Uploading Streaming Lambda Function from: '.concat(FUNCTION_PATH))
        const s3Response = await s3.setUpS3Resources(BUCKET_NAME, FUNCTION_PATH, FUNCTION_NAME, true)
        expect(s3Response).toBeDefined()

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
        await createPosts();
    } catch (e) {
        console.error(e)
        expect(true).toEqual(false)
    }
});

afterAll(async () => {
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
});

test('Test searchPosts query without filter', async () => {
    const response = await runQuery(`query {
        searchPosts {
            items { ${selectionSet} }
        }
    }`, 'Test searchPosts response without filter: ')
    expect(response).toBeDefined
    expect(response.data.searchPosts.items).toBeDefined
    const items = response.data.searchPosts.items
    expect(items.length).toBeGreaterThan(0)
})

test('Test searchPosts query with basic filter', async () => {
    const response = await runQuery(`query {
        searchPosts(filter: {
            author: { eq: "snvishna" }
        }) {
            items { ${selectionSet} }
        }
    }`, 'Test searchPosts response with basic filter: ')
    expect(response).toBeDefined
    expect(response.data.searchPosts.items).toBeDefined
    const items = response.data.searchPosts.items
    expect(items.length).toEqual(8)
})

test('Test searchPosts query with non-recursive filter', async () => {
    const response = await runQuery(`query {
        searchPosts(filter: {
            title: { eq: "test title" }
            ups: { gte: 100 }
            percentageUp: { ne: 77.7 }
            downs: { range: [29, 31] }
            author: { wildcard: "s*a" }
            isPublished: { eq: true }
        }) {
            items { ${selectionSet} }
        }
    }`, 'Test searchPosts response with non-recursive filter: ')
    expect(response).toBeDefined
    expect(response.data.searchPosts.items).toBeDefined
    const items = response.data.searchPosts.items
    expect(items.length).toEqual(1)
    expect(items[0].author).toEqual("snvishna")
    expect(items[0].title).toEqual("test title")
    expect(items[0].ups).toEqual(170)
    expect(items[0].downs).toEqual(30)
    expect(items[0].percentageUp).toEqual(88.8)
    expect(items[0].isPublished).toEqual(true)
})

test('Test searchPosts query with recursive filter 1', async () => {
    const response = await runQuery(`query {
        searchPosts(filter: {
            downs: { eq: 10 }
            or: [
                {
                    author: { wildcard: "s*a" },
                    downs: { eq: 30 }
                },
                {
                    isPublished: { eq: true }
                }
            ]
        }) {
            items { ${selectionSet} }
        }
    }`, 'Test searchPosts response with recursive filter 1: ')
    expect(response).toBeDefined
    expect(response.data.searchPosts.items).toBeDefined
    const items = response.data.searchPosts.items
    expect(items.length).toEqual(1)
    expect(items[0].author).toEqual("snvishna")
    expect(items[0].title).toEqual("test")
    expect(items[0].ups).toEqual(157)
    expect(items[0].downs).toEqual(10)
    expect(items[0].percentageUp).toEqual(97.4)
    expect(items[0].isPublished).toEqual(true)
})

test('Test searchPosts query with recursive filter 2', async () => {
    const response = await runQuery(`query {
        searchPosts(filter: {
            downs: { eq: 30 }
            or: [
                {
                    author: { wildcard: "s*a" },
                    downs: { eq: 30 }
                },
                {
                    isPublished: { eq: true }
                }
            ]
        }) {
            items { ${selectionSet} }
        }
    }`, 'Test searchPosts response with recursive filter 2: ')
    expect(response).toBeDefined
    expect(response.data.searchPosts.items).toBeDefined
    const items = response.data.searchPosts.items
    expect(items.length).toEqual(5)
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
    percentageUp: number,
    isPublished: boolean
): string {
    return `mutation {
        createPost(input: {
            author: "${author}"
            title: "${title}"
            ups: ${ups}
            downs: ${downs}
            percentageUp: ${percentageUp}
            isPublished: ${isPublished}
        }) { ${selectionSet} }
    }`
}

function outputValueSelector(key: string) {
    return (outputs: Output[]) => {
        const output = outputs.find((o: Output) => o.OutputKey === key)
        return output ? output.OutputValue : null
    }
}
