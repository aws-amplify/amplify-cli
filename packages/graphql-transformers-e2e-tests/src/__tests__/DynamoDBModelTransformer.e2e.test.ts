import {
    ObjectTypeDefinitionNode, DirectiveNode, parse, FieldDefinitionNode, DocumentNode, DefinitionNode,
    Kind
} from 'graphql'
import { ResourceConstants } from 'graphql-transformer-common'
import GraphQLTransform from 'graphql-transformer-core'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'
import { CloudFormationClient } from '../CloudFormationClient'
import { Output } from 'aws-sdk/clients/cloudformation'
import { GraphQLClient } from '../GraphQLClient'
import { deploy } from '../deployNestedStacks';
import { S3Client } from '../S3Client';
import * as S3 from 'aws-sdk/clients/s3'
import * as moment from 'moment';
import emptyBucket from '../emptyBucket';
import * as fs from 'fs';

jest.setTimeout(2000000);

const cf = new CloudFormationClient('us-west-2')
const customS3Client = new S3Client('us-west-2')
const awsS3Client = new S3({ region: 'us-west-2' })

const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss')
const STACK_NAME = `DynamoDBModelTransformerTest-${BUILD_TIMESTAMP}`
const BUCKET_NAME = `appsync-model-transformer-test-bucket-${BUILD_TIMESTAMP}`

let GRAPHQL_CLIENT = undefined;

const TMP_ROOT = '/tmp/model_transform_tests/'

const ROOT_KEY = 'deployments'

let GRAPHQL_ENDPOINT = undefined;

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
        createdAt: AWSDateTime
        updatedAt: AWSDateTime
        metadata: PostMetadata
        entityMetadata: EntityMetadata
        appearsIn: [Episode!]
        episode: Episode
    }
    type Author @model {
        id: ID!
        name: String!
        postMetadata: PostMetadata
        entityMetadata: EntityMetadata
    }
    type EntityMetadata {
        isActive: Boolean
    }
    type PostMetadata {
        tags: Tag
    }
    type Tag {
        published: Boolean
        metadata: PostMetadata
    }
    enum Episode {
        NEWHOPE
        EMPIRE
        JEDI
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer()
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
            customS3Client, cf, STACK_NAME, out, {}, TMP_ROOT, BUCKET_NAME, ROOT_KEY,
            BUILD_TIMESTAMP
        )
        expect(finishedStack).toBeDefined()
        console.log(JSON.stringify(finishedStack, null, 4))
        const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput)
        GRAPHQL_ENDPOINT = getApiEndpoint(finishedStack.Outputs)
        console.log(`Using graphql url: ${GRAPHQL_ENDPOINT}`);

        const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput)
        const endpoint = getApiEndpoint(finishedStack.Outputs)
        const apiKey = getApiKey(finishedStack.Outputs)
        expect(apiKey).toBeTruthy()
        expect(endpoint).toBeTruthy()
        GRAPHQL_CLIENT = new GraphQLClient(endpoint, { 'x-api-key': apiKey })
    } catch (e) {
        console.log(e)
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
            console.log(e)
        }
    }
    try {
        await emptyBucket(BUCKET_NAME);
    } catch (e) {
        console.error(`Failed to empty S3 bucket: ${e}`)
    }
})

afterEach(async () => {
  try {
    // delete all the records 
    console.log('deleting posts');
    const response = await GRAPHQL_CLIENT.query(`
    query {
      listPosts {
        items {
          id
        }
      }
    }`, {})
    const rows = response.data.listPosts.items || [];
    const deletePromises = [];
    rows.forEach(row => {
      deletePromises.push(GRAPHQL_CLIENT.query(`mutation delete{
        deletePost(input: {id: "${row.id}"}) { id }
      }`))
    })
    await Promise.all(deletePromises)
  } catch (e) {
    console.log(e);
  }
})


/**
 * Test queries below
 */
