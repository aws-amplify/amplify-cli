import { ModelAuthTransformer } from 'graphql-auth-transformer';
import { ModelConnectionTransformer } from 'graphql-connection-transformer';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { FeatureFlagProvider, GraphQLTransform } from 'graphql-transformer-core';
import { signUpAddToGroupAndGetJwtToken } from './utils/cognito-utils';
import { GraphQLClient } from './utils/graphql-client';
import { deploy, launchDDBLocal, logDebug, terminateDDB } from './utils/index';
import 'isomorphic-fetch';

jest.setTimeout(2000000);

let GRAPHQL_ENDPOINT = undefined;

/**
 * Client 1 is logged in and is a member of the Admin group.
 */
let GRAPHQL_CLIENT_1 = undefined;

/**
 * Client 2 is logged in and is a member of the Devs group.
 */
let GRAPHQL_CLIENT_2 = undefined;

/**
 * Client 3 is logged in and has no group memberships.
 */
let GRAPHQL_CLIENT_3 = undefined;

let USER_POOL_ID = 'y9CqgkEJe';

const USERNAME1 = 'user1@test.com';
const USERNAME2 = 'user2@test.com';
const USERNAME3 = 'user3@test.com';

const ADMIN_GROUP_NAME = 'Admin';
const DEVS_GROUP_NAME = 'Devs';
const PARTICIPANT_GROUP_NAME = 'Participant';
const WATCHER_GROUP_NAME = 'Watcher';

let ddbEmulator = null;
let dbPath = null;
let server;

beforeAll(async () => {
  const validSchema = `type Post @model(
    subscriptions: {
        level: public
})@auth(rules: [{ allow: owner }]) {
    id: ID!
    title: String!
    author: User @connection(name: "UserPosts", keyField: "owner")
    owner: String
}
type User @model(
    subscriptions: {
        level: public
    }) @auth(rules: [{ allow: owner }]) {
    id: ID!
    posts: [Post!]! @connection(name: "UserPosts", keyField: "owner")
}
type FieldProtected @model(
    subscriptions: {
        level: public
}){
    id: ID!
    owner: String
    ownerOnly: String @auth(rules: [{ allow: owner }])
}
type OpenTopLevel @model(
    subscriptions: {
        level: public
}) {
    id: ID!
    name: String
    owner: String
    protected: [ConnectionProtected] @connection(name: "ProtectedConnection")
}
type ConnectionProtected @model(
    subscriptions: {
        level: public
    }
    queries: null
)@auth(rules: [{ allow: owner }]) {
    id: ID!
    name: String
    owner: String
    topLevel: OpenTopLevel @connection(name: "ProtectedConnection")
}
type Performance @model @auth(rules: [{ allow: groups, groups: ["Admin"]}]) {
  id: ID
  performer: String!
  description: String!
  time: AWSDateTime
  stage: Stage @connection
}
type Stage @model @auth(rules: [{ allow: groups, groups: ["Admin"]}]) {
  id: ID!
  name: String!
}
    `;
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new ModelConnectionTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'AMAZON_COGNITO_USER_POOLS',
          },
          additionalAuthenticationProviders: [],
        },
      }),
    ],
    featureFlags: {
      getBoolean: name => (name === 'improvePluralization' ? true : false),
    } as FeatureFlagProvider,
  });

  try {
    const out = transformer.transform(validSchema);

    let ddbClient;
    ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await launchDDBLocal());

    const result = await deploy(out, ddbClient);
    server = result.simulator;

    GRAPHQL_ENDPOINT = server.url + '/graphql';
    logDebug(`Using graphql url: ${GRAPHQL_ENDPOINT}`);

    const apiKey = result.config.appSync.apiKey;

    // Verify we have all the details
    expect(GRAPHQL_ENDPOINT).toBeTruthy();

    const idToken = signUpAddToGroupAndGetJwtToken(USER_POOL_ID, USERNAME1, USERNAME1, [
      ADMIN_GROUP_NAME,
      WATCHER_GROUP_NAME,
      PARTICIPANT_GROUP_NAME,
    ]);
    GRAPHQL_CLIENT_1 = new GraphQLClient(GRAPHQL_ENDPOINT, {
      Authorization: idToken,
    });

    const idToken2 = signUpAddToGroupAndGetJwtToken(USER_POOL_ID, USERNAME2, USERNAME2, [DEVS_GROUP_NAME]);
    GRAPHQL_CLIENT_2 = new GraphQLClient(GRAPHQL_ENDPOINT, {
      Authorization: idToken2,
    });

    const idToken3 = signUpAddToGroupAndGetJwtToken(USER_POOL_ID, USERNAME3, USERNAME3, []);
    GRAPHQL_CLIENT_3 = new GraphQLClient(GRAPHQL_ENDPOINT, {
      Authorization: idToken3,
    });

    // Wait for any propagation to avoid random
    // "The security token included in the request is invalid" errors
    await new Promise<void>(res => setTimeout(() => res(), 5000));
  } catch (e) {
    console.error(e);
    throw e;
  }
});

