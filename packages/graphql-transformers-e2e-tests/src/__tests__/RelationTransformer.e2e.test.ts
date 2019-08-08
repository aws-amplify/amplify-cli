import { ResourceConstants } from 'graphql-transformer-common'
import GraphQLTransform from 'graphql-transformer-core'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'
import KeyTransformer from 'graphql-key-transformer'
import RelationTransformer from 'graphql-relation-transformer'
import ModelAuthTransformer from 'graphql-auth-transformer'
import { CloudFormationClient } from '../CloudFormationClient'
import { Output } from 'aws-sdk/clients/cloudformation'
import { GraphQLClient } from '../GraphQLClient'
import { deploy } from '../deployNestedStacks'
import emptyBucket from '../emptyBucket';
import { S3Client } from '../S3Client';
import * as S3 from 'aws-sdk/clients/s3'
import * as moment from 'moment';

jest.setTimeout(2000000);

const cf = new CloudFormationClient('us-west-2')
const customS3Client = new S3Client('us-west-2')
const awsS3Client = new S3({ region: 'us-west-2' })

const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss')
const STACK_NAME = `RelationTransformerTest-${BUILD_TIMESTAMP}`
const BUCKET_NAME = `appsync-relation-transformer-test-${BUILD_TIMESTAMP}`
const LOCAL_FS_BUILD_DIR = '/tmp/relation_transform_tests/'
const S3_ROOT_DIR_KEY = 'deployments'

let GRAPHQL_CLIENT = undefined;

function outputValueSelector(key: string) {
    return (outputs: Output[]) => {
        const output = outputs.find((o: Output) => o.OutputKey === key)
        return output ? output.OutputValue : null
    }
}

beforeAll(async () => {
    const validSchema = `
type Child
	@model
	@key(fields: ["id", "name"])
{
	id: ID!
	name: String!

	parents: [Parent] @relation(index: "byChild", fields: ["id", "name"])
}

type Parent
	@model
	@key(name: "byChild", fields: ["childID", "childName"])
{
	id: ID!
	childID: ID!
	childName: String!

	child: Child @relation(fields: ["childID", "childName"])
}
`
    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new KeyTransformer(),
            new RelationTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    // fs.writeFileSync('./out.json', JSON.stringify(out, null, 4));
    try {
        await awsS3Client.createBucket({
            Bucket: BUCKET_NAME,
        }).promise()
    } catch (e) {
        console.error(`Failed to create S3 bucket: ${e}`)
    }
    try {
        console.log('Creating Stack ' + STACK_NAME)
        const finishedStack = await deploy(
            customS3Client, cf, STACK_NAME, out, {}, LOCAL_FS_BUILD_DIR, BUCKET_NAME, S3_ROOT_DIR_KEY,
            BUILD_TIMESTAMP
        )

        // Arbitrary wait to make sure everything is ready.
        await cf.wait(5, () => Promise.resolve())
        console.log('Successfully created stack ' + STACK_NAME)
        expect(finishedStack).toBeDefined()
        console.log(JSON.stringify(finishedStack, null, 4))
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
    try {
        await emptyBucket(BUCKET_NAME);
    } catch (e) {
        console.error(`Failed to empty S3 bucket: ${e}`)
    }
})

/**
 * Test queries below
 */

test('Test Parent.child getItem', async () => {
    const createChild = await GRAPHQL_CLIENT.query(`mutation {
        createChild(input: { id: "1", name: "child1" }) {
            id
            name
        }
    }`, {})
    expect(createChild.data.createChild.id).toBeDefined()
    expect(createChild.data.createChild.name).toEqual('child1')
    const createParent = await GRAPHQL_CLIENT.query(`mutation {
        createParent(input: { childID: "1", childName: "${createChild.data.createChild.name}" }) {
            id
            childID
            childName
        }
    }`, {})
    expect(createParent.data.createParent.id).toBeDefined()
    expect(createParent.data.createParent.childID).toEqual(createChild.data.createChild.id)
    expect(createParent.data.createParent.childName).toEqual(createChild.data.createChild.name)
    const queryParent = await GRAPHQL_CLIENT.query(`query {
        getParent(id: "${createParent.data.createParent.id}") {
            id
            child {
                id
                name
            }
        }
    }`, {})
    expect(queryParent.data.getParent).toBeDefined()
    const child = queryParent.data.getParent.child
    expect(child.id).toEqual(createParent.data.createParent.childID)
    expect(child.name).toEqual(createParent.data.createParent.childName)

})

test('Test Child.parents query', async () => {
    const createChild = await GRAPHQL_CLIENT.query(`mutation {
        createChild(input: { id: "2", name: "child2" }) {
            id
            name
        }
    }`, {})
    expect(createChild.data.createChild.id).toBeDefined()
    expect(createChild.data.createChild.name).toEqual('child2')

    const createParent1 = await GRAPHQL_CLIENT.query(`mutation {
        createParent(input: { childID: "${createChild.data.createChild.id}", childName: "${createChild.data.createChild.name}" }) {
            id
            childID
            childName
        }
    }`, {})
    expect(createParent1.data.createParent.id).toBeDefined()
    expect(createParent1.data.createParent.childID).toEqual(createChild.data.createChild.id)
    expect(createParent1.data.createParent.childName).toEqual(createChild.data.createChild.name)

    const queryChild = await GRAPHQL_CLIENT.query(`query {
        getChild(id: "${createChild.data.createChild.id}", name: "${createChild.data.createChild.name}") {
            id
            parents {
                items {
                    id
                    childID
                    childName
                }
            }
        }
    }`, {})
    expect(queryChild.data.getChild).toBeDefined()
    const items = queryChild.data.getChild.parents.items
    expect(items.length).toEqual(1)
    expect(items[0].id).toEqual(createParent1.data.createParent.id)
    expect(items[0].childID).toEqual(createParent1.data.createParent.childID)
    expect(items[0].childName).toEqual(createParent1.data.createParent.childName)
})
