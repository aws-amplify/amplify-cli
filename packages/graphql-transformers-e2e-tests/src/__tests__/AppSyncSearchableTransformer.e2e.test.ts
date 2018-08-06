import {
    ObjectTypeDefinitionNode, DirectiveNode, parse, FieldDefinitionNode, DocumentNode, DefinitionNode,
    Kind
} from 'graphql'
import { ResourceConstants } from 'graphql-transformer-common'
import GraphQLTransform from 'graphql-transform'
import AppSyncDynamoDBTransformer from 'graphql-dynamodb-transformer'
import AppSyncSearchableTransformer from 'graphql-elasticsearch-transformer'
import AppSyncFileTransformer from 'graphql-appsync-transformer'
import { CloudFormationClient } from '../CloudFormationClient'
import { S3Client } from '../S3Client'
import { Output } from 'aws-sdk/clients/cloudformation'
import { GraphQLClient } from '../GraphQLClient'

jest.setTimeout(60000 * 60);

const cf = new CloudFormationClient('us-west-2')
const STACK_NAME = 'TestAppSyncSearchableTransformer'
const BUCKET_NAME = 'testappsyncsearchabletransformer'
const FUNCTION_NAME = 'python_streaming_function.zip'
const FUNCTION_PATH = `${__dirname}/../../node_modules/graphql-elasticsearch-transformer/streaming-lambda.zip`

const s3 = new S3Client('us-west-2')

let GRAPHQL_CLIENT = undefined;

function outputValueSelector(key: string) {
    return (outputs: Output[]) => {
        const output = outputs.find((o: Output) => o.OutputKey === key)
        return output ? output.OutputValue : null
    }
}

beforeAll(async () => {
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
            new AppSyncDynamoDBTransformer(),
            new AppSyncSearchableTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    try {
        // create bucket, upload file and get version
        const version = (await s3.setUpS3Resources(BUCKET_NAME, FUNCTION_PATH, FUNCTION_NAME, true)).VersionId

        // create stack with additional params
        const additionalParams = generateParams(version)
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
})

test('Test createPost mutation', async () => {
    try {
        await cf.wait(120, () => Promise.resolve())
        
        const response = await GRAPHQL_CLIENT.query(`mutation {
            createPost(input: { title: "Hello, World!" }) {
                id
                title
                createdAt
                updatedAt
            }
        }`, {})
        console.log('createPost: ' + JSON.stringify(response, null, 4))
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

test('Test searchPost query', async () => {
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
        console.log('searchPost: ' + JSON.stringify(response, null, 4))
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

function generateParams(lambdaVersion: string) {
    const params = {
        [ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Bucket]: BUCKET_NAME,
        [ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Key]: FUNCTION_NAME,
        [ResourceConstants.PARAMETERS.ElasticSearchStreamingLambdaCodeS3Version]: lambdaVersion,
        [ResourceConstants.PARAMETERS.ElasticSearchAccessIAMRoleName]: 'ElasticSearchAccessIAMRoleTest',
        [ResourceConstants.PARAMETERS.ElasticSearchStreamingIAMRoleName]: 'ElasticSearchStreamingIAMRoleTest'
    }

    return params
}