afterAll(async () => {
  try {
    if (server) {
      await server.stop();
    }

    await terminateDDB(ddbEmulator, dbPath);
  } catch (e) {
    console.error(e);
    throw e;
  }
});

/**
 * Tests
 */
test('Test creating a post and immediately view it via the User.posts connection.', async () => {
  const createUser1 = await GRAPHQL_CLIENT_1.query(
    `mutation {
      createUser(input: { id: "user1@test.com" }) {
          id
      }
  }`,
    {},
  );
  logDebug(createUser1);
  expect(createUser1.data.createUser.id).toEqual('user1@test.com');

  const response = await GRAPHQL_CLIENT_1.query(
    `mutation {
      createPost(input: { title: "Hello, World!" }) {
          id
          title
          owner
      }
  }`,
    {},
  );
  logDebug(response);
  expect(response.data.createPost.id).toBeDefined();
  expect(response.data.createPost.title).toEqual('Hello, World!');
  expect(response.data.createPost.owner).toBeDefined();

  const getResponse = await GRAPHQL_CLIENT_1.query(
    `query {
      getUser(id: "user1@test.com") {
          posts {
              items {
                  id
                  title
                  owner
                  author {
                      id
                  }
              }
          }
      }
  }`,
    {},
  );
  logDebug(JSON.stringify(getResponse, null, 4));
  expect(getResponse.data.getUser.posts.items[0].id).toBeDefined();
  expect(getResponse.data.getUser.posts.items[0].title).toEqual('Hello, World!');
  expect(getResponse.data.getUser.posts.items[0].owner).toEqual('user1@test.com');
  expect(getResponse.data.getUser.posts.items[0].author.id).toEqual('user1@test.com');
});

test('Testing reading an owner protected field as a non owner', async () => {
  const response1 = await GRAPHQL_CLIENT_1.query(
    `mutation {
      createFieldProtected(input: { id: "1", owner: "${USERNAME1}", ownerOnly: "owner-protected" }) {
          id
          owner
          ownerOnly
      }
  }`,
    {},
  );
  logDebug(response1);
  expect(response1.data.createFieldProtected.id).toEqual('1');
  expect(response1.data.createFieldProtected.owner).toEqual(USERNAME1);
  expect(response1.data.createFieldProtected.ownerOnly).toEqual('owner-protected');

  const response2 = await GRAPHQL_CLIENT_2.query(
    `query {
      getFieldProtected(id: "1") {
          id
          owner
          ownerOnly
      }
  }`,
    {},
  );
  logDebug(response2);
  expect(response2.data.getFieldProtected.ownerOnly).toBeNull();
  expect(response2.errors).toHaveLength(1);

  const response3 = await GRAPHQL_CLIENT_1.query(
    `query {
      getFieldProtected(id: "1") {
          id
          owner
          ownerOnly
      }
  }`,
    {},
  );
  logDebug(response3);
  expect(response3.data.getFieldProtected.id).toEqual('1');
  expect(response3.data.getFieldProtected.owner).toEqual(USERNAME1);
  expect(response3.data.getFieldProtected.ownerOnly).toEqual('owner-protected');
});

