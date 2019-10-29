import { ModelAuthTransformer } from 'graphql-auth-transformer';
import { ModelConnectionTransformer } from 'graphql-connection-transformer';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { GraphQLTransform } from 'graphql-transformer-core';
import { GraphQLClient } from './utils/graphql-client';
import { deploy, launchDDBLocal, logDebug, terminateDDB } from './utils/index';
import { signUpAddToGroupAndGetJwtToken } from './utils/cognito-utils';

// to deal with bug in cognito-identity-js
(global as any).fetch = require('node-fetch');

jest.setTimeout(2000000);

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

const USER_POOL_ID = 'fake_user_pool';

const USERNAME1 = 'user1@test.com';
const USERNAME2 = 'user2@test.com';
const USERNAME3 = 'user3@test.com';

const ADMIN_GROUP_NAME = 'Admin';
const DEVS_GROUP_NAME = 'Devs';
const PARTICIPANT_GROUP_NAME = 'Participant';
const WATCHER_GROUP_NAME = 'Watcher';
const INSTRUCTOR_GROUP_NAME = 'Instructor';

beforeAll(async () => {
  const validSchema = `# Owners may update their owned records.
  # Admins may create Employee records.
  # Any authenticated user may view Employee ids & emails.
  # Owners and members of "Admin" group may see employee salaries.
  # Owners of "Admin" group may create and update employee salaries.
  type Employee @model (
      subscriptions: {
          level: public
      }
  ) @auth(rules: [
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

  type Student @model
  @auth(rules: [
      {allow: owner}
      {allow: groups, groups: ["Instructor"]}
  ]) {
      id: String,
      name: String,
      bio: String,
      notes: String @auth(rules: [{allow: owner}])
  }

  type Post @model
      @auth(rules: [{ allow: groups, groups: ["Admin"] },
                    { allow: owner, ownerField: "owner1", operations: [read, create] }])
  {
      id: ID!
      owner1: String! @auth(rules: [{allow: owner, ownerField: "notAllowed", operations: [update]}])
      text: String @auth(rules: [{ allow: owner, ownerField: "owner1", operations : [update]}])
  }
  # add auth on a field
  type Query {
    someFunction: String @auth(rules: [{ allow: groups, groups: ["Admin"] }])
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
  });

  try {
    const out = transformer.transform(validSchema);

    let ddbClient;
    ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await launchDDBLocal());

    const result = await deploy(out, ddbClient);
    server = result.simulator;

    GRAPHQL_ENDPOINT = server.url + '/graphql';
    // Verify we have all the details
    expect(GRAPHQL_ENDPOINT).toBeTruthy();
    // Configure Amplify, create users, and sign in.

    const idToken = signUpAddToGroupAndGetJwtToken(USER_POOL_ID, USERNAME1, USERNAME1, [
      ADMIN_GROUP_NAME,
      PARTICIPANT_GROUP_NAME,
      WATCHER_GROUP_NAME,
      INSTRUCTOR_GROUP_NAME,
    ]);
    GRAPHQL_CLIENT_1 = new GraphQLClient(GRAPHQL_ENDPOINT, {
      Authorization: idToken,
    });

    const idToken2 = signUpAddToGroupAndGetJwtToken(USER_POOL_ID, USERNAME2, USERNAME2, [DEVS_GROUP_NAME, INSTRUCTOR_GROUP_NAME]);
    GRAPHQL_CLIENT_2 = new GraphQLClient(GRAPHQL_ENDPOINT, {
      Authorization: idToken2,
    });

    const idToken3 = signUpAddToGroupAndGetJwtToken(USER_POOL_ID, USERNAME3, USERNAME3, []);
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

test('Test with auth with subscriptions on default behavior', async () => {
  /**
   * client 1 and 2 are in the same user pool though client 1 should
   * not be able to see notes if they are created by client 2
   * */
  const secureNote1 = 'secureNote1';
  const createStudent2 = await GRAPHQL_CLIENT_2.query(
    `mutation {
      createStudent(input: {bio: "bio1", name: "student1", notes: "${secureNote1}"}) {
          id
          bio
          name
          notes
          owner
      }
  }`,
    {}
  );
  logDebug(createStudent2);
  expect(createStudent2.data.createStudent.id).toBeDefined();
  const createStudent1queryID = createStudent2.data.createStudent.id;
  expect(createStudent2.data.createStudent.bio).toEqual('bio1');
  expect(createStudent2.data.createStudent.notes).toBeNull();
  // running query as username2 should return value
  const queryForStudent2 = await GRAPHQL_CLIENT_2.query(
    `query {
      getStudent(id: "${createStudent1queryID}") {
          bio
          id
          name
          notes
          owner
      }
  }`,
    {}
  );
  logDebug(queryForStudent2);
  expect(queryForStudent2.data.getStudent.notes).toEqual(secureNote1);

  // running query as username3 should return the type though return notes as null
  const queryAsStudent1 = await GRAPHQL_CLIENT_1.query(
    `query {
      getStudent(id: "${createStudent1queryID}") {
          bio
          id
          name
          notes
          owner
      }
  }`,
    {}
  );
  console.log(JSON.stringify(queryAsStudent1));
  expect(queryAsStudent1.data.getStudent.notes).toBeNull();
});

test('AND per-field dynamic auth rule test', async () => {
  const createPostResponse = await GRAPHQL_CLIENT_1.query(`mutation CreatePost {
      createPost(input: {owner1: "${USERNAME1}", text: "mytext"}) {
        id
        text
        owner1
      }
    }`);
  logDebug(createPostResponse);
  const postID1 = createPostResponse.data.createPost.id;
  expect(postID1).toBeDefined();
  expect(createPostResponse.data.createPost.text).toEqual('mytext');
  expect(createPostResponse.data.createPost.owner1).toEqual(USERNAME1);

  const badUpdatePostResponse = await GRAPHQL_CLIENT_1.query(`mutation UpdatePost {
      updatePost(input: {id: "${postID1}", text: "newText", owner1: "${USERNAME1}"}) {
        id
        owner1
        text
      }
    }
    `);
  logDebug(badUpdatePostResponse);
  expect(badUpdatePostResponse.errors[0].errorType).toEqual('DynamoDB:ConditionalCheckFailedException');

  const correctUpdatePostResponse = await GRAPHQL_CLIENT_1.query(`mutation UpdatePost {
      updatePost(input: {id: "${postID1}", text: "newText"}) {
        id
        owner1
        text
      }
    }`);
  logDebug(correctUpdatePostResponse);
  expect(correctUpdatePostResponse.data.updatePost.owner1).toEqual(USERNAME1);
  expect(correctUpdatePostResponse.data.updatePost.text).toEqual('newText');
});

test('test field auth on an operation type as user in admin group', async () => {
  const queryResponse = await GRAPHQL_CLIENT_1.query(`
    query SomeFunction {
      someFunction
    }
  `);
  // no errors though it should return null
  logDebug(queryResponse);
  expect(queryResponse.data.someFunction).toBeNull();
});

test('test field auth on an operation type as user not in admin group', async () => {
  const queryResponse = await GRAPHQL_CLIENT_3.query(`
    query SomeFunction {
      someFunction
    }
  `);
  // should return an error
  logDebug(queryResponse);
  expect(queryResponse.errors).toBeDefined();
  expect(queryResponse.errors[0].message).toEqual('Unauthorized');
});
