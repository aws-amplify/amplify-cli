import { ModelAuthTransformer } from 'graphql-auth-transformer';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { FeatureFlagProvider, GraphQLTransform } from 'graphql-transformer-core';
import { deploy, launchDDBLocal, terminateDDB } from './utils/index';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import { signUpAddToGroupAndGetJwtToken } from './utils/cognito-utils';
import AWS = require('aws-sdk');
import gql from 'graphql-tag';
import 'isomorphic-fetch';
import { GraphQLClient } from './utils/graphql-client';

// to deal with subscriptions in node env
(global as any).WebSocket = require('ws');

// To overcome of the way of how AmplifyJS picks up currentUserCredentials
const anyAWS = AWS as any;

if (anyAWS && anyAWS.config && anyAWS.config.credentials) {
  delete anyAWS.config.credentials;
}

// delays
const SUBSCRIPTION_DELAY = 2000;
const PROPAGATAION_DELAY = 5000;
const JEST_TIMEOUT = 20000;

jest.setTimeout(JEST_TIMEOUT);

let GRAPHQL_ENDPOINT = undefined;
let ddbEmulator = null;
let dbPath = null;
let server;
const AWS_REGION = 'my-local-2';

let APPSYNC_CLIENT_1: AWSAppSyncClient<any> = undefined;
let APPSYNC_CLIENT_2: AWSAppSyncClient<any> = undefined;

let GRAPHQL_CLIENT_1: GraphQLClient = undefined;
let GRAPHQL_CLIENT_2: GraphQLClient = undefined;

const USER_POOL_ID = 'fake_user_pool';

const USERNAME1 = 'user1@domain.com';
const USERNAME2 = 'user2@domain.com';
const USERNAME3 = 'user3@domain.com';

const INSTRUCTOR_GROUP_NAME = 'Instructor';
const ADMIN_GROUP_NAME = 'Admin';
const MEMBER_GROUP_NAME = 'Member';

/**
 * Interface Inputs
 */
