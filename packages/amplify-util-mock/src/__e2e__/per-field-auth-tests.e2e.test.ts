import Amplify from 'aws-amplify';
import { ResourceConstants } from 'graphql-transformer-common';
import GraphQLTransform from 'graphql-transformer-core';
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer';
import ModelAuthTransformer from 'graphql-auth-transformer';
import ModelConnectionTransformer from 'graphql-connection-transformer';
import * as fs from 'fs';
import * as CognitoClient from 'aws-sdk/clients/cognitoidentityserviceprovider';
import * as moment from 'moment';
import { deploy, launchDDBLocal, terminateDDB, logDebug } from './utils/index';
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

// to deal with bug in cognito-identity-js
(global as any).fetch = require('node-fetch');

jest.setTimeout(2000000);

const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `PerFieldAuthTests-${BUILD_TIMESTAMP}`;

let GRAPHQL_ENDPOINT = undefined;
let ddbEmulator = null;
let dbPath = null;
let server;

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

beforeAll(async () => {
  const validSchema = `
    # Owners may update their owned records.
    # Admins may create Employee records.
    # Any authenticated user may view Employee ids & emails.
    # Owners and members of "Admin" group may see employee salaries.
    # Owners of "Admin" group may create and update employee salaries.
    type Employee @model @auth(rules: [
        { allow: owner, ownerField: "email", operations: [update] },
        { allow: groups, groups: ["Admin"], operations: [create,update,delete]}
    ]) {
        id: ID!

        # The only field that can be updated by the owner.
        bio: String

        # Fields with ownership conditions take precendence to the Object @auth.
        # That means that both the @auth on Object AND the @auth on the field must
        # be satisfied.

        # Owners & "Admin"s may view employee email addresses. Only "Admin"s may create/update.
        # TODO: { allow: authenticated } would be useful here so that any employee could view.
        email: String @auth(rules: [
            { allow: groups, groups: ["Admin"], operations: [create, update, read]}
            { allow: owner, ownerField: "email", operations: [read]}
        ])

        # The owner & "Admin"s may view the salary. Only "Admins" may create/update.
        salary: Int @auth(rules: [
            { allow: groups, groups: ["Admin"], operations: [create, update, read]}
            { allow: owner, ownerField: "email", operations: [read]}
        ])

        # The delete operation means you cannot update the value to "null" or "undefined".
        # Since delete operations are at the object level, this actually adds auth rules to the update mutation.
        notes: String @auth(rules: [{ allow: owner, ownerField: "email", operations: [delete] }])
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
    expect(true).toEqual(false);
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
test('Test that only Admins can create Employee records.', async () => {
  const createUser1 = await GRAPHQL_CLIENT_1.query(
    `mutation {
        createEmployee(input: { email: "user2@test.com", salary: 100 }) {
            id
            email
            salary
        }
    }`,
    {}
  );
  logDebug(createUser1);
  expect(createUser1.data.createEmployee.email).toEqual('user2@test.com');
  expect(createUser1.data.createEmployee.salary).toEqual(100);

  const tryToCreateAsNonAdmin = await GRAPHQL_CLIENT_2.query(
    `mutation {
        createEmployee(input: { email: "user2@test.com", salary: 101 }) {
            id
            email
            salary
        }
    }`,
    {}
  );
  logDebug(tryToCreateAsNonAdmin);
  expect(tryToCreateAsNonAdmin.data.createEmployee).toBeNull();
  expect(tryToCreateAsNonAdmin.errors).toHaveLength(1);

  const tryToCreateAsNonAdmin2 = await GRAPHQL_CLIENT_3.query(
    `mutation {
        createEmployee(input: { email: "user2@test.com", salary: 101 }) {
            id
            email
            salary
        }
    }`,
    {}
  );
  logDebug(tryToCreateAsNonAdmin2);
  expect(tryToCreateAsNonAdmin2.data.createEmployee).toBeNull();
  expect(tryToCreateAsNonAdmin2.errors).toHaveLength(1);
});

test('Test that only Admins may update salary & email.', async () => {
  const createUser1 = await GRAPHQL_CLIENT_1.query(
    `mutation {
        createEmployee(input: { email: "user2@test.com", salary: 100 }) {
            id
            email
            salary
        }
    }`,
    {}
  );
  logDebug(createUser1);
  const employeeId = createUser1.data.createEmployee.id;
  expect(employeeId).not.toBeNull();
  expect(createUser1.data.createEmployee.email).toEqual('user2@test.com');
  expect(createUser1.data.createEmployee.salary).toEqual(100);

  const tryToUpdateAsNonAdmin = await GRAPHQL_CLIENT_2.query(
    `mutation {
        updateEmployee(input: { id: "${employeeId}", salary: 101 }) {
            id
            email
            salary
        }
    }`,
    {}
  );
  logDebug(tryToUpdateAsNonAdmin);
  expect(tryToUpdateAsNonAdmin.data.updateEmployee).toBeNull();
  expect(tryToUpdateAsNonAdmin.errors).toHaveLength(1);

  const tryToUpdateAsNonAdmin2 = await GRAPHQL_CLIENT_2.query(
    `mutation {
        updateEmployee(input: { id: "${employeeId}", email: "someonelese@gmail.com" }) {
            id
            email
            salary
        }
    }`,
    {}
  );
  logDebug(tryToUpdateAsNonAdmin2);
  expect(tryToUpdateAsNonAdmin2.data.updateEmployee).toBeNull();
  expect(tryToUpdateAsNonAdmin2.errors).toHaveLength(1);

  const tryToUpdateAsNonAdmin3 = await GRAPHQL_CLIENT_3.query(
    `mutation {
        updateEmployee(input: { id: "${employeeId}", email: "someonelese@gmail.com" }) {
            id
            email
            salary
        }
    }`,
    {}
  );
  logDebug(tryToUpdateAsNonAdmin3);
  expect(tryToUpdateAsNonAdmin3.data.updateEmployee).toBeNull();
  expect(tryToUpdateAsNonAdmin3.errors).toHaveLength(1);

  const updateAsAdmin = await GRAPHQL_CLIENT_1.query(
    `mutation {
        updateEmployee(input: { id: "${employeeId}", email: "someonelese@gmail.com" }) {
            id
            email
            salary
        }
    }`,
    {}
  );
  logDebug(updateAsAdmin);
  expect(updateAsAdmin.data.updateEmployee.email).toEqual('someonelese@gmail.com');
  expect(updateAsAdmin.data.updateEmployee.salary).toEqual(100);

  const updateAsAdmin2 = await GRAPHQL_CLIENT_1.query(
    `mutation {
        updateEmployee(input: { id: "${employeeId}", salary: 99 }) {
            id
            email
            salary
        }
    }`,
    {}
  );
  logDebug(updateAsAdmin2);
  expect(updateAsAdmin2.data.updateEmployee.email).toEqual('someonelese@gmail.com');
  expect(updateAsAdmin2.data.updateEmployee.salary).toEqual(99);
});

test('Test that owners may update their bio.', async () => {
  const createUser1 = await GRAPHQL_CLIENT_1.query(
    `mutation {
        createEmployee(input: { email: "user2@test.com", salary: 100 }) {
            id
            email
            salary
        }
    }`,
    {}
  );
  logDebug(createUser1);
  const employeeId = createUser1.data.createEmployee.id;
  expect(employeeId).not.toBeNull();
  expect(createUser1.data.createEmployee.email).toEqual('user2@test.com');
  expect(createUser1.data.createEmployee.salary).toEqual(100);

  const tryToUpdateAsNonAdmin = await GRAPHQL_CLIENT_2.query(
    `mutation {
        updateEmployee(input: { id: "${employeeId}", bio: "Does cool stuff." }) {
            id
            email
            salary
            bio
        }
    }`,
    {}
  );
  logDebug(tryToUpdateAsNonAdmin);
  expect(tryToUpdateAsNonAdmin.data.updateEmployee.bio).toEqual('Does cool stuff.');
  expect(tryToUpdateAsNonAdmin.data.updateEmployee.email).toEqual('user2@test.com');
  expect(tryToUpdateAsNonAdmin.data.updateEmployee.salary).toEqual(100);
});

test('Test that everyone may view employee bios.', async () => {
  const createUser1 = await GRAPHQL_CLIENT_1.query(
    `mutation {
        createEmployee(input: { email: "user3@test.com", salary: 100, bio: "Likes long walks on the beach" }) {
            id
            email
            salary
            bio
        }
    }`,
    {}
  );
  logDebug(createUser1);
  const employeeId = createUser1.data.createEmployee.id;
  expect(employeeId).not.toBeNull();
  expect(createUser1.data.createEmployee.email).toEqual('user3@test.com');
  expect(createUser1.data.createEmployee.salary).toEqual(100);
  expect(createUser1.data.createEmployee.bio).toEqual('Likes long walks on the beach');

  const getAsNonAdmin = await GRAPHQL_CLIENT_2.query(
    `query {
        getEmployee(id: "${employeeId}") {
            id
            email
            bio
        }
    }`,
    {}
  );
  logDebug(getAsNonAdmin);
  // Should not be able to view the email as the non owner
  expect(getAsNonAdmin.data.getEmployee.email).toBeNull();
  // Should be able to view the bio.
  expect(getAsNonAdmin.data.getEmployee.bio).toEqual('Likes long walks on the beach');
  expect(getAsNonAdmin.errors).toHaveLength(1);

  const listAsNonAdmin = await GRAPHQL_CLIENT_2.query(
    `query {
        listEmployees {
            items {
                id
                bio
            }
        }
    }`,
    {}
  );
  logDebug(listAsNonAdmin);
  expect(listAsNonAdmin.data.listEmployees.items.length).toBeGreaterThan(1);
  let seenId = false;
  for (const item of listAsNonAdmin.data.listEmployees.items) {
    if (item.id === employeeId) {
      seenId = true;
      expect(item.bio).toEqual('Likes long walks on the beach');
    }
  }
  expect(seenId).toEqual(true);
});

test('Test that only owners may "delete" i.e. update the field to null.', async () => {
  const createUser1 = await GRAPHQL_CLIENT_1.query(
    `mutation {
        createEmployee(input: { email: "user3@test.com", salary: 200, notes: "note1" }) {
            id
            email
            salary
            notes
        }
    }`,
    {}
  );
  logDebug(createUser1);
  const employeeId = createUser1.data.createEmployee.id;
  expect(employeeId).not.toBeNull();
  expect(createUser1.data.createEmployee.email).toEqual('user3@test.com');
  expect(createUser1.data.createEmployee.salary).toEqual(200);
  expect(createUser1.data.createEmployee.notes).toEqual('note1');

  const tryToDeleteUserNotes = await GRAPHQL_CLIENT_2.query(
    `mutation {
        updateEmployee(input: { id: "${employeeId}", notes: null }) {
            id
            notes
        }
    }`,
    {}
  );
  logDebug(tryToDeleteUserNotes);
  expect(tryToDeleteUserNotes.data.updateEmployee).toBeNull();
  expect(tryToDeleteUserNotes.errors).toHaveLength(1);

  const updateNewsWithNotes = await GRAPHQL_CLIENT_3.query(
    `mutation {
        updateEmployee(input: { id: "${employeeId}", notes: "something else" }) {
            id
            notes
        }
    }`,
    {}
  );
  expect(updateNewsWithNotes.data.updateEmployee.notes).toEqual('something else');

  const updateAsAdmin = await GRAPHQL_CLIENT_1.query(
    `mutation {
        updateEmployee(input: { id: "${employeeId}", notes: null }) {
            id
            notes
        }
    }`,
    {}
  );
  expect(updateAsAdmin.data.updateEmployee).toBeNull();
  expect(updateAsAdmin.errors).toHaveLength(1);

  const deleteNotes = await GRAPHQL_CLIENT_3.query(
    `mutation {
        updateEmployee(input: { id: "${employeeId}", notes: null }) {
            id
            notes
        }
    }`,
    {}
  );
  expect(deleteNotes.data.updateEmployee.notes).toBeNull();
});
