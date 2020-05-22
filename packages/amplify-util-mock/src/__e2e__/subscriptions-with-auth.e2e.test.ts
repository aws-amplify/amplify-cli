import { ModelAuthTransformer } from 'graphql-auth-transformer';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { GraphQLTransform } from 'graphql-transformer-core';
import { deploy, launchDDBLocal, terminateDDB } from './utils/index';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import { signUpAddToGroupAndGetJwtToken } from './utils/cognito-utils';
import AWS = require('aws-sdk');
import gql from 'graphql-tag';
import 'isomorphic-fetch';

// To overcome of the way of how AmplifyJS picks up currentUserCredentials
const anyAWS = AWS as any;

if (anyAWS && anyAWS.config && anyAWS.config.credentials) {
  delete anyAWS.config.credentials;
}

// to deal with bug in cognito-identity-js
(global as any).fetch = require('node-fetch');
// to deal with subscriptions in node env
(global as any).WebSocket = require('ws');

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

let GRAPHQL_CLIENT_1: AWSAppSyncClient<any> = undefined;

let GRAPHQL_CLIENT_2: AWSAppSyncClient<any> = undefined;

let GRAPHQL_CLIENT_3: AWSAppSyncClient<any> = undefined;

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
    const idToken1 = signUpAddToGroupAndGetJwtToken(USER_POOL_ID, USERNAME1, USERNAME1, [INSTRUCTOR_GROUP_NAME, ADMIN_GROUP_NAME]);
    GRAPHQL_CLIENT_1 = new AWSAppSyncClient({
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
    const idToken2 = signUpAddToGroupAndGetJwtToken(USER_POOL_ID, USERNAME2, USERNAME2, [INSTRUCTOR_GROUP_NAME, MEMBER_GROUP_NAME]);
    GRAPHQL_CLIENT_2 = new AWSAppSyncClient({
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
    const idToken3 = signUpAddToGroupAndGetJwtToken(USER_POOL_ID, USERNAME3, USERNAME3, []);
    GRAPHQL_CLIENT_3 = new AWSAppSyncClient({
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

    // Wait for any propagation to avoid random
    // "The security token included in the request is invalid" errors
    await new Promise(res => setTimeout(() => res(), PROPAGATAION_DELAY));
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
test('Test that only authorized members are allowed to view subscriptions', async done => {
  // subscribe to create students as user 2
  const observer = GRAPHQL_CLIENT_2.subscribe({
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
  console.log(observer);
  let subscription = observer.subscribe((event: any) => {
    console.log('subscription event: ', event);
    const student = event.data.onCreateStudent;
    subscription.unsubscribe();
    expect(student.name).toEqual('student1');
    expect(student.email).toEqual('student1@domain.com');
    expect(student.ssn).toBeNull();
    done();
  });

  await new Promise(res => setTimeout(() => res(), SUBSCRIPTION_DELAY));

  createStudent(GRAPHQL_CLIENT_1, {
    name: 'student1',
    email: 'student1@domain.com',
    ssn: 'AAA-01-SSSS',
  });
});

test('Test that a user not in the group is not allowed to view the subscription', async done => {
  // suscribe to create students as user 3
  const observer = GRAPHQL_CLIENT_3.subscribe({
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
  observer.subscribe({
    error: (err: any) => {
      console.log(err.graphQLErrors[0]);
      expect(err.graphQLErrors[0].message).toEqual('Unauthorized');
      done();
    },
  });
  await new Promise(res => setTimeout(() => res(), SUBSCRIPTION_DELAY));

  createStudent(GRAPHQL_CLIENT_1, {
    name: 'student2',
    email: 'student2@domain.com',
    ssn: 'BBB-00-SNSN',
  });
});

test('Test a subscription on update', async done => {
  // susbcribe to update students as user 2
  const observer = GRAPHQL_CLIENT_2.subscribe({
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
  let subscription = observer.subscribe((event: any) => {
    const student = event.data.onUpdateStudent;
    subscription.unsubscribe();
    expect(student.id).toEqual(student3ID);
    expect(student.name).toEqual('student3');
    expect(student.email).toEqual('emailChanged@domain.com');
    expect(student.ssn).toBeNull();
    done();
  });

  await new Promise(res => setTimeout(() => res(), SUBSCRIPTION_DELAY));

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

  updateStudent(GRAPHQL_CLIENT_1, {
    id: student3ID,
    email: 'emailChanged@domain.com',
  });
});

test('Test a subscription on delete', async done => {
  // subscribe to onDelete as user 2
  const observer = GRAPHQL_CLIENT_2.subscribe({
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
  let subscription = observer.subscribe((event: any) => {
    const student = event.data.onDeleteStudent;
    subscription.unsubscribe();
    expect(student.id).toEqual(student4ID);
    expect(student.name).toEqual('student4');
    expect(student.email).toEqual('plsDelete@domain.com');
    expect(student.ssn).toBeNull();
    done();
  });

  await new Promise(res => setTimeout(() => res(), SUBSCRIPTION_DELAY));

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
});

test('test that group is only allowed to listen to subscriptions and listen to onCreate', async done => {
  const memberID = '001';
  const memberName = 'username00';
  // test that a user that only read can't mutate
  try {
    await createMember(GRAPHQL_CLIENT_2, { id: '001', name: 'notUser' });
  } catch (err) {
    expect(err).toBeDefined();
    expect(err.graphQLErrors[0].errorType).toEqual('Unauthorized');
  }

  // though they should see when a new member is created
  const observer = GRAPHQL_CLIENT_2.subscribe({
    query: gql`
      subscription OnCreateMember {
        onCreateMember {
          id
          name
          createdAt
          updatedAt
        }
      }
    `});
  const subscription = observer.subscribe((event: any) => {
    const member = event.data.onCreateMember;
    subscription.unsubscribe();
    expect(member).toBeDefined();
    expect(member.id).toEqual(memberID);
    expect(member.name).toEqual(memberName);
    done();
  });
  await new Promise(res => setTimeout(() => res(), SUBSCRIPTION_DELAY));
  // user that is authorized creates the update the mutation
  createMember(GRAPHQL_CLIENT_1, { id: memberID, name: memberName });
});

test('authorized group is allowed to listen to onUpdate', async done => {
  const memberID = '001'
  const memberName = 'newUsername';
  const observer = GRAPHQL_CLIENT_2.subscribe({
    query: gql`
    subscription OnUpdateMember {
      onUpdateMember {
        id
        name
        createdAt
        updatedAt
      }
    }`});
    const subscription = observer.subscribe( (event: any) => {
      const subResponse = event.data.onUpdateMember;
      subscription.unsubscribe();
      expect(subResponse).toBeDefined();
      expect(subResponse.id).toEqual(memberID);
      expect(subResponse.name).toEqual(memberName);
      done();
    });
    await new Promise(res => setTimeout(() => res(), SUBSCRIPTION_DELAY));
    // user that is authorized creates the update the mutation
    updateMember(GRAPHQL_CLIENT_1, { id: memberID, name: memberName });
});

test('authoirzed group is allowed to listen to onDelete', async done => {
  const memberID = '001';
  const memberName = 'newUsername';
  const observer = GRAPHQL_CLIENT_2.subscribe({
    query: gql`
    subscription OnDeleteMember {
      onDeleteMember {
        id
        name
        createdAt
        updatedAt
      }
    }`});
  const subscription = observer.subscribe( (event: any) => {
    const subResponse = event.data.onDeleteMember;
    subscription.unsubscribe();
    expect(subResponse).toBeDefined();
    expect(subResponse.id).toEqual(memberID);
    expect(subResponse.name).toEqual(memberName);
    done();
  });
  await new Promise(res => setTimeout(() => res(), SUBSCRIPTION_DELAY));
  // user that is authorized creates the update the mutation
  deleteMember(GRAPHQL_CLIENT_1, { id: memberID });
});

// ownerField Tests
test('Test subscription onCreatePost with ownerField', async done => {
  const observer = GRAPHQL_CLIENT_1.subscribe({
    query: gql`
    subscription OnCreatePost {
        onCreatePost(postOwner: "${USERNAME1}") {
            id
            title
            postOwner
        }
    }`,
  });
  let subscription = observer.subscribe((event: any) => {
    const post = event.data.onCreatePost;
    subscription.unsubscribe();
    expect(post.title).toEqual('someTitle');
    expect(post.postOwner).toEqual(USERNAME1);
    done();
  });
  await new Promise(res => setTimeout(() => res(), SUBSCRIPTION_DELAY));

  createPost(GRAPHQL_CLIENT_1, {
    title: 'someTitle',
    postOwner: USERNAME1,
  });
});

// mutations
async function createStudent(client: AWSAppSyncClient<any>, input: CreateStudentInput) {
  const request = gql`
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
  return await client.mutate({ mutation: request, variables: { input } });
}

async function createMember(client: AWSAppSyncClient<any>, input: MemberInput) {
  const request = gql`
    mutation CreateMember($input: CreateMemberInput!) {
      createMember(input: $input) {
        id
        name
        createdAt
        updatedAt
      }
    }
  `;
  return await client.mutate({ mutation: request, variables: { input } });
}

async function updateMember(client: AWSAppSyncClient<any>, input: MemberInput) {
  const request = gql`
    mutation UpdateMember(
      $input: UpdateMemberInput! ) {
      updateMember(input: $input) {
        id
        name
        createdAt
        updatedAt
      }
    }`;
  return await client.mutate({ mutation: request, variables: { input }});
}

async function deleteMember(client: AWSAppSyncClient<any>, input: MemberInput) {
  const request = gql`
  mutation DeleteMember(
    $input: DeleteMemberInput! ) {
    deleteMember(input: $input) {
      id
      name
      createdAt
      updatedAt
    }
  }`;
  return await client.mutate({ mutation: request, variables: { input }})
}

async function updateStudent(client: AWSAppSyncClient<any>, input: UpdateStudentInput) {
  const request = gql`
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
  return await client.mutate({ mutation: request, variables: { input } });
}

async function deleteStudent(client: AWSAppSyncClient<any>, input: DeleteTypeInput) {
  const request = gql`
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
  return await client.mutate({ mutation: request, variables: { input } });
}

async function createPost(client: AWSAppSyncClient<any>, input: CreatePostInput) {
  const request = gql`
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        id
        title
        postOwner
      }
    }
  `;
  return await client.mutate({ mutation: request, variables: { input } });
}