test('Test that @connection resolvers respect @model read operations.', async () => {
  const response1 = await GRAPHQL_CLIENT_1.query(
    `mutation {
      createOpenTopLevel(input: { id: "1", owner: "${USERNAME1}", name: "open" }) {
          id
          owner
          name
      }
  }`,
    {},
  );
  logDebug(response1);
  expect(response1.data.createOpenTopLevel.id).toEqual('1');
  expect(response1.data.createOpenTopLevel.owner).toEqual(USERNAME1);
  expect(response1.data.createOpenTopLevel.name).toEqual('open');

  const response2 = await GRAPHQL_CLIENT_2.query(
    `mutation {
      createConnectionProtected(input: { id: "1", owner: "${USERNAME2}", name: "closed", connectionProtectedTopLevelId: "1" }) {
          id
          owner
          name
      }
  }`,
    {},
  );
  logDebug(response2);
  expect(response2.data.createConnectionProtected.id).toEqual('1');
  expect(response2.data.createConnectionProtected.owner).toEqual(USERNAME2);
  expect(response2.data.createConnectionProtected.name).toEqual('closed');

  const response3 = await GRAPHQL_CLIENT_1.query(
    `query {
      getOpenTopLevel(id: "1") {
          id
          protected {
              items {
                  id
                  name
                  owner
              }
          }
      }
  }`,
    {},
  );
  logDebug(response3);
  expect(response3.data.getOpenTopLevel.id).toEqual('1');
  expect(response3.data.getOpenTopLevel.protected.items).toHaveLength(0);

  const response4 = await GRAPHQL_CLIENT_2.query(
    `query {
      getOpenTopLevel(id: "1") {
          id
          protected {
              items {
                  id
                  name
                  owner
              }
          }
      }
  }`,
    {},
  );
  logDebug(response4);
  expect(response4.data.getOpenTopLevel.id).toEqual('1');
  expect(response4.data.getOpenTopLevel.protected.items).toHaveLength(1);
});

// Per field auth in mutations
test('Test that owners cannot set the field of a FieldProtected object unless authorized.', async () => {
  const response1 = await GRAPHQL_CLIENT_1.query(
    `mutation {
      createFieldProtected(input: { id: "2", owner: "${USERNAME1}", ownerOnly: "owner-protected" }) {
          id
          owner
          ownerOnly
      }
  }`,
    {},
  );
  logDebug(JSON.stringify(response1));
  expect(response1.data.createFieldProtected.id).toEqual('2');
  expect(response1.data.createFieldProtected.owner).toEqual(USERNAME1);
  expect(response1.data.createFieldProtected.ownerOnly).toEqual('owner-protected');

  const response2 = await GRAPHQL_CLIENT_1.query(
    `mutation {
      createFieldProtected(input: { id: "3", owner: "${USERNAME2}", ownerOnly: "owner-protected" }) {
          id
          owner
          ownerOnly
      }
  }`,
    {},
  );
  logDebug(response2);
  expect(response2.data.createFieldProtected).toBeNull();
  expect(response2.errors).toHaveLength(1);

  // The auth rule is on ownerOnly. Omitting the "ownerOnly" field will
  // not trigger the @auth check
  const response3 = await GRAPHQL_CLIENT_1.query(
    `mutation {
      createFieldProtected(input: { id: "4", owner: "${USERNAME2}" }) {
          id
          owner
          ownerOnly
      }
  }`,
    {},
  );
  logDebug(response3);
  expect(response3.data.createFieldProtected.id).toEqual('4');
  expect(response3.data.createFieldProtected.owner).toEqual(USERNAME2);
  // The length is one because the 'ownerOnly' field is protected on reads.
  // Since the caller is not the owner this will throw after the mutation succeeds
  // and return partial results.
  expect(response3.errors).toHaveLength(1);
});

