import { AmplifyAppSyncSimulator } from '@aws-amplify/amplify-appsync-simulator';
import { deploy, launchDDBLocal, terminateDDB, logDebug, GraphQLClient } from '../__e2e__/utils';
import { transformAndSynth, defaultTransformParams } from './test-synthesizer';

let GRAPHQL_ENDPOINT: string;
let GRAPHQL_CLIENT: GraphQLClient;
let ddbEmulator = null;
let dbPath = null;
let server: AmplifyAppSyncSimulator;

jest.setTimeout(2000000);

describe('@model transformer', () => {
  beforeAll(async () => {
    const validSchema = `
      type Post @model @auth(rules: [{ allow: public }]) {
        id: ID!
        title: String!
        createdAt: AWSDateTime
        updatedAt: AWSDateTime
        metadata: PostMetadata
        entityMetadata: EntityMetadata
        appearsIn: [Episode!]
        episode: Episode
      }

      type Author @model @auth(rules: [{ allow: public }]) {
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
      }`;

    try {
      const out = transformAndSynth({
        ...defaultTransformParams,
        schema: validSchema,
      });
      let ddbClient;
      ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await launchDDBLocal());
      const result = await deploy(out, ddbClient);
      server = result.simulator;

      GRAPHQL_ENDPOINT = server.url + '/graphql';
      logDebug(`Using graphql url: ${GRAPHQL_ENDPOINT}`);

      const apiKey = result.config.appSync.apiKey;
      logDebug(apiKey);
      GRAPHQL_CLIENT = new GraphQLClient(GRAPHQL_ENDPOINT, {
        'x-api-key': apiKey,
      });
    } catch (e) {
      logDebug('error when setting up test');
      logDebug(e);
      throw e;
    }
  });

  afterAll(async () => {
    if (server) {
      await server.stop();
    }
    await terminateDDB(ddbEmulator, dbPath);
  });

  afterEach(async () => {
    try {
      logDebug('deleting posts');
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
      rows.forEach((row) => {
        deletePromises.push(
          GRAPHQL_CLIENT.query(
            `mutation delete {
            deletePost(input: {id: "${row.id}"}) { id }
          }`,
            {},
          ),
        );
      });
      await Promise.all(deletePromises);
    } catch (e) {
      logDebug(e);
    }
  });

  /**
   * Test queries below
   */
  test('createAuthor mutation', async () => {
    const response = await GRAPHQL_CLIENT.query(
      `mutation($input: CreateAuthorInput!) {
            createAuthor(input: $input) {
                id
                name
                entityMetadata {
                    isActive
                }
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
    logDebug(response);
    expect(response.data.createAuthor.id).toBeDefined();
    expect(response.data.createAuthor.name).toEqual('Jeff B');
    expect(response.data.createAuthor.entityMetadata).toBeDefined();
    expect(response.data.createAuthor.entityMetadata.isActive).toEqual(true);
  });

  test('createPost mutation', async () => {
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

  test('query on get query with null field', async () => {
    const createResponse = await GRAPHQL_CLIENT.query(
      `
      mutation {
        createPost(input: { title: "Cool Post" }) {
          id
          title
          createdAt
          updatedAt
        }
      }`,
      {},
    );
    expect(createResponse.data.createPost.id).toBeDefined();
    expect(createResponse.data.createPost.title).toEqual('Cool Post');
    const postID = createResponse.data.createPost.id;
    const queryResponse = await GRAPHQL_CLIENT.query(
      `
      query {
        getPost(id: "${postID}") {
          id
          title
          episode
        }
      }`,
      {},
    );
    expect(queryResponse.data.getPost.id).toEqual(postID);
    expect(queryResponse.data.getPost.episode).toBeNull();
  });

  test('updatePost mutation', async () => {
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
    logDebug(JSON.stringify(createResponse, null, 4));
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
    logDebug(JSON.stringify(updateResponse, null, 4));
    expect(updateResponse.data.updatePost.title).toEqual('Bye, World!');
  });

  test('createPost and updatePost mutation with a client generated id.', async () => {
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
    logDebug(JSON.stringify(createResponse, null, 4));
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
    logDebug(JSON.stringify(updateResponse, null, 4));
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
    logDebug(JSON.stringify(getResponse, null, 4));
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
    logDebug(JSON.stringify(deleteResponse, null, 4));
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
    logDebug(JSON.stringify(getResponse2, null, 4));
    expect(getResponse2.data.getPost).toBeNull();
  });

  test('deletePost mutation', async () => {
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
    logDebug(JSON.stringify(createResponse, null, 4));
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
    logDebug(JSON.stringify(deleteResponse, null, 4));
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
    logDebug(JSON.stringify(getResponse, null, 4));
    expect(getResponse.data.getPost).toBeNull();
  });

  test('getPost query', async () => {
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

  test('listPosts query', async () => {
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

  test('listPosts query with filter', async () => {
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
    logDebug(JSON.stringify(listWithFilterResponse, null, 4));
    expect(listWithFilterResponse.data.listPosts.items).toBeDefined();
    const items = listWithFilterResponse.data.listPosts.items;
    expect(items.length).toEqual(1);
    expect(items[0].title).toEqual('Test List with filter');
  });

  test('enum filters List', async () => {
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
    logDebug(items);
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
    logDebug(JSON.stringify(appearsInWithFilterResponseNonJedi));
    expect(appearsInWithFilterResponseNonJedi.data.listPosts.items).toBeDefined();
    const appearsInNonJediItems = appearsInWithFilterResponseNonJedi.data.listPosts.items;
    expect(appearsInNonJediItems.length).toEqual(3);
    appearsInNonJediItems.forEach((item) => {
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
    appearsInWithJediItems.forEach((item) => {
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
    appearsInWithNonJediItems.forEach((item) => {
      expect(['Appears in New Hope', 'Appears in Empire'].includes(item.title)).toBeTruthy();
    });

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
    nonJediEpisodeItems.forEach((item) => {
      expect(['Appears in New Hope', 'Appears in Empire', 'Appears in Empire & JEDI'].includes(item.title)).toBeTruthy();
    });
  });

  test('createPost mutation with non-model types', async () => {
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

  test('updatePost mutation with non-model types', async () => {
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
});
