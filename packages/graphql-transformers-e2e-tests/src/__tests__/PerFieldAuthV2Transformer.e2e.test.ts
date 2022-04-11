import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { ResourceConstants } from 'graphql-transformer-common';
import { CloudFormationClient } from '../CloudFormationClient';
import { Output } from 'aws-sdk/clients/cloudformation';
import { CreateBucketRequest } from 'aws-sdk/clients/s3';
import { CognitoIdentityServiceProvider as CognitoClient, S3 } from 'aws-sdk';
import { GraphQLClient } from '../GraphQLClient';
import { S3Client } from '../S3Client';
import { cleanupStackAfterTest, deploy } from '../deployNestedStacks';
import { default as moment } from 'moment';
import * as fs from 'fs';
import {
  createUserPool,
  createUserPoolClient,
  createGroup,
  addUserToGroup,
  configureAmplify,
  signupUser,
  authenticateUser,
} from '../cognitoUtils';
import 'isomorphic-fetch';

// to deal with bug in cognito-identity-js
(global as any).fetch = require('node-fetch');

jest.setTimeout(2000000);

const AWS_REGION = 'us-west-2';

const cf = new CloudFormationClient(AWS_REGION);
const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `PerFieldAuthV2Tests-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `per-field-authv2-tests-bucket-${BUILD_TIMESTAMP}`;
const LOCAL_BUILD_ROOT = '/tmp/per_field_authv2_tests/';
const DEPLOYMENT_ROOT_KEY = 'deployments';

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
const INSTRUCTOR_GROUP_NAME = 'Instructor';

const cognitoClient = new CognitoClient({ apiVersion: '2016-04-19', region: 'us-west-2' });
const customS3Client = new S3Client('us-west-2');
const awsS3Client = new S3({ region: 'us-west-2' });

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}

beforeAll(async () => {
  // Create a stack for the post model with auth enabled.
  if (!fs.existsSync(LOCAL_BUILD_ROOT)) {
    fs.mkdirSync(LOCAL_BUILD_ROOT);
  }
  try {
    await awsS3Client.createBucket({ Bucket: BUCKET_NAME }).promise();
  } catch (e) {
    console.warn(`Could not create bucket: ${e}`);
  }
  const validSchema = `
    # Owners may update their owned records.
    # Admins may create Employee records.
    # Any authenticated user may view Employee ids & e_mails.
    # Owners and members of "Admin" group may see employee salaries.
    # Owners of "Admin" group may create and update employee salaries.
    type Employee
      @model(subscriptions: { level: public })
      @auth(
        rules: [
          { allow: groups, groups: ["Admin"], operations: [create, read, update] }
          { allow: private, operations: [read] }
          { allow: owner, ownerField: "e_mail", operations: [read, update] }
        ]
      ) {
      id: ID
      # bio and notes are the only field an owner can update
      bio: String

      # Fields with ownership conditions take precendence to the Object @auth.
      # That means that both the @auth on Object AND the @auth on the field must
      # be satisfied.

      # Owners & "Admin"s may view employee e_mail addresses. Only "Admin"s may create/update.
      # TODO: { allow: authenticated } would be useful here so that any employee could view.
      # Should also allow creation of underscore fields
      e_mail: String
        @auth(
          rules: [
            { allow: groups, groups: ["Admin"], operations: [create, update, read] }
            { allow: owner, ownerField: "e_mail", operations: [read] }
          ]
        )

      # The owner & "Admin"s may view the salary. Only "Admins" may create/update.
      salary: Int
        @auth(
          rules: [
            { allow: groups, groups: ["Admin"], operations: [create,update, read] }
            { allow: owner, ownerField: "e_mail", operations: [read] }
          ]
        )

      # The delete operation means you cannot update the value to "null" or "undefined".
      # Since delete operations are at the object level, this actually adds auth rules to the update mutation.
      notes: String
        @auth(
          rules: [
            { allow: groups, groups: ["Admin"], operations: [create, read] },
            {
              allow: owner
              ownerField: "e_mail"
              operations: [read, update, delete]
            }
          ]
        )
      }

    type Student @model
      @auth(rules: [
          {allow: owner}
          {allow: groups, groups: ["Instructor"]}
      ]){
        id: String,
        name: String,
        bio: String,
        notes: String @auth(rules: [{allow: owner}])
      }

    type Post @model
      @auth(rules: [
        { allow: groups, groups: ["Admin"] },
        { allow: owner, ownerField: "owner1", operations: [read, create] }])
      {
        id: ID
        owner1: String @auth(rules: [
          { allow: groups, groups: ["Admin"], operations: [create, read, delete] },
          { allow: owner, ownerField: "owner1", operations: [read, create] }
        ])
        text: String @auth(rules: [
          { allow: groups, groups: ["Admin"], operations: [create, read] },
          { allow: owner, ownerField: "owner1", operations : [read, update]}])
    }`;
  const transformer = new GraphQLTransform({
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    transformers: [new ModelTransformer(), new AuthTransformer()],
    featureFlags: {
      getBoolean(value: string) {
        if (value === 'useSubUsernameForDefaultIdentityClaim') {
          return false;
        }
        return false;
      },
      getString: jest.fn(),
      getNumber: jest.fn(),
      getObject: jest.fn(),
    },
  });
  const userPoolResponse = await createUserPool(cognitoClient, `UserPool${STACK_NAME}`);
  USER_POOL_ID = userPoolResponse.UserPool.Id;
  const userPoolClientResponse = await createUserPoolClient(cognitoClient, USER_POOL_ID, `UserPool${STACK_NAME}`);
  const userPoolClientId = userPoolClientResponse.UserPoolClient.ClientId;
  try {
    // Clean the bucket
    const out = transformer.transform(validSchema);

    const finishedStack = await deploy(
      customS3Client,
      cf,
      STACK_NAME,
      out,
      { AuthCognitoUserPoolId: USER_POOL_ID },
      LOCAL_BUILD_ROOT,
      BUCKET_NAME,
      DEPLOYMENT_ROOT_KEY,
      BUILD_TIMESTAMP,
    );
    expect(finishedStack).toBeDefined();
    const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
    GRAPHQL_ENDPOINT = getApiEndpoint(finishedStack.Outputs);

    // Verify we have all the details
    expect(GRAPHQL_ENDPOINT).toBeTruthy();
    expect(USER_POOL_ID).toBeTruthy();
    expect(userPoolClientId).toBeTruthy();

    // Configure Amplify, create users, and sign in.
    configureAmplify(USER_POOL_ID, userPoolClientId);

    await signupUser(USER_POOL_ID, USERNAME1, TMP_PASSWORD);
    await signupUser(USER_POOL_ID, USERNAME2, TMP_PASSWORD);
    await signupUser(USER_POOL_ID, USERNAME3, TMP_PASSWORD);
    await createGroup(USER_POOL_ID, ADMIN_GROUP_NAME);
    await createGroup(USER_POOL_ID, PARTICIPANT_GROUP_NAME);
    await createGroup(USER_POOL_ID, WATCHER_GROUP_NAME);
    await createGroup(USER_POOL_ID, DEVS_GROUP_NAME);
    await createGroup(USER_POOL_ID, INSTRUCTOR_GROUP_NAME);
    await addUserToGroup(ADMIN_GROUP_NAME, USERNAME1, USER_POOL_ID);
    await addUserToGroup(PARTICIPANT_GROUP_NAME, USERNAME1, USER_POOL_ID);
    await addUserToGroup(WATCHER_GROUP_NAME, USERNAME1, USER_POOL_ID);
    await addUserToGroup(DEVS_GROUP_NAME, USERNAME2, USER_POOL_ID);
    await addUserToGroup(INSTRUCTOR_GROUP_NAME, USERNAME1, USER_POOL_ID);
    await addUserToGroup(INSTRUCTOR_GROUP_NAME, USERNAME2, USER_POOL_ID);

    const authResAfterGroup: any = await authenticateUser(USERNAME1, TMP_PASSWORD, REAL_PASSWORD);
    const idToken = authResAfterGroup.getIdToken().getJwtToken();
    GRAPHQL_CLIENT_1 = new GraphQLClient(GRAPHQL_ENDPOINT, { Authorization: idToken });

    const authRes2AfterGroup: any = await authenticateUser(USERNAME2, TMP_PASSWORD, REAL_PASSWORD);
    const idToken2 = authRes2AfterGroup.getIdToken().getJwtToken();
    GRAPHQL_CLIENT_2 = new GraphQLClient(GRAPHQL_ENDPOINT, { Authorization: idToken2 });

    const authRes3: any = await authenticateUser(USERNAME3, TMP_PASSWORD, REAL_PASSWORD);
    const idToken3 = authRes3.getIdToken().getJwtToken();
    GRAPHQL_CLIENT_3 = new GraphQLClient(GRAPHQL_ENDPOINT, { Authorization: idToken3 });

    // Wait for any propagation to avoid random
    // "The security token included in the request is invalid" errors
    await new Promise<void>(res => setTimeout(() => res(), 5000));
  } catch (e) {
    console.error(e);
    expect(true).toEqual(false);
  }
});

afterAll(async () => {
  await cleanupStackAfterTest(BUCKET_NAME, STACK_NAME, cf, { cognitoClient, userPoolId: USER_POOL_ID });
});

/**
 * Tests
 */
test('Test that only Admins can create Employee records.', async () => {
  const createUser1 = await GRAPHQL_CLIENT_1.query(
    `mutation {
        createEmployee(input: { e_mail: "user2@test.com", salary: 100 }) {
            id
            e_mail
            salary
        }
    }`,
    {},
  );
  expect(createUser1.data.createEmployee.e_mail).toEqual('user2@test.com');
  expect(createUser1.data.createEmployee.salary).toEqual(100);

  const tryToCreateAsNonAdmin = await GRAPHQL_CLIENT_2.query(
    `mutation {
        createEmployee(input: { e_mail: "user2@test.com", salary: 101 }) {
            id
            e_mail
            salary
        }
    }`,
    {},
  );
  expect(tryToCreateAsNonAdmin.data.createEmployee).toBeNull();
  expect(tryToCreateAsNonAdmin.errors).toHaveLength(1);

  const tryToCreateAsNonAdmin2 = await GRAPHQL_CLIENT_3.query(
    `mutation {
        createEmployee(input: { e_mail: "user2@test.com", salary: 101 }) {
            id
            e_mail
            salary
        }
    }`,
    {},
  );
  expect(tryToCreateAsNonAdmin2.data.createEmployee).toBeNull();
  expect(tryToCreateAsNonAdmin2.errors).toHaveLength(1);
});

test('Test that only Admins may update salary & e_mail.', async () => {
  const createUser1 = await GRAPHQL_CLIENT_1.query(
    `mutation {
        createEmployee(input: { e_mail: "user2@test.com", salary: 100 }) {
            id
            e_mail
            salary
        }
    }`,
    {},
  );
  const employeeId = createUser1.data.createEmployee.id;
  expect(employeeId).not.toBeNull();
  expect(createUser1.data.createEmployee.e_mail).toEqual('user2@test.com');
  expect(createUser1.data.createEmployee.salary).toEqual(100);

  const tryToUpdateAsNonAdmin = await GRAPHQL_CLIENT_2.query(
    `mutation {
        updateEmployee(input: { id: "${employeeId}", salary: 101 }) {
            id
            e_mail
            salary
        }
    }`,
    {},
  );
  expect(tryToUpdateAsNonAdmin.data.updateEmployee).toBeNull();
  expect(tryToUpdateAsNonAdmin.errors).toHaveLength(1);

  const tryToUpdateAsNonAdmin2 = await GRAPHQL_CLIENT_2.query(
    `mutation {
        updateEmployee(input: { id: "${employeeId}", e_mail: "someonelese@gmail.com" }) {
            id
            e_mail
            salary
        }
    }`,
    {},
  );
  expect(tryToUpdateAsNonAdmin2.data.updateEmployee).toBeNull();
  expect(tryToUpdateAsNonAdmin2.errors).toHaveLength(1);

  const tryToUpdateAsNonAdmin3 = await GRAPHQL_CLIENT_3.query(
    `mutation {
        updateEmployee(input: { id: "${employeeId}", e_mail: "someonelese@gmail.com" }) {
            id
            e_mail
            salary
        }
    }`,
    {},
  );
  expect(tryToUpdateAsNonAdmin3.data.updateEmployee).toBeNull();
  expect(tryToUpdateAsNonAdmin3.errors).toHaveLength(1);

  const updateAsAdmin = await GRAPHQL_CLIENT_1.query(
    `mutation {
        updateEmployee(input: { id: "${employeeId}", e_mail: "someonelese@gmail.com" }) {
            id
            e_mail
            salary
        }
    }`,
    {},
  );
  expect(updateAsAdmin.data.updateEmployee.e_mail).toEqual('someonelese@gmail.com');
  expect(updateAsAdmin.data.updateEmployee.salary).toEqual(100);

  const updateAsAdmin2 = await GRAPHQL_CLIENT_1.query(
    `mutation {
        updateEmployee(input: { id: "${employeeId}", salary: 99 }) {
            id
            e_mail
            salary
        }
    }`,
    {},
  );
  expect(updateAsAdmin2.data.updateEmployee.e_mail).toEqual('someonelese@gmail.com');
  expect(updateAsAdmin2.data.updateEmployee.salary).toEqual(99);
});

test('Test that owners may update their bio.', async () => {
  const createUser1 = await GRAPHQL_CLIENT_1.query(
    `mutation {
        createEmployee(input: { e_mail: "user2@test.com", salary: 100 }) {
            id
            e_mail
            salary
        }
    }`,
    {},
  ); // 2afcb900-7fa1-4cb2-aca6-587f3e217c15
  const employeeId = createUser1.data.createEmployee.id;
  expect(employeeId).not.toBeNull();
  expect(createUser1.data.createEmployee.e_mail).toEqual('user2@test.com');
  expect(createUser1.data.createEmployee.salary).toEqual(100);

  const tryToUpdateAsNonAdmin = await GRAPHQL_CLIENT_2.query(
    `mutation {
        updateEmployee(input: { id: "${employeeId}", bio: "Does cool stuff." }) {
            id
            e_mail
            salary
            bio
        }
    }`,
    {},
  );
  expect(tryToUpdateAsNonAdmin.data.updateEmployee.bio).toEqual('Does cool stuff.');
  expect(tryToUpdateAsNonAdmin.data.updateEmployee.e_mail).toEqual('user2@test.com');
  expect(tryToUpdateAsNonAdmin.data.updateEmployee.salary).toEqual(100);
});

test('Test that everyone may view employee bios.', async () => {
  const createUser1 = await GRAPHQL_CLIENT_1.query(
    `mutation {
        createEmployee(input: { e_mail: "user3@test.com", salary: 100, bio: "Likes long walks on the beach" }) {
            id
            e_mail
            salary
            bio
        }
    }`,
    {},
  );
  const employeeId = createUser1.data.createEmployee.id;
  expect(employeeId).not.toBeNull();
  expect(createUser1.data.createEmployee.e_mail).toEqual('user3@test.com');
  expect(createUser1.data.createEmployee.salary).toEqual(100);
  expect(createUser1.data.createEmployee.bio).toEqual('Likes long walks on the beach');

  const getAsNonAdmin = await GRAPHQL_CLIENT_2.query(
    `query {
        getEmployee(id: "${employeeId}") {
            id
            e_mail
            bio
        }
    }`,
    {},
  );
  // Should not be able to view the e_mail as the non owner
  expect(getAsNonAdmin.data.getEmployee.e_mail).toBeNull();
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
    {},
  );
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
        createEmployee(input: { e_mail: "user3@test.com", salary: 200, notes: "note1" }) {
            id
            e_mail
            salary
            notes
        }
    }`,
    {},
  );
  const employeeId = createUser1.data.createEmployee.id;
  expect(employeeId).not.toBeNull();
  expect(createUser1.data.createEmployee.e_mail).toEqual('user3@test.com');
  expect(createUser1.data.createEmployee.salary).toEqual(200);
  expect(createUser1.data.createEmployee.notes).toEqual('note1');

  const tryToDeleteUserNotes = await GRAPHQL_CLIENT_2.query(
    `mutation {
        updateEmployee(input: { id: "${employeeId}", notes: null }) {
            id
            notes
        }
    }`,
    {},
  );
  expect(tryToDeleteUserNotes.data.updateEmployee).toBeNull();
  expect(tryToDeleteUserNotes.errors).toHaveLength(1);

  const updateNewsWithNotes = await GRAPHQL_CLIENT_3.query(
    `mutation {
        updateEmployee(input: { id: "${employeeId}", notes: "something else" }) {
            id
            notes
        }
    }`,
    {},
  );
  expect(updateNewsWithNotes.data.updateEmployee.notes).toEqual('something else');

  const updateAsAdmin = await GRAPHQL_CLIENT_1.query(
    `mutation {
        updateEmployee(input: { id: "${employeeId}", notes: null }) {
            id
            notes
        }
    }`,
    {},
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
    {},
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
    {},
  );
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
    {},
  );
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
    {},
  );
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
  expect(badUpdatePostResponse.errors[0].data).toBeNull();
  expect(badUpdatePostResponse.errors[0].errorType).toEqual('Unauthorized');

  const correctUpdatePostResponse = await GRAPHQL_CLIENT_1.query(`mutation UpdatePost {
        updatePost(input: {id: "${postID1}", text: "newText"}) {
          id
          owner1
          text
        }
      }`);
  expect(correctUpdatePostResponse.data.updatePost.owner1).toEqual(USERNAME1);
  expect(correctUpdatePostResponse.data.updatePost.text).toEqual('newText');
});
