import { ResourceConstants } from 'graphql-transformer-common';
import { GraphQLTransform } from 'graphql-transformer-core';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { ModelAuthTransformer } from 'graphql-auth-transformer';
import { CloudFormationClient } from '../CloudFormationClient';
import { Output } from 'aws-sdk/clients/cloudformation';
import { GraphQLClient } from '../GraphQLClient';
import { cleanupStackAfterTest, deploy } from '../deployNestedStacks';
import { S3Client } from '../S3Client';
import { default as S3 } from 'aws-sdk/clients/s3';
import { default as moment } from 'moment';

jest.setTimeout(2000000);

const cf = new CloudFormationClient('us-west-2');
const customS3Client = new S3Client('us-west-2');
const awsS3Client = new S3({ region: 'us-west-2' });

const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `DynamoDBModelTransformerTest-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `appsync-model-transformer-test-bucket-${BUILD_TIMESTAMP}`;

let GRAPHQL_CLIENT = undefined;

const TMP_ROOT = '/tmp/model_transform_tests/';

const ROOT_KEY = 'deployments';

let GRAPHQL_ENDPOINT = undefined;

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}

beforeAll(async () => {
  const validSchema = /* GraphQL */ `
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
    type Require @model {
      id: ID!
      requiredField: String!
      notRequiredField: String
    }
    type Comment @model(timestamps: { createdAt: "createdOn", updatedAt: "updatedOn" }) {
      id: ID!
      title: String!
      content: String
      updatedOn: Int # No automatic generation of timestamp if its not AWSDateTime
    }
  `;
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'API_KEY',
          },
          additionalAuthenticationProviders: [],
        },
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  // fs.writeFileSync('./out.json', JSON.stringify(out, null, 4));
  try {
    await awsS3Client
      .createBucket({
        Bucket: BUCKET_NAME,
      })
      .promise();
  } catch (e) {
    console.error(`Failed to create S3 bucket: ${e}`);
  }
  const finishedStack = await deploy(
    customS3Client,
    cf,
    STACK_NAME,
    out,
    { CreateAPIKey: '1', DynamoDBEnablePointInTimeRecovery: 'true' },
    TMP_ROOT,
    BUCKET_NAME,
    ROOT_KEY,
    BUILD_TIMESTAMP,
  );
  expect(finishedStack).toBeDefined();
  const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
  const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput);
  GRAPHQL_ENDPOINT = getApiEndpoint(finishedStack.Outputs);

  const apiKey = getApiKey(finishedStack.Outputs);
  expect(apiKey).toBeTruthy();
  expect(GRAPHQL_ENDPOINT).toBeTruthy();
  GRAPHQL_CLIENT = new GraphQLClient(GRAPHQL_ENDPOINT, { 'x-api-key': apiKey });
});

afterAll(async () => {
  await cleanupStackAfterTest(BUCKET_NAME, STACK_NAME, cf);
});

afterEach(async () => {
  // delete all the records
  const response = await GRAPHQL_CLIENT.query(
    `
  query {
    listPosts {
      items {
        id
      }
    }
  }`,
    {},
  );
  const rows = response.data.listPosts.items || [];
  const deletePromises = [];
  rows.forEach(row => {
    deletePromises.push(
      GRAPHQL_CLIENT.query(`mutation delete{
      deletePost(input: {id: "${row.id}"}) { id }
    }`),
    );
  });
  await Promise.all(deletePromises);
});

/**
 * Test queries below
 */
test('Test createAuthor mutation', async () => {
  const response = await GRAPHQL_CLIENT.query(
    `mutation($input: CreateAuthorInput!) {
          createAuthor(input: $input) {
              id
              name
              entityMetadata {
                  isActive
              }
              createdAt
              updatedAt
          }
      }`,
    {
      input: {
        name: 'Jeff B',
        entityMetadata: {
          isActive: true,
        },
      },
    },
  );
  expect(response.data.createAuthor.id).toBeDefined();
  expect(response.data.createAuthor.name).toEqual('Jeff B');
  expect(response.data.createAuthor.createdAt).toBeDefined();
  expect(response.data.createAuthor.updatedAt).toBeDefined();
  expect(response.data.createAuthor.entityMetadata).toBeDefined();
  expect(response.data.createAuthor.entityMetadata.isActive).toEqual(true);
});

test('Test createPost mutation', async () => {
  const response = await GRAPHQL_CLIENT.query(
    `mutation {
          createPost(input: { title: "Hello, World!" }) {
              id
              title
              createdAt
              updatedAt
          }
      }`,
    {},
  );
  expect(response.data.createPost.id).toBeDefined();
  expect(response.data.createPost.title).toEqual('Hello, World!');
  expect(response.data.createPost.createdAt).toBeDefined();
  expect(response.data.createPost.updatedAt).toBeDefined();
});
test('Test updateComment mutation with null and empty', async () => {
  const requiredFieldValue = 'thisisrequired';
  const notRequiredFieldValue = 'thisisnotrequired';
  const response = await GRAPHQL_CLIENT.query(
    /* GraphQL */ `
      mutation($input: CreateRequireInput!) {
        createRequire(input: $input) {
          id
          requiredField
          notRequiredField
        }
      }
    `,
    {
      input: {
        requiredField: requiredFieldValue,
        notRequiredField: notRequiredFieldValue,
      },
    },
  );
  expect(response.data.createRequire.id).toBeDefined();
  const id = response.data.createRequire.id;
  const updateResponse = await GRAPHQL_CLIENT.query(
    /* GraphQL */ `
      mutation($input: UpdateRequireInput!) {
        updateRequire(input: $input) {
          id
          requiredField
          notRequiredField
        }
      }
    `,
    {
      input: {
        id: id,
      },
    },
  );
  expect(updateResponse.data.updateRequire.requiredField).toEqual(requiredFieldValue);
  expect(updateResponse.data.updateRequire.notRequiredField).toEqual(notRequiredFieldValue);
  const update2Response = await GRAPHQL_CLIENT.query(
    /* GraphQL */ `
      mutation($input: UpdateRequireInput!) {
        updateRequire(input: $input) {
          id
          requiredField
          notRequiredField
        }
      }
    `,
    {
      input: {
        id: id,
        requiredField: null,
      },
    },
  );
  expect(update2Response.errors[0].message).toEqual(
    'An argument you marked as Non-Null is set to Null in the query or the body of your request.',
  );
});
test('Test updatePost mutation', async () => {
  const createResponse = await GRAPHQL_CLIENT.query(
    `mutation {
          createPost(input: { title: "Test Update" }) {
              id
              title
              createdAt
              updatedAt
          }
      }`,
    {},
  );
  expect(createResponse.data.createPost.id).toBeDefined();
  expect(createResponse.data.createPost.title).toEqual('Test Update');
  const updateResponse = await GRAPHQL_CLIENT.query(
    `mutation {
          updatePost(input: { id: "${createResponse.data.createPost.id}", title: "Bye, World!" }) {
              id
              title
          }
      }`,
    {},
  );
  expect(updateResponse.data.updatePost.title).toEqual('Bye, World!');
});

test('Test createPost and updatePost mutation with a client generated id.', async () => {
  const clientId = 'a-client-side-generated-id';
  const createResponse = await GRAPHQL_CLIENT.query(
    `mutation {
          createPost(input: { id: "${clientId}" title: "Test Update" }) {
              id
              title
              createdAt
              updatedAt
          }
      }`,
    {},
  );
  expect(createResponse.data.createPost.id).toEqual(clientId);
  expect(createResponse.data.createPost.title).toEqual('Test Update');
  const updateResponse = await GRAPHQL_CLIENT.query(
    `mutation {
          updatePost(input: { id: "${clientId}", title: "Bye, World!" }) {
              id
              title
          }
      }`,
    {},
  );
  expect(updateResponse.data.updatePost.id).toEqual(clientId);
  expect(updateResponse.data.updatePost.title).toEqual('Bye, World!');
  const getResponse = await GRAPHQL_CLIENT.query(
    `query {
          getPost(id: "${clientId}") {
              id
              title
          }
      }`,
    {},
  );
  expect(getResponse.data.getPost.id).toEqual(clientId);
  expect(getResponse.data.getPost.title).toEqual('Bye, World!');

  const deleteResponse = await GRAPHQL_CLIENT.query(
    `mutation {
          deletePost(input: { id: "${clientId}" }) {
              id
              title
          }
      }`,
    {},
  );
  expect(deleteResponse.data.deletePost.id).toEqual(clientId);
  expect(deleteResponse.data.deletePost.title).toEqual('Bye, World!');

  const getResponse2 = await GRAPHQL_CLIENT.query(
    `query {
          getPost(id: "${clientId}") {
              id
              title
          }
      }`,
    {},
  );
  expect(getResponse2.data.getPost).toBeNull();
});

test('Test deletePost mutation', async () => {
  const createResponse = await GRAPHQL_CLIENT.query(
    `mutation {
          createPost(input: { title: "Test Delete" }) {
              id
              title
              createdAt
              updatedAt
          }
      }`,
    {},
  );
  expect(createResponse.data.createPost.id).toBeDefined();
  expect(createResponse.data.createPost.title).toEqual('Test Delete');
  const deleteResponse = await GRAPHQL_CLIENT.query(
    `mutation {
          deletePost(input: { id: "${createResponse.data.createPost.id}" }) {
              id
              title
          }
      }`,
    {},
  );
  expect(deleteResponse.data.deletePost.title).toEqual('Test Delete');
  const getResponse = await GRAPHQL_CLIENT.query(
    `query {
          getPost(id: "${createResponse.data.createPost.id}") {
              id
              title
          }
      }`,
    {},
  );
  expect(getResponse.data.getPost).toBeNull();
});

test('Test getPost query', async () => {
  const createResponse = await GRAPHQL_CLIENT.query(
    `mutation {
          createPost(input: { title: "Test Get" }) {
              id
              title
              createdAt
              updatedAt
          }
      }`,
    {},
  );
  expect(createResponse.data.createPost.id).toBeTruthy();
  expect(createResponse.data.createPost.title).toEqual('Test Get');
  const getResponse = await GRAPHQL_CLIENT.query(
    `query {
          getPost(id: "${createResponse.data.createPost.id}") {
              id
              title
          }
      }`,
    {},
  );
  expect(getResponse.data.getPost.title).toEqual('Test Get');
});

test('Test listPosts query', async () => {
  const createResponse = await GRAPHQL_CLIENT.query(
    `mutation {
          createPost(input: { title: "Test List" }) {
              id
              title
              createdAt
              updatedAt
          }
      }`,
    {},
  );
  expect(createResponse.data.createPost.id).toBeDefined();
  expect(createResponse.data.createPost.title).toEqual('Test List');
  const listResponse = await GRAPHQL_CLIENT.query(
    `query {
          listPosts {
              items {
                  id
                  title
              }
          }
      }`,
    {},
  );
  expect(listResponse.data.listPosts.items).toBeDefined();
  const items = listResponse.data.listPosts.items;
  expect(items.length).toBeGreaterThan(0);
});

test('Test listPosts query with filter', async () => {
  const createResponse = await GRAPHQL_CLIENT.query(
    `mutation {
          createPost(input: { title: "Test List with filter" }) {
              id
              title
              createdAt
              updatedAt
          }
      }`,
    {},
  );
  expect(createResponse.data.createPost.id).toBeDefined();
  expect(createResponse.data.createPost.title).toEqual('Test List with filter');
  const listWithFilterResponse = await GRAPHQL_CLIENT.query(
    `query {
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
      }`,
    {},
  );
  expect(listWithFilterResponse.data.listPosts.items).toBeDefined();
  const items = listWithFilterResponse.data.listPosts.items;
  expect(items.length).toEqual(1);
  expect(items[0].title).toEqual('Test List with filter');
});

test('Test enum filters List', async () => {
  await GRAPHQL_CLIENT.query(
    `mutation {
          createPost(input: { title: "Appears in New Hope", appearsIn: [NEWHOPE], episode: NEWHOPE }) {
              id
              title
              createdAt
              updatedAt
          }
      }`,
    {},
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
    {},
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
    {},
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
    {},
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
    {},
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
    {},
  );
  expect(appearsInWithFilterResponseNonJedi.data.listPosts.items).toBeDefined();
  const appearsInNonJediItems = appearsInWithFilterResponseNonJedi.data.listPosts.items;
  expect(appearsInNonJediItems.length).toEqual(3);
  appearsInNonJediItems.forEach(item => {
    expect(['Appears in Empire & JEDI', 'Appears in New Hope', 'Appears in Empire'].includes(item.title)).toBeTruthy();
  });

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
    {},
  );
  expect(appearsInContainingJedi.data.listPosts.items).toBeDefined();
  const appearsInWithJediItems = appearsInContainingJedi.data.listPosts.items;
  expect(appearsInWithJediItems.length).toEqual(2);
  appearsInWithJediItems.forEach(item => {
    expect(['Appears in Empire & JEDI', 'Appears in Jedi'].includes(item.title)).toBeTruthy();
  });

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
    {},
  );
  expect(appearsInNotContainingJedi.data.listPosts.items).toBeDefined();
  const appearsInWithNonJediItems = appearsInNotContainingJedi.data.listPosts.items;
  expect(appearsInWithNonJediItems.length).toEqual(2);
  appearsInWithNonJediItems.forEach(item => {
    expect(['Appears in New Hope', 'Appears in Empire'].includes(item.title)).toBeTruthy();
  });

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
    {},
  );
  expect(jediEpisode.data.listPosts.items).toBeDefined();
  const jediEpisodeItems = jediEpisode.data.listPosts.items;
  expect(jediEpisodeItems.length).toEqual(1);
  expect(jediEpisodeItems[0].title).toEqual('Appears in Jedi');

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
    {},
  );
  expect(nonJediEpisode.data.listPosts.items).toBeDefined();
  const nonJediEpisodeItems = nonJediEpisode.data.listPosts.items;
  expect(nonJediEpisodeItems.length).toEqual(3);
  nonJediEpisodeItems.forEach(item => {
    expect(['Appears in New Hope', 'Appears in Empire', 'Appears in Empire & JEDI'].includes(item.title)).toBeTruthy();
  });
});

test('Test next token', async () => {
  const createResponse = await GRAPHQL_CLIENT.query(
    `mutation {
            first: createPost(input: { title: "Test create for next token one" }) {
                id
                title
                createdAt
                updatedAt
            }
            second:  createPost(input: { title: "Test create for next token two" }) {
              id
              title
              createdAt
              updatedAt
          }
        }`,
    {},
  );
  expect(createResponse.data.first.id).toBeDefined();
  expect(createResponse.data.first.title).toEqual('Test create for next token one');

  expect(createResponse.data.second.id).toBeDefined();
  expect(createResponse.data.second.title).toEqual('Test create for next token two');

  const listResponse = await GRAPHQL_CLIENT.query(
    /* GraphQL */ `
      query {
        listPosts(limit: 1) {
          items {
            id
            title
          }
          nextToken
        }
      }
    `,
    {},
  );
  expect(listResponse.data.listPosts.items).toBeDefined();
  const items = listResponse.data.listPosts.items;
  expect(items.length).toEqual(1);
  expect(listResponse.data.listPosts.nextToken).toBeDefined();
  expect(listResponse.data.listPosts.nextToken).not.toBeNull();

  const listResponsePage2 = await GRAPHQL_CLIENT.query(
    /* GraphQL */ `query {
            listPosts(limit: 1, nextToken:"${listResponse.data.listPosts.nextToken}") {
                items {
                    id
                    title
                }
                nextToken
            }
        }`,
    {},
  );
  expect(listResponsePage2.data.listPosts.items).toBeDefined();
  const items2 = listResponsePage2.data.listPosts.items;
  expect(items2.length).toBeGreaterThan(0);
});

test('Test createPost mutation with non-model types', async () => {
  const response = await GRAPHQL_CLIENT.query(
    `mutation CreatePost($input: CreatePostInput!) {
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
      }`,
    {
      input: {
        title: 'Check that metadata exists',
        metadata: {
          tags: {
            published: true,
            metadata: {
              tags: {
                published: false,
              },
            },
          },
        },
        appearsIn: ['NEWHOPE'],
      },
    },
  );
  expect(response.data.createPost.id).toBeDefined();
  expect(response.data.createPost.title).toEqual('Check that metadata exists');
  expect(response.data.createPost.createdAt).toBeDefined();
  expect(response.data.createPost.updatedAt).toBeDefined();
  expect(response.data.createPost.metadata).toBeDefined();
  expect(response.data.createPost.metadata.tags.published).toEqual(true);
  expect(response.data.createPost.metadata.tags.metadata.tags.published).toEqual(false);
  expect(response.data.createPost.appearsIn).toEqual(['NEWHOPE']);
});

test('Test updatePost mutation with non-model types', async () => {
  const createResponse = await GRAPHQL_CLIENT.query(
    `mutation {
          createPost(input: { title: "Test Update" }) {
              id
              title
              createdAt
              updatedAt
          }
      }`,
    {},
  );
  expect(createResponse.data.createPost.id).toBeDefined();
  expect(createResponse.data.createPost.title).toEqual('Test Update');
  const updateResponse = await GRAPHQL_CLIENT.query(
    `mutation UpdatePost($input: UpdatePostInput!) {
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
      }`,
    {
      input: {
        id: createResponse.data.createPost.id,
        title: 'Add some metadata',
        metadata: {
          tags: {
            published: true,
            metadata: {
              tags: {
                published: false,
              },
            },
          },
        },
        appearsIn: ['NEWHOPE', 'EMPIRE'],
      },
    },
  );
  expect(updateResponse.data.updatePost.title).toEqual('Add some metadata');
  expect(updateResponse.data.updatePost.metadata).toBeDefined();
  expect(updateResponse.data.updatePost.metadata.tags.published).toEqual(true);
  expect(updateResponse.data.updatePost.metadata.tags.metadata.tags.published).toEqual(false);
  expect(updateResponse.data.updatePost.appearsIn).toEqual(['NEWHOPE', 'EMPIRE']);
});

describe('Timestamp configuration', () => {
  test('Test createdAt is present in the schema', async () => {
    const response = await GRAPHQL_CLIENT.query(
      /* GraphQL */ `
        mutation CreateComment {
          createComment(input: { title: "GraphQL transformer rocks" }) {
            id
            title
            createdOn
            updatedOn
          }
        }
      `,
      {},
    );
    expect(response.data.createComment.id).toBeDefined();
    expect(response.data.createComment.title).toEqual('GraphQL transformer rocks');
    expect(response.data.createComment.updatedOn).toBeNull();
    expect(response.data.createComment.createdOn).toBeDefined();
  });
});