interface MemberInput {
  id: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateStudentInput {
  id?: string;
  name?: string;
  email?: string;
  ssn?: string;
}

interface UpdateStudentInput {
  id: string;
  name?: string;
  email?: string;
  ssn?: string;
}

interface CreatePostInput {
  id?: string;
  title: string;
  postOwner: string;
}

interface DeleteTypeInput {
  id: string;
}

beforeAll(async () => {
  const validSchema = `
        type Student @model
            @auth(rules: [
                {allow: owner}
                {allow: groups, groups: ["Instructor"]}
        ]) {
            id: String,
            name: String,
            email: AWSEmail,
            ssn: String @auth(rules: [{allow: owner}])
        }

        type Member @model
        @auth(rules: [
          { allow: groups, groups: ["Admin"] }
          { allow: groups, groups: ["Member"], operations: [read] }
        ]) {
          id: ID
          name: String
          createdAt: AWSDateTime
          updatedAt: AWSDateTime
        }

        type Post @model
            @auth(rules: [
                {allow: owner, ownerField: "postOwner"}
            ])
        {
            id: ID!
            title: String
            postOwner: String
        }
    `;
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
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
      getBoolean: (name) => (name === 'improvePluralization' ? true : false),
    } as FeatureFlagProvider,
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
    const idToken1 = await signUpAddToGroupAndGetJwtToken(USER_POOL_ID, USERNAME1, USERNAME1, [INSTRUCTOR_GROUP_NAME, ADMIN_GROUP_NAME]);
    APPSYNC_CLIENT_1 = new AWSAppSyncClient({
      url: GRAPHQL_ENDPOINT,
      region: AWS_REGION,
      disableOffline: true,
      offlineConfig: {
        keyPrefix: 'userPools',
      },
      auth: {
        type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
        jwtToken: idToken1,
      },
    });
    GRAPHQL_CLIENT_1 = new GraphQLClient(GRAPHQL_ENDPOINT, {
      Authorization: idToken1,
    });
    const idToken2 = await signUpAddToGroupAndGetJwtToken(USER_POOL_ID, USERNAME2, USERNAME2, [INSTRUCTOR_GROUP_NAME, MEMBER_GROUP_NAME]);
    APPSYNC_CLIENT_2 = new AWSAppSyncClient({
      url: GRAPHQL_ENDPOINT,
      region: AWS_REGION,
      disableOffline: true,
      offlineConfig: {
        keyPrefix: 'userPools',
      },
      auth: {
        type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
        jwtToken: idToken2,
      },
    });
    GRAPHQL_CLIENT_2 = new GraphQLClient(GRAPHQL_ENDPOINT, {
      Authorization: idToken2,
    });
    const idToken3 = await signUpAddToGroupAndGetJwtToken(USER_POOL_ID, USERNAME3, USERNAME3, []);
    new AWSAppSyncClient({
      url: GRAPHQL_ENDPOINT,
      region: AWS_REGION,
      disableOffline: true,
      offlineConfig: {
        keyPrefix: 'userPools',
      },
      auth: {
        type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
        jwtToken: idToken3,
      },
    });
    new GraphQLClient(GRAPHQL_ENDPOINT, {
      Authorization: idToken3,
    });

    // Wait for any propagation to avoid random
    // "The security token included in the request is invalid" errors
    await new Promise((res) => setTimeout(res, PROPAGATAION_DELAY));
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
test('Test that only authorized members are allowed to view subscriptions', async () => {
  // subscribe to create students as user 2
  const observer = APPSYNC_CLIENT_2.subscribe({
    query: gql`
      subscription OnCreateStudent {
        onCreateStudent {
          id
          name
          email
          ssn
          owner
        }
      }
    `,
  });

  const subscriptionPromise = new Promise((resolve) => {
    const subscription = observer.subscribe((event: any) => {
      const student = event.data.onCreateStudent;
      subscription.unsubscribe();
      expect(student.name).toEqual('student1');
      expect(student.email).toEqual('student1@domain.com');
      expect(student.ssn).toBeNull();
      resolve(undefined);
    });
  });

  await new Promise((res) => setTimeout(res, SUBSCRIPTION_DELAY));

  await createStudent(GRAPHQL_CLIENT_1, {
    name: 'student1',
    email: 'student1@domain.com',
    ssn: 'AAA-01-SSSS',
  });

  return subscriptionPromise;
});

test('Test a subscription on update', async () => {
  // susbcribe to update students as user 2
  const subscriptionPromise = new Promise((resolve) => {
    const observer = APPSYNC_CLIENT_2.subscribe({
      query: gql`
        subscription OnUpdateStudent {
          onUpdateStudent {
            id
            name
            email
            ssn
            owner
          }
        }
      `,
    });
    const subscription = observer.subscribe((event: any) => {
      const student = event.data.onUpdateStudent;
      subscription.unsubscribe();
      expect(student.id).toEqual(student3ID);
      expect(student.name).toEqual('student3');
      expect(student.email).toEqual('emailChanged@domain.com');
      expect(student.ssn).toBeNull();
      resolve(undefined);
    });
  });
  await new Promise((res) => setTimeout(res, SUBSCRIPTION_DELAY));

  const student3 = await createStudent(GRAPHQL_CLIENT_1, {
    name: 'student3',
    email: 'changeThisEmail@domain.com',
    ssn: 'CCC-01-SNSN',
  });

  expect(student3.data.createStudent).toBeDefined();
  const student3ID = student3.data.createStudent.id;
  expect(student3.data.createStudent.name).toEqual('student3');
  expect(student3.data.createStudent.email).toEqual('changeThisEmail@domain.com');
  expect(student3.data.createStudent.ssn).toBeNull();

  await updateStudent(GRAPHQL_CLIENT_1, {
    id: student3ID,
    email: 'emailChanged@domain.com',
  });

  return subscriptionPromise;
});

test('Test a subscription on delete', async () => {
  // subscribe to onDelete as user 2
  const subscriptionPromise = new Promise((resolve) => {
    const observer = APPSYNC_CLIENT_2.subscribe({
      query: gql`
        subscription OnDeleteStudent {
          onDeleteStudent {
            id
            name
            email
            ssn
            owner
          }
        }
      `,
    });
    const subscription = observer.subscribe((event: any) => {
      const student = event.data.onDeleteStudent;
      subscription.unsubscribe();
      expect(student.id).toEqual(student4ID);
      expect(student.name).toEqual('student4');
      expect(student.email).toEqual('plsDelete@domain.com');
      expect(student.ssn).toBeNull();
      resolve(undefined);
    });
  });

  await new Promise((res) => setTimeout(res, SUBSCRIPTION_DELAY));

  const student4 = await createStudent(GRAPHQL_CLIENT_1, {
    name: 'student4',
    email: 'plsDelete@domain.com',
    ssn: 'DDD-02-SNSN',
  });
  expect(student4).toBeDefined();
  const student4ID = student4.data.createStudent.id;
  expect(student4.data.createStudent.email).toEqual('plsDelete@domain.com');
  expect(student4.data.createStudent.ssn).toBeNull();

  await deleteStudent(GRAPHQL_CLIENT_1, { id: student4ID });

  return subscriptionPromise;
});

test('test that group is only allowed to listen to subscriptions and listen to onCreate', async () => {
  const memberID = '001';
  const memberName = 'username00';
  // test that a user that only read can't mutate
  const result = await createMember(GRAPHQL_CLIENT_2, { id: '001', name: 'notUser' });
  expect(result.errors[0].message === 'Unauthorized');

  // though they should see when a new member is created
  const subscriptionPromise = new Promise((resolve) => {
    const observer = APPSYNC_CLIENT_2.subscribe({
      query: gql`
        subscription OnCreateMember {
          onCreateMember {
            id
            name
            createdAt
            updatedAt
          }
        }
      `,
    });
    const subscription = observer.subscribe((event: any) => {
      const member = event.data.onCreateMember;
      subscription.unsubscribe();
      expect(member).toBeDefined();
      expect(member.id).toEqual(memberID);
      expect(member.name).toEqual(memberName);
      resolve(undefined);
    });
  });

  await new Promise((res) => setTimeout(res, SUBSCRIPTION_DELAY));
  // user that is authorized creates the update the mutation
  await createMember(GRAPHQL_CLIENT_1, { id: memberID, name: memberName });

  return subscriptionPromise;
});

test('authorized group is allowed to listen to onUpdate', async () => {
  const memberID = '001';
  const memberName = 'newUsername';

  const subscriptionPromise = new Promise((resolve) => {
    const observer = APPSYNC_CLIENT_2.subscribe({
      query: gql`
        subscription OnUpdateMember {
          onUpdateMember {
            id
            name
            createdAt
            updatedAt
          }
        }
      `,
    });
    const subscription = observer.subscribe((event: any) => {
      const subResponse = event.data.onUpdateMember;
      subscription.unsubscribe();
      expect(subResponse).toBeDefined();
      expect(subResponse.id).toEqual(memberID);
      expect(subResponse.name).toEqual(memberName);
      resolve(undefined);
    });
  });

  await new Promise((res) => setTimeout(res, SUBSCRIPTION_DELAY));
  // user that is authorized creates the update the mutation
  await updateMember(GRAPHQL_CLIENT_1, { id: memberID, name: memberName });

  return subscriptionPromise;
});

test('authoirzed group is allowed to listen to onDelete', async () => {
  const memberID = '001';
  const memberName = 'newUsername';

  const subscriptionPromise = new Promise((resolve) => {
    const observer = APPSYNC_CLIENT_2.subscribe({
      query: gql`
        subscription OnDeleteMember {
          onDeleteMember {
            id
            name
            createdAt
            updatedAt
          }
        }
      `,
    });
    const subscription = observer.subscribe((event: any) => {
      const subResponse = event.data.onDeleteMember;
      subscription.unsubscribe();
      expect(subResponse).toBeDefined();
      expect(subResponse.id).toEqual(memberID);
      expect(subResponse.name).toEqual(memberName);
      resolve(undefined);
    });
  });

  await new Promise((res) => setTimeout(res, SUBSCRIPTION_DELAY));
  // user that is authorized creates the update the mutation
  await deleteMember(GRAPHQL_CLIENT_1, { id: memberID });

  return subscriptionPromise;
});

// ownerField Tests
test('Test subscription onCreatePost with ownerField', async () => {
  const subscriptionPromise = new Promise((resolve) => {
    const observer = APPSYNC_CLIENT_1.subscribe({
      query: gql`
      subscription OnCreatePost {
          onCreatePost(postOwner: "${USERNAME1}") {
              id
              title
              postOwner
          }
      }`,
    });
    const subscription = observer.subscribe((event: any) => {
      const post = event.data.onCreatePost;
      subscription.unsubscribe();
      expect(post.title).toEqual('someTitle');
      expect(post.postOwner).toEqual(USERNAME1);
      resolve(undefined);
    });
  });

  await new Promise((res) => setTimeout(res, SUBSCRIPTION_DELAY));

  await createPost(GRAPHQL_CLIENT_1, {
    title: 'someTitle',
    postOwner: USERNAME1,
  });

  return subscriptionPromise;
});

// mutations
async function createStudent(client: GraphQLClient, input: CreateStudentInput) {
  const request = `
    mutation CreateStudent($input: CreateStudentInput!) {
      createStudent(input: $input) {
        id
        name
        email
        ssn
        owner
      }
    }
  `;

  const result = await client.query(request, {
    input: input,
  });
  return result;
}

async function createMember(client: GraphQLClient, input: MemberInput) {
  const request = `
    mutation CreateMember($input: CreateMemberInput!) {
      createMember(input: $input) {
        id
        name
        createdAt
        updatedAt
      }
    }
  `;

  const result = await client.query(request, {
    input: input,
  });
  return result;
}

async function updateMember(client: GraphQLClient, input: MemberInput) {
  const request = `
    mutation UpdateMember($input: UpdateMemberInput!) {
      updateMember(input: $input) {
        id
        name
        createdAt
        updatedAt
      }
    }
  `;

  const result = await client.query(request, {
    input: input,
  });
  return result;
}

async function deleteMember(client: GraphQLClient, input: MemberInput) {
  const request = `
    mutation DeleteMember($input: DeleteMemberInput!) {
      deleteMember(input: $input) {
        id
        name
        createdAt
        updatedAt
      }
    }
  `;

  const result = await client.query(request, {
    input: input,
  });
  return result;
}

async function updateStudent(client: GraphQLClient, input: UpdateStudentInput) {
  const request = `
    mutation UpdateStudent($input: UpdateStudentInput!) {
      updateStudent(input: $input) {
        id
        name
        email
        ssn
        owner
      }
    }
  `;

  const result = await client.query(request, {
    input: input,
  });
  return result;
}

async function deleteStudent(client: GraphQLClient, input: DeleteTypeInput) {
  const request = `
    mutation DeleteStudent($input: DeleteStudentInput!) {
      deleteStudent(input: $input) {
        id
        name
        email
        ssn
        owner
      }
    }
  `;

  const result = await client.query(request, {
    input: input,
  });
  return result;
}

async function createPost(client: GraphQLClient, input: CreatePostInput) {
  const request = `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        id
        title
        postOwner
      }
    }
  `;

  const result = await client.query(request, {
    input: input,
  });
  return result;
}