test('Test authorized user can get Performance with no created stage', async () => {
  const createPerf = `mutation {
    create: createPerformance(input: {
      id: "P3"
      performer: "Perf #3"
      description: "desc"
      time: "2021-11-11T00:00:00Z"
    }) {
      id
      performer
      description
      time
      createdAt
      updatedAt
    }
  }`;

  const getPerf = `query {
    g1: getPerformance(id: "P3") {
      id
      performer
      description
      time
      stage {
        id
        name
        createdAt
        updatedAt
      }
      createdAt
      updatedAt
    }
  }
  `;

  const createStage = `mutation {
    createStage(input: {name: "stage3", id: "003"}) {
      createdAt
      id
      name
      updatedAt
    }
  }`;

  const updatePerf = `mutation {
    u1: updatePerformance(input: {id: "P3", performanceStageId: "003"}) {
      createdAt
      description
      id
      performer
      time
      updatedAt
      stage {
        id
        name
      }
    }
  }`;

  // first make a query to the record 'P3'
  const response1 = await GRAPHQL_CLIENT_1.query(getPerf, {});
  expect(response1).toBeDefined();
  expect(response1.data.g1).toBeNull();

  // create performance and expect stage to be null
  const c_response = await GRAPHQL_CLIENT_1.query(createPerf, {});
  console.log(c_response);
  const response2 = await GRAPHQL_CLIENT_1.query(getPerf, {});
  expect(response2).toBeDefined();
  expect(response2.data.g1).toBeDefined();
  expect(response2.data.g1.id).toEqual('P3');
  expect(response2.data.g1.description).toEqual('desc');
  expect(response2.data.g1.stage).toBeNull();

  //create stage and then add it to perf should show stage in perf
  await GRAPHQL_CLIENT_1.query(createStage, {});
  const response3 = await GRAPHQL_CLIENT_1.query(updatePerf, {});
  expect(response3).toBeDefined();
  expect(response3.data.u1).toBeDefined();
  expect(response3.data.u1.id).toEqual('P3');
  expect(response3.data.u1.stage).toMatchObject({
    id: '003',
    name: 'stage3',
  });
});

test('Test that owners cannot update the field of a FieldProtected object unless authorized.', async () => {
  const response1 = await GRAPHQL_CLIENT_1.query(
    `mutation {
      createFieldProtected(input: { owner: "${USERNAME1}", ownerOnly: "owner-protected" }) {
          id
          owner
          ownerOnly
      }
  }`,
    {},
  );
  logDebug(JSON.stringify(response1));
  expect(response1.data.createFieldProtected.id).not.toBeNull();
  expect(response1.data.createFieldProtected.owner).toEqual(USERNAME1);
  expect(response1.data.createFieldProtected.ownerOnly).toEqual('owner-protected');

  const response2 = await GRAPHQL_CLIENT_2.query(
    `mutation {
      updateFieldProtected(input: { id: "${response1.data.createFieldProtected.id}", ownerOnly: "owner2-protected" }) {
          id
          owner
          ownerOnly
      }
  }`,
    {},
  );
  logDebug(response2);
  expect(response2.data.updateFieldProtected).toBeNull();
  expect(response2.errors).toHaveLength(1);

  // The auth rule is on ownerOnly. Omitting the "ownerOnly" field will
  // not trigger the @auth check
  const response3 = await GRAPHQL_CLIENT_1.query(
    `mutation {
      updateFieldProtected(input: { id: "${response1.data.createFieldProtected.id}", ownerOnly: "updated" }) {
          id
          owner
          ownerOnly
      }
  }`,
    {},
  );
  logDebug(response3);
  expect(response3.data.updateFieldProtected.id).toEqual(response1.data.createFieldProtected.id);
  expect(response3.data.updateFieldProtected.owner).toEqual(USERNAME1);
  expect(response3.data.updateFieldProtected.ownerOnly).toEqual('updated');

  // This request should succeed since we are not updating the protected field.
  const response4 = await GRAPHQL_CLIENT_3.query(
    `mutation {
      updateFieldProtected(input: { id: "${response1.data.createFieldProtected.id}", owner: "${USERNAME3}" }) {
          id
          owner
          ownerOnly
      }
  }`,
    {},
  );
  logDebug(response4);
  expect(response4.data.updateFieldProtected.id).toEqual(response1.data.createFieldProtected.id);
  expect(response4.data.updateFieldProtected.owner).toEqual(USERNAME3);
  expect(response4.data.updateFieldProtected.ownerOnly).toEqual('updated');
});
