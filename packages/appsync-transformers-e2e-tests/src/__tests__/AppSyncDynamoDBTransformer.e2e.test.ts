import {
    ObjectTypeDefinitionNode, DirectiveNode, parse, FieldDefinitionNode, DocumentNode, DefinitionNode,
    Kind
} from 'graphql'
import GraphQLTransform from 'graphql-transform'
import AppSyncDynamoDBTransformer from 'appsync-dynamodb-transformer'
import { CloudFormationClient } from '../CloudFormationClient'

jest.setTimeout(200000);

const cf = new CloudFormationClient('us-west-2')
const STACK_NAME = 'TestAppSyncDynamoDBTransformerHappy'

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
        const newStack = await cf.createStack(out, STACK_NAME)
        expect(newStack).toBeDefined()
        const finishedStack = await cf.waitForStack(STACK_NAME)
        // The stack successfully created
        expect(finishedStack).toBeDefined()
        console.log(JSON.stringify(finishedStack))
    } catch (e) {
        console.error(e)
        expect(true).toEqual(false)
    }
});

afterAll(async () => {
    try {
        console.log('Deleting Stack ' + STACK_NAME)
        cf.deleteStack(STACK_NAME)
    } catch (e) {
        console.error(e)
        expect(true).toEqual(false)
    }
})

/**
 * Test queries below
 */

test('Test createPost mutation', async () => {
    // TODO
    expect(true).toEqual(true)
})