test('Test createAuthor mutation', async () => {
    try {
        const response = await GRAPHQL_CLIENT.query(`mutation($input: CreateAuthorInput!) {
            createAuthor(input: $input) {
                id
                name
                entityMetadata {
                    isActive
                }
            }
        }`, {
                input: {
                    name: 'Jeff B',
                    entityMetadata: {
                        isActive: true
                    }
                }
            })
        expect(response.data.createAuthor.id).toBeDefined()
        expect(response.data.createAuthor.name).toEqual('Jeff B')
        expect(response.data.createAuthor.entityMetadata).toBeDefined()
        expect(response.data.createAuthor.entityMetadata.isActive).toEqual(true)
    } catch (e) {
        console.log(e)
        // fail
        expect(e).toBeUndefined()
    }
})

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
        console.log(e)
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
        console.log(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test createPost and updatePost mutation with a client generated id.', async () => {
    try {
        const clientId = 'a-client-side-generated-id';
        const createResponse = await GRAPHQL_CLIENT.query(`mutation {
            createPost(input: { id: "${clientId}" title: "Test Update" }) {
                id
                title
                createdAt
                updatedAt
            }
        }`, {})
        console.log(JSON.stringify(createResponse, null, 4))
        expect(createResponse.data.createPost.id).toEqual(clientId)
        expect(createResponse.data.createPost.title).toEqual('Test Update')
        const updateResponse = await GRAPHQL_CLIENT.query(`mutation {
            updatePost(input: { id: "${clientId}", title: "Bye, World!" }) {
                id
                title
            }
        }`, {})
        console.log(JSON.stringify(updateResponse, null, 4))
        expect(updateResponse.data.updatePost.id).toEqual(clientId)
        expect(updateResponse.data.updatePost.title).toEqual('Bye, World!')
        const getResponse = await GRAPHQL_CLIENT.query(`query {
            getPost(id: "${clientId}") {
                id
                title
            }
        }`, {})
        console.log(JSON.stringify(getResponse, null, 4))
        expect(getResponse.data.getPost.id).toEqual(clientId)
        expect(getResponse.data.getPost.title).toEqual('Bye, World!')

        const deleteResponse = await GRAPHQL_CLIENT.query(`mutation {
            deletePost(input: { id: "${clientId}" }) {
                id
                title
            }
        }`, {})
        console.log(JSON.stringify(deleteResponse, null, 4))
        expect(deleteResponse.data.deletePost.id).toEqual(clientId)
        expect(deleteResponse.data.deletePost.title).toEqual('Bye, World!')

        const getResponse2 = await GRAPHQL_CLIENT.query(`query {
            getPost(id: "${clientId}") {
                id
                title
            }
        }`, {})
        console.log(JSON.stringify(getResponse2, null, 4))
        expect(getResponse2.data.getPost).toBeNull()
    } catch (e) {
        console.log(e)
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
        console.log(e)
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
        expect(createResponse.data.createPost.id).toBeTruthy()
        expect(createResponse.data.createPost.title).toEqual('Test Get')
        const getResponse = await GRAPHQL_CLIENT.query(`query {
            getPost(id: "${createResponse.data.createPost.id}") {
                id
                title
            }
        }`, {})
        expect(getResponse.data.getPost.title).toEqual('Test Get')
    } catch (e) {
        console.log(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test listPosts query', async () => {
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
            listPosts {
                items {
                    id
                    title
                }
            }
        }`, {})
        expect(listResponse.data.listPosts.items).toBeDefined()
        const items = listResponse.data.listPosts.items
        expect(items.length).toBeGreaterThan(0)
    } catch (e) {
        console.log(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test listPosts query with filter', async () => {
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
            listPosts(filter: {
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
        console.log(JSON.stringify(listWithFilterResponse, null, 4))
        expect(listWithFilterResponse.data.listPosts.items).toBeDefined()
        const items = listWithFilterResponse.data.listPosts.items
        expect(items.length).toEqual(1)
        expect(items[0].title).toEqual('Test List with filter')
    } catch (e) {
        console.log(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test enum filters List', async () => {
  try {
    await GRAPHQL_CLIENT.query(
      `mutation {
            createPost(input: { title: "Appears in New Hope", appearsIn: [NEWHOPE], episode: NEWHOPE }) {
                id
                title
                createdAt
                updatedAt
            }
        }`,
      {}
    );
    await GRAPHQL_CLIENT.query(
      `mutation {
            createPost(input: { title: "Appears in Jedi", appearsIn: [JEDI], episode: JEDI }) {
                id
                title
                createdAt
                updatedAt
            }
        }`,
      {}
    );
    await GRAPHQL_CLIENT.query(
        `mutation {
              createPost(input: { title: "Appears in Empire", appearsIn: [EMPIRE], episode: EMPIRE }) {
                  id
                  title
                  createdAt
                  updatedAt
              }
          }`,
        {}
      );

    await GRAPHQL_CLIENT.query(
        `mutation {
              createPost(input: { title: "Appears in Empire & JEDI", appearsIn: [EMPIRE, JEDI] }) {
                  id
                  title
                  createdAt
                  updatedAt
              }
          }`,
        {}
    );

    // filter list of enums
    const appearsInWithFilterResponseJedi = await GRAPHQL_CLIENT.query(
      `query {
            listPosts(filter: { appearsIn: {eq: [JEDI]}}) {
                items {
                    title
                    id
                }
            }
        }
        `,
      {}
    );
    expect(appearsInWithFilterResponseJedi.data.listPosts.items).toBeDefined();
    const items = appearsInWithFilterResponseJedi.data.listPosts.items;
    expect(items.length).toEqual(1);
    expect(items[0].title).toEqual('Appears in Jedi');

    const appearsInWithFilterResponseNonJedi = await GRAPHQL_CLIENT.query(
      `query {
            listPosts(filter: { appearsIn: {ne: [JEDI]}}) {
                items {
                    title
                    id
                }
            }
        }
        `,
      {}
    );
    expect(appearsInWithFilterResponseNonJedi.data.listPosts.items).toBeDefined();
    const appearsInNonJediItems = appearsInWithFilterResponseNonJedi.data.listPosts.items;
    expect(appearsInNonJediItems.length).toEqual(3);
    appearsInNonJediItems.forEach((item) => {
      expect(['Appears in Empire & JEDI', 'Appears in New Hope', 'Appears in Empire'].includes(item.title))
        .toBeTruthy();
    })

    const appearsInContainingJedi = await GRAPHQL_CLIENT.query(
      `query {
            listPosts(filter: { appearsIn: {contains: JEDI }}) {
                items {
                    title
                    id
                }
            }
        }
        `,
      {}
    );
    expect(appearsInContainingJedi.data.listPosts.items).toBeDefined();
    const appearsInWithJediItems = appearsInContainingJedi.data.listPosts.items;
    expect(appearsInWithJediItems.length).toEqual(2);
    appearsInWithJediItems.forEach((item) => {
      expect(['Appears in Empire & JEDI', 'Appears in Jedi'].includes(item.title))
        .toBeTruthy();
    })

    const appearsInNotContainingJedi = await GRAPHQL_CLIENT.query(
      `query {
            listPosts(filter: { appearsIn: {notContains: JEDI }}) {
                items {
                    title
                    id
                }
            }
        }
        `,
      {}
    );
    expect(appearsInNotContainingJedi.data.listPosts.items).toBeDefined();
    const appearsInWithNonJediItems = appearsInNotContainingJedi.data.listPosts.items;
    expect(appearsInWithNonJediItems.length).toEqual(2);
    appearsInWithNonJediItems.forEach((item) => {
      expect(['Appears in New Hope', 'Appears in Empire'].includes(item.title))
        .toBeTruthy();
    })

    // enum filter
    const jediEpisode = await GRAPHQL_CLIENT.query(
      `query {
            listPosts(filter: { episode: {eq: JEDI }}) {
                items {
                    title
                    id
                }
            }
        }
        `,
      {}
    );
    expect(jediEpisode.data.listPosts.items).toBeDefined();
    const jediEpisodeItems = jediEpisode.data.listPosts.items;
    expect(jediEpisodeItems.length).toEqual(1);
    expect(jediEpisodeItems[0].title).toEqual('Appears in Jedi')

    const nonJediEpisode = await GRAPHQL_CLIENT.query(
      `query {
            listPosts(filter: { episode: {ne: JEDI }}) {
                items {
                    title
                    id
                }
            }
        }
        `,
      {}
    );
    expect(nonJediEpisode.data.listPosts.items).toBeDefined();
    const nonJediEpisodeItems = nonJediEpisode.data.listPosts.items;
    expect(nonJediEpisodeItems.length).toEqual(3);
    nonJediEpisodeItems.forEach((item) => {
      expect(['Appears in New Hope', 'Appears in Empire', 'Appears in Empire & JEDI'].includes(item.title))
        .toBeTruthy();
    })
  } catch (e) {
    console.log(e);
    // fail
    expect(e).toBeUndefined();
  }
});

test('Test createPost mutation with non-model types', async () => {
    try {
        const response = await GRAPHQL_CLIENT.query(`mutation CreatePost($input: CreatePostInput!) {
            createPost(input: $input) {
                id
                title
                createdAt
                updatedAt
                metadata {
                    tags {
                        published
                        metadata {
                            tags {
                                published
                            }
                        }
                    }
                }
                appearsIn
            }
        }`, {
                input: {
                    title: 'Check that metadata exists',
                    metadata: {
                        tags: {
                            published: true,
                            metadata: {
                                tags: {
                                    published: false
                                }
                            }
                        }
                    },
                    appearsIn: ['NEWHOPE']
                }
            })
        expect(response.data.createPost.id).toBeDefined()
        expect(response.data.createPost.title).toEqual('Check that metadata exists')
        expect(response.data.createPost.createdAt).toBeDefined()
        expect(response.data.createPost.updatedAt).toBeDefined()
        expect(response.data.createPost.metadata).toBeDefined()
        expect(response.data.createPost.metadata.tags.published).toEqual(true)
        expect(response.data.createPost.metadata.tags.metadata.tags.published).toEqual(false)
        expect(response.data.createPost.appearsIn).toEqual(['NEWHOPE'])
    } catch (e) {
        console.log(e)
        // fail
        expect(e).toBeUndefined()
    }
})

test('Test updatePost mutation with non-model types', async () => {
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
        const updateResponse = await GRAPHQL_CLIENT.query(`mutation UpdatePost($input: UpdatePostInput!) {
            updatePost(input: $input) {
                id
                title
                createdAt
                updatedAt
                metadata {
                    tags {
                        published
                        metadata {
                            tags {
                                published
                            }
                        }
                    }
                }
                appearsIn
            }
        }`, {
                input: {
                    id: createResponse.data.createPost.id,
                    title: 'Add some metadata',
                    metadata: {
                        tags: {
                            published: true,
                            metadata: {
                                tags: {
                                    published: false
                                }
                            }
                        }
                    },
                    appearsIn: ['NEWHOPE', 'EMPIRE']
                }
            })
        console.log(JSON.stringify(updateResponse, null, 4))
        expect(updateResponse.data.updatePost.title).toEqual('Add some metadata')
        expect(updateResponse.data.updatePost.metadata).toBeDefined()
        expect(updateResponse.data.updatePost.metadata.tags.published).toEqual(true)
        expect(updateResponse.data.updatePost.metadata.tags.metadata.tags.published).toEqual(false)
        expect(updateResponse.data.updatePost.appearsIn).toEqual(['NEWHOPE', 'EMPIRE'])
    } catch (e) {
        console.log(e)
        // fail
        expect(e).toBeUndefined()
    }
})
