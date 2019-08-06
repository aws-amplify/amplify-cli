import * as CognitoClient from 'aws-sdk/clients/cognitoidentityserviceprovider';
import ModelAuthTransformer from 'graphql-auth-transformer';
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer';
import ModelConnectionTransformer from 'graphql-connection-transformer';
import GraphQLTransform from 'graphql-transformer-core';
import * as moment from 'moment';
import {
  addUserToGroup,
  configureAmplify,
  createGroup,
  createUserPool,
  createUserPoolClient,
  deleteUserPool,
  signupAndAuthenticateUser,
} from './utils/cognito-utils';
import { GraphQLClient } from './utils/graphql-client';
import { deploy, launchDDBLocal, terminateDDB, logDebug } from './utils/index';

// to deal with bug in cognito-identity-js
(global as any).fetch = require('node-fetch');

jest.setTimeout(2000000);

const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `ConnectionsWithAuthTests-${BUILD_TIMESTAMP}`;

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

let USER_POOL_ID = undefined;

const USERNAME1 = 'user1@test.com';
const USERNAME2 = 'user2@test.com';
const USERNAME3 = 'user3@test.com';
const TMP_PASSWORD = 'Password123!';
const REAL_PASSWORD = 'Password1234!';

const ADMIN_GROUP_NAME = 'Admin';
const DEVS_GROUP_NAME = 'Devs';
const PARTICIPANT_GROUP_NAME = 'Participant';
const WATCHER_GROUP_NAME = 'Watcher';

const cognitoClient = new CognitoClient({
  apiVersion: '2016-04-19',
  region: 'us-west-2',
});
let ddbEmulator = null;
let dbPath = null;
let server;

beforeAll(async () => {
  const validSchema = `
    type Post @model @auth(rules: [{ allow: owner }]) {
        id: ID!
        title: String!
        author: User @connection(name: "UserPosts", keyField: "owner")
        owner: String
    }
    type User @model @auth(rules: [{ allow: owner }]) {
        id: ID!
        posts: [Post!]! @connection(name: "UserPosts", keyField: "owner")
    }
    type FieldProtected @model {
        id: ID!
        owner: String
        ownerOnly: String @auth(rules: [{ allow: owner }])
    }
    type OpenTopLevel @model {
        id: ID!
        name: String
        owner: String
        protected: [ConnectionProtected] @connection(name: "ProtectedConnection")
    }
    type ConnectionProtected @model(queries: null) @auth(rules: [{ allow: owner }]) {
        id: ID!
        name: String
        owner: String
        topLevel: OpenTopLevel @connection(name: "ProtectedConnection")
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new ModelConnectionTransformer(),
      new ModelAuthTransformer({ authMode: 'AMAZON_COGNITO_USER_POOLS' }),
    ],
  });
  const userPoolResponse = await createUserPool(cognitoClient, `UserPool${STACK_NAME}`);
  USER_POOL_ID = userPoolResponse.UserPool.Id;
  const userPoolClientResponse = await createUserPoolClient(
    cognitoClient,
    USER_POOL_ID,
    `UserPool${STACK_NAME}`
  );
  const userPoolClientId = userPoolClientResponse.UserPoolClient.ClientId;
  try {
    const out = transformer.transform(validSchema);

    let ddbClient;
    ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await launchDDBLocal());

    const result = await deploy(out, ddbClient);
    server = result.simulator;

    GRAPHQL_ENDPOINT = server.url + '/graphql';
    console.log(`Using graphql url: ${GRAPHQL_ENDPOINT}`);

    const apiKey = result.config.appSync.apiKey;

    // Verify we have all the details
    expect(GRAPHQL_ENDPOINT).toBeTruthy();
    expect(USER_POOL_ID).toBeTruthy();
    expect(userPoolClientId).toBeTruthy();

    // Configure Amplify, create users, and sign in.
    configureAmplify(USER_POOL_ID, userPoolClientId);

    const authRes: any = await signupAndAuthenticateUser(
      USER_POOL_ID,
      USERNAME1,
      TMP_PASSWORD,
      REAL_PASSWORD
    );
    const authRes2: any = await signupAndAuthenticateUser(
      USER_POOL_ID,
      USERNAME2,
      TMP_PASSWORD,
      REAL_PASSWORD
    );
    const authRes3: any = await signupAndAuthenticateUser(
      USER_POOL_ID,
      USERNAME3,
      TMP_PASSWORD,
      REAL_PASSWORD
    );

    await createGroup(USER_POOL_ID, ADMIN_GROUP_NAME);
    await createGroup(USER_POOL_ID, PARTICIPANT_GROUP_NAME);
    await createGroup(USER_POOL_ID, WATCHER_GROUP_NAME);
    await createGroup(USER_POOL_ID, DEVS_GROUP_NAME);
    await addUserToGroup(ADMIN_GROUP_NAME, USERNAME1, USER_POOL_ID);
    await addUserToGroup(PARTICIPANT_GROUP_NAME, USERNAME1, USER_POOL_ID);
    await addUserToGroup(WATCHER_GROUP_NAME, USERNAME1, USER_POOL_ID);
    await addUserToGroup(DEVS_GROUP_NAME, USERNAME2, USER_POOL_ID);
    const authResAfterGroup: any = await signupAndAuthenticateUser(
      USER_POOL_ID,
      USERNAME1,
      TMP_PASSWORD,
      REAL_PASSWORD
    );

    const idToken = authResAfterGroup.getIdToken().getJwtToken();
    GRAPHQL_CLIENT_1 = new GraphQLClient(GRAPHQL_ENDPOINT, {
      Authorization: idToken,
    });

    const authRes2AfterGroup: any = await signupAndAuthenticateUser(
      USER_POOL_ID,
      USERNAME2,
      TMP_PASSWORD,
      REAL_PASSWORD
    );
    const idToken2 = authRes2AfterGroup.getIdToken().getJwtToken();
    GRAPHQL_CLIENT_2 = new GraphQLClient(GRAPHQL_ENDPOINT, {
      Authorization: idToken2,
    });

    const idToken3 = authRes3.getIdToken().getJwtToken();
    GRAPHQL_CLIENT_3 = new GraphQLClient(GRAPHQL_ENDPOINT, {
      Authorization: idToken3,
    });

    // Wait for any propagation to avoid random
    // "The security token included in the request is invalid" errors
    await new Promise(res => setTimeout(() => res(), 5000));
  } catch (e) {
    console.error(e);
    throw e;
  }
});

afterAll(async () => {
  try {
    await deleteUserPool(cognitoClient, USER_POOL_ID);
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
    {}
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
    {}
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
    {}
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
    {}
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
    {}
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
    {}
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
    {}
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
    {}
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
    {}
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
    {}
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
    {}
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
    {}
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
    {}
  );
  logDebug(response3);
  expect(response3.data.createFieldProtected.id).toEqual('4');
  expect(response3.data.createFieldProtected.owner).toEqual(USERNAME2);
  // The length is one because the 'ownerOnly' field is protected on reads.
  // Since the caller is not the owner this will throw after the mutation succeeds
  // and return partial results.
  expect(response3.errors).toHaveLength(1);
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
    {}
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
    {}
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
    {}
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
    {}
  );
  logDebug(response4);
  expect(response4.data.updateFieldProtected.id).toEqual(response1.data.createFieldProtected.id);
  expect(response4.data.updateFieldProtected.owner).toEqual(USERNAME3);
  expect(response4.data.updateFieldProtected.ownerOnly).toEqual('updated');
});
