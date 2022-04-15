import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { CloudFormationClient } from '../CloudFormationClient';
import { ResourceConstants } from 'graphql-transformer-common';
import { Output } from 'aws-sdk/clients/cloudformation';
import { CognitoIdentityServiceProvider as CognitoClient, S3, CognitoIdentity } from 'aws-sdk';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import { AWS } from '@aws-amplify/core';
import { Auth } from 'aws-amplify';
import gql from 'graphql-tag';
import { S3Client } from '../S3Client';
import { cleanupStackAfterTest, deploy } from '../deployNestedStacks';
import { default as moment } from 'moment';
import {
  createUserPool,
  createUserPoolClient,
  createGroup,
  addUserToGroup,
  configureAmplify,
  signupUser,
  authenticateUser,
  createIdentityPool,
} from '../cognitoUtils';
import 'isomorphic-fetch';
import { API } from 'aws-amplify';
import { GRAPHQL_AUTH_MODE } from '@aws-amplify/api';
import { withTimeOut } from '../promiseWithTimeout';
import { IAMHelper } from '../IAMHelper';
import * as Observable from 'zen-observable';

// tslint:disable: no-use-before-declare
// to deal with bug in cognito-identity-js
(global as any).fetch = require('node-fetch');
// to deal with subscriptions in node env
(global as any).WebSocket = require('ws');

// To overcome of the way of how AmplifyJS picks up currentUserCredentials
const anyAWS = AWS as any;
if (anyAWS && anyAWS.config && anyAWS.config.credentials) {
  delete anyAWS.config.credentials;
}

// delay times
const SUBSCRIPTION_DELAY = 10000;
const PROPAGATION_DELAY = 5000;
const JEST_TIMEOUT = 2000000;
const SUBSCRIPTION_TIMEOUT = 10000;

jest.setTimeout(JEST_TIMEOUT);

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}

const AWS_REGION = 'us-west-2';
const cf = new CloudFormationClient(AWS_REGION);
const customS3Client = new S3Client(AWS_REGION);
const cognitoClient = new CognitoClient({ apiVersion: '2016-04-19', region: AWS_REGION });
const identityClient = new CognitoIdentity({ apiVersion: '2014-06-30', region: AWS_REGION });
const iamHelper = new IAMHelper(AWS_REGION);
const awsS3Client = new S3({ region: AWS_REGION });

// stack info
const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `SubscriptionAuthV2Tests-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `subscription-authv2-tests-bucket-${BUILD_TIMESTAMP}`;
const LOCAL_FS_BUILD_DIR = '/tmp/subscription_authv2_tests/';
const S3_ROOT_DIR_KEY = 'deployments';
const AUTH_ROLE_NAME = `${STACK_NAME}-authRole`;
const UNAUTH_ROLE_NAME = `${STACK_NAME}-unauthRole`;
let USER_POOL_ID: string;
let IDENTITY_POOL_ID: string;
let GRAPHQL_ENDPOINT: string;
let API_KEY: string;

/**
 * Client 1 is logged in and is a member of the Admin group.
 */
let GRAPHQL_CLIENT_1: AWSAppSyncClient<any> = undefined;

/**
 * Client 2 is logged in and is a member of the Devs group.
 */
let GRAPHQL_CLIENT_2: AWSAppSyncClient<any> = undefined;

/**
 * Auth IAM Client
 */
let GRAPHQL_IAM_AUTH_CLIENT: AWSAppSyncClient<any> = undefined;

const USERNAME1 = 'user1@test.com';
const USERNAME2 = 'user2@test.com';
const USERNAME3 = 'user3@test.com';
const TMP_PASSWORD = 'Password123!';
const REAL_PASSWORD = 'Password1234!';

const INSTRUCTOR_GROUP_NAME = 'Instructor';
const MEMBER_GROUP_NAME = 'Member';
const ADMIN_GROUP_NAME = 'Admin';

// interface inputs
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

interface CreateTodoInput {
  id?: string;
  name?: string;
  description?: string;
}

interface UpdateTodoInput {
  id: string;
  name?: string;
  description?: string;
}

interface DeleteTypeInput {
  id: string;
}

beforeEach(async () => {
  try {
    await Auth.signOut();
  } catch (ex) {
    // don't need to fail tests on this error
  }
});

beforeAll(async () => {
  const validSchema = `
  # Owners may update their owned records.
  # Instructors may create Student records.
  # Any authenticated user may view Student names & emails.
  # Only Owners can see the ssn

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
          { allow: owner, ownerField: "postOwner" }
          { allow: private, operations: [read], provider: iam }
      ])
  {
      id: ID!
      title: String
      postOwner: String
  }

  type Todo @model @auth(rules: [
      { allow: private, provider: iam }
      { allow: public }
    ]){
      id: ID!
      name: String @auth(rules: [
        { allow: private, provider: iam }
      ])
      description: String
  }`;
  const transformer = new GraphQLTransform({
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [
        {
          authenticationType: 'API_KEY',
          apiKeyConfig: {
            description: 'E2E Test API Key',
            apiKeyExpirationDays: 300,
          },
        },
        {
          authenticationType: 'AWS_IAM',
        },
      ],
    },
    transformers: [new ModelTransformer(), new AuthTransformer()],
    featureFlags: {
      getBoolean(value: string) {
        if (value === 'useSubUsernameForDefaultIdentityClaim') {
          return true;
        }
        return false;
      },
      getString: jest.fn(),
      getNumber: jest.fn(),
      getObject: jest.fn(),
    }
  });

  try {
    await awsS3Client.createBucket({ Bucket: BUCKET_NAME }).promise();
  } catch (e) {
    console.error(`Failed to create bucket: ${e}`);
  }

  // create userpool
  const userPoolResponse = await createUserPool(cognitoClient, `UserPool${STACK_NAME}`);
  USER_POOL_ID = userPoolResponse.UserPool.Id;
  const userPoolClientResponse = await createUserPoolClient(cognitoClient, USER_POOL_ID, `UserPool${STACK_NAME}`);
  const userPoolClientId = userPoolClientResponse.UserPoolClient.ClientId;
  // create auth and unauthroles
  const { authRole, unauthRole } = await iamHelper.createRoles(AUTH_ROLE_NAME, UNAUTH_ROLE_NAME);
  // create identitypool
  IDENTITY_POOL_ID = await createIdentityPool(identityClient, `IdentityPool${STACK_NAME}`, {
    authRoleArn: authRole.Arn,
    unauthRoleArn: unauthRole.Arn,
    providerName: `cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`,
    clientId: userPoolClientId,
  });
  const out = transformer.transform(validSchema);
  const finishedStack = await deploy(
    customS3Client,
    cf,
    STACK_NAME,
    out,
    { AuthCognitoUserPoolId: USER_POOL_ID, authRoleName: authRole.RoleName, unauthRoleName: unauthRole.RoleName },
    LOCAL_FS_BUILD_DIR,
    BUCKET_NAME,
    S3_ROOT_DIR_KEY,
    BUILD_TIMESTAMP,
  );

  expect(finishedStack).toBeDefined();
  const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
  const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput);
  GRAPHQL_ENDPOINT = getApiEndpoint(finishedStack.Outputs);

  API_KEY = getApiKey(finishedStack.Outputs);
  expect(API_KEY).toBeTruthy();

  // Verify we have all the details
  expect(GRAPHQL_ENDPOINT).toBeTruthy();
  expect(USER_POOL_ID).toBeTruthy();
  expect(userPoolClientId).toBeTruthy();

  // Configure Amplify, create users, and sign in
  configureAmplify(USER_POOL_ID, userPoolClientId, IDENTITY_POOL_ID);

  await signupUser(USER_POOL_ID, USERNAME1, TMP_PASSWORD);
  await signupUser(USER_POOL_ID, USERNAME2, TMP_PASSWORD);
  await signupUser(USER_POOL_ID, USERNAME3, TMP_PASSWORD);

  await createGroup(USER_POOL_ID, INSTRUCTOR_GROUP_NAME);
  await createGroup(USER_POOL_ID, MEMBER_GROUP_NAME);
  await createGroup(USER_POOL_ID, ADMIN_GROUP_NAME);
  await addUserToGroup(ADMIN_GROUP_NAME, USERNAME1, USER_POOL_ID);
  await addUserToGroup(MEMBER_GROUP_NAME, USERNAME2, USER_POOL_ID);
  await addUserToGroup(INSTRUCTOR_GROUP_NAME, USERNAME1, USER_POOL_ID);
  await addUserToGroup(INSTRUCTOR_GROUP_NAME, USERNAME2, USER_POOL_ID);

  // authenticate user3 we'll use amplify api for subscription calls
  await authenticateUser(USERNAME3, TMP_PASSWORD, REAL_PASSWORD);

  const authResAfterGroup: any = await authenticateUser(USERNAME1, TMP_PASSWORD, REAL_PASSWORD);
  const idToken = authResAfterGroup.getIdToken().getJwtToken();
  GRAPHQL_CLIENT_1 = new AWSAppSyncClient({
    url: GRAPHQL_ENDPOINT,
    region: AWS_REGION,
    disableOffline: true,
    auth: {
      type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
      jwtToken: idToken,
    },
  });
  const authRes2AfterGroup: any = await authenticateUser(USERNAME2, TMP_PASSWORD, REAL_PASSWORD);
  const idToken2 = authRes2AfterGroup.getIdToken().getJwtToken();
  GRAPHQL_CLIENT_2 = new AWSAppSyncClient({
    url: GRAPHQL_ENDPOINT,
    region: AWS_REGION,
    disableOffline: true,
    auth: {
      type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
      jwtToken: idToken2,
    },
  });

  await Auth.signIn(USERNAME1, REAL_PASSWORD);
  const authCreds = await Auth.currentCredentials();
  GRAPHQL_IAM_AUTH_CLIENT = new AWSAppSyncClient({
    url: GRAPHQL_ENDPOINT,
    region: AWS_REGION,
    disableOffline: true,
    auth: {
      type: AUTH_TYPE.AWS_IAM,
      credentials: authCreds,
    },
  });
  // Wait for any propagation to avoid random
  // "The security token included in the request is invalid" errors
  await new Promise(res => setTimeout(res, PROPAGATION_DELAY));
});

afterAll(async () => {
  await cleanupStackAfterTest(
    BUCKET_NAME,
    STACK_NAME,
    cf,
    { cognitoClient, userPoolId: USER_POOL_ID },
    { identityClient, identityPoolId: IDENTITY_POOL_ID },
  );
  await iamHelper.deleteRole(AUTH_ROLE_NAME);
  await iamHelper.deleteRole(UNAUTH_ROLE_NAME);
});

/**
 * Tests
 */

// tests using cognito
test('Test that only authorized members are allowed to view subscriptions', async () => {
  // subscribe to create students as user 2
  reconfigureAmplifyAPI('AMAZON_COGNITO_USER_POOLS');
  await Auth.signIn(USERNAME1, REAL_PASSWORD);
  const observer = API.graphql({
    // @ts-ignore
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
    authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
  }) as unknown as Observable<any>;
  let subscription: ZenObservable.Subscription;
  const subscriptionPromise = new Promise((resolve, _) => {
    subscription = observer.subscribe((event: any) => {
      const student = event.value.data.onCreateStudent;
      subscription.unsubscribe();
      expect(student.name).toEqual('student1');
      expect(student.email).toEqual('student1@domain.com');
      expect(student.ssn).toBeNull();
      resolve(undefined);
    });
  });

  await new Promise(res => setTimeout(res, SUBSCRIPTION_DELAY));

  await createStudent(GRAPHQL_CLIENT_1, {
    name: 'student1',
    email: 'student1@domain.com',
    ssn: 'AAA-01-SSSS',
  });

  return withTimeOut(subscriptionPromise, SUBSCRIPTION_TIMEOUT, 'OnCreateStudent Subscription timed out', () => {
    subscription?.unsubscribe();
  });
});

test('Test that an user not in the group is not allowed to view the subscription', async () => {
  // subscribe to create students as user 3
  // const observer = onCreateStudent(GRAPHQL_CLIENT_3)
  reconfigureAmplifyAPI('AMAZON_COGNITO_USER_POOLS');
  await Auth.signIn(USERNAME3, REAL_PASSWORD);
  const observer = API.graphql({
    // @ts-ignore
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
    authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
  }) as unknown as Observable<any>;
  let subscription: ZenObservable.Subscription;
  const subscriptionPromise = new Promise((resolve, _) => {
    subscription = observer.subscribe({
      error: (err: any) => {
        expect(err.error.errors[0].message).toEqual(
          'Connection failed: {"errors":[{"errorType":"Unauthorized","message":"Not Authorized to access onCreateStudent on type Student"}]}',
        );
        resolve(undefined);
      },
    });
  });

  await new Promise(res => setTimeout(res, SUBSCRIPTION_DELAY));

  await createStudent(GRAPHQL_CLIENT_1, {
    name: 'student2',
    email: 'student2@domain.com',
    ssn: 'BBB-00-SNSN',
  });

  return withTimeOut(subscriptionPromise, SUBSCRIPTION_TIMEOUT, 'Subscription timed out', () => {
    subscription?.unsubscribe();
  });
});

test('Test a subscription on update', async () => {
  // subscribe to update students as user 2
  reconfigureAmplifyAPI('AMAZON_COGNITO_USER_POOLS');
  await Auth.signIn(USERNAME2, REAL_PASSWORD);
  const observer = API.graphql({
    // @ts-ignore
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
    authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
  }) as unknown as Observable<any>;
  let subscription: ZenObservable.Subscription;
  const subscriptionPromise = new Promise((resolve, _) => {
    subscription = observer.subscribe((event: any) => {
      const student = event.value.data.onUpdateStudent;
      subscription.unsubscribe();
      expect(student.id).toEqual(student3ID);
      expect(student.name).toEqual('student3');
      expect(student.email).toEqual('emailChanged@domain.com');
      expect(student.ssn).toBeNull();
      resolve(undefined);
    });
  });
  await new Promise(res => setTimeout(res, SUBSCRIPTION_DELAY));

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

  return withTimeOut(subscriptionPromise, SUBSCRIPTION_TIMEOUT, 'OnUpdateStudent Subscription timed out', () => {
    subscription?.unsubscribe();
  });
});

test('Test a subscription on delete', async () => {
  // subscribe to onDelete as user 2
  reconfigureAmplifyAPI('AMAZON_COGNITO_USER_POOLS');
  await Auth.signIn(USERNAME2, REAL_PASSWORD);
  const observer = API.graphql({
    // @ts-ignore
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
    authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
  }) as unknown as Observable<any>;
  let subscription: ZenObservable.Subscription;
  const subscriptionPromise = new Promise((resolve, reject) => {
    subscription = observer.subscribe({
      next: event => {
        const student = event.value.data.onDeleteStudent;
        subscription.unsubscribe();
        expect(student.id).toEqual(student4ID);
        expect(student.name).toEqual('student4');
        expect(student.email).toEqual('plsDelete@domain.com');
        expect(student.ssn).toBeNull();
        resolve(undefined);
      },
      error: err => {
        reject(err);
      },
    });
  });
  const student4 = await createStudent(GRAPHQL_CLIENT_1, {
    name: 'student4',
    email: 'plsDelete@domain.com',
    ssn: 'DDD-02-SNSN',
  });
  expect(student4).toBeDefined();
  const student4ID = student4.data.createStudent.id;
  expect(student4.data.createStudent.email).toEqual('plsDelete@domain.com');
  expect(student4.data.createStudent.ssn).toBeNull();

  await new Promise(res => setTimeout(res, SUBSCRIPTION_DELAY));

  await deleteStudent(GRAPHQL_CLIENT_1, { id: student4ID });

  return withTimeOut(subscriptionPromise, SUBSCRIPTION_TIMEOUT, 'OnDeleteStudent Subscription timed out', () => {
    subscription?.unsubscribe();
  });
});

test('test that group is only allowed to listen to subscriptions and listen to onCreate', async () => {
  const memberID = '001';
  const memberName = 'username00';
  // test that a user that only read can't mutate
  reconfigureAmplifyAPI('AMAZON_COGNITO_USER_POOLS');
  await Auth.signIn(USERNAME2, REAL_PASSWORD);
  try {
    await createMember(GRAPHQL_CLIENT_2, { id: '001', name: 'notUser' });
  } catch (err) {
    expect(err).toBeDefined();
    expect(err.graphQLErrors[0].errorType).toEqual('Unauthorized');
  }

  // though they should see when a new member is created
  const observer = API.graphql({
    // @ts-ignore
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
    authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
  }) as unknown as Observable<any>;
  let subscription: ZenObservable.Subscription;
  const subscriptionPromise = new Promise((resolve, _) => {
    subscription = observer.subscribe((event: any) => {
      const member = event.value.data.onCreateMember;
      subscription.unsubscribe();
      expect(member).toBeDefined();
      expect(member.id).toEqual(memberID);
      expect(member.name).toEqual(memberName);
      resolve(undefined);
    });
  });
  await new Promise(res => setTimeout(res, SUBSCRIPTION_DELAY));
  // user that is authorized creates the update the mutation
  const createMemberResponse = await createMember(GRAPHQL_CLIENT_1, { id: memberID, name: memberName });
  expect(createMemberResponse.data.createMember.id).toEqual(memberID);
  expect(createMemberResponse.data.createMember.name).toEqual(memberName);

  return withTimeOut(subscriptionPromise, SUBSCRIPTION_TIMEOUT, 'OnCreateMember Subscription timed out', () => {
    subscription?.unsubscribe();
  });
});

test('authorized group is allowed to listen to onUpdate', async () => {
  const memberID = '001update';
  const oldMemberName = 'oldUsername';
  const newMemberName = 'newUsername';
  reconfigureAmplifyAPI('AMAZON_COGNITO_USER_POOLS');
  await Auth.signIn(USERNAME2, REAL_PASSWORD);

  const observer = API.graphql({
    // @ts-ignore
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
    authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
  }) as unknown as Observable<any>;
  let subscription: ZenObservable.Subscription;

  const subscriptionPromise = new Promise((resolve, reject) => {
    subscription = observer.subscribe({
      next: event => {
        const subResponse = event.value.data.onUpdateMember;
        subscription.unsubscribe();
        expect(subResponse).toBeDefined();
        expect(subResponse.id).toEqual(memberID);
        expect(subResponse.name).toEqual(newMemberName);
        resolve(undefined);
      },
      complete: () => {},
      error: err => {
        reject(err);
      },
    });
  });
  const createMemberResponse = await createMember(GRAPHQL_CLIENT_1, { id: memberID, name: oldMemberName });
  expect(createMemberResponse.data.createMember.id).toEqual(memberID);
  expect(createMemberResponse.data.createMember.name).toEqual(oldMemberName);
  await new Promise(res => setTimeout(res, SUBSCRIPTION_DELAY));
  // user that is authorized creates the update the mutation
  const updateMemberResponse = await updateMember(GRAPHQL_CLIENT_1, { id: memberID, name: newMemberName });
  expect(updateMemberResponse.data.updateMember.id).toEqual(memberID);
  expect(updateMemberResponse.data.updateMember.name).toEqual(newMemberName);

  return withTimeOut(subscriptionPromise, SUBSCRIPTION_TIMEOUT, 'OnUpdateMember Subscription timed out', () => {
    subscription?.unsubscribe();
  });
});

test('authorized group is allowed to listen to onDelete', async () => {
  const memberID = '001delete';
  const memberName = 'newUsername';
  reconfigureAmplifyAPI('AMAZON_COGNITO_USER_POOLS');
  await Auth.signIn(USERNAME2, REAL_PASSWORD);
  const observer = API.graphql({
    // @ts-ignore
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
    authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
  }) as unknown as Observable<any>;
  let subscription: ZenObservable.Subscription;

  const subscriptionPromise = new Promise((resolve, reject) => {
    subscription = observer.subscribe({
      next: event => {
        subscription.unsubscribe();
        const subResponse = event.value.data.onDeleteMember;
        subscription.unsubscribe();
        expect(subResponse).toBeDefined();
        expect(subResponse.id).toEqual(memberID);
        expect(subResponse.name).toEqual(memberName);
        resolve(undefined);
      },
      error: err => {
        reject(err);
      },
    });
  });

  const createMemberResponse = await createMember(GRAPHQL_CLIENT_1, { id: memberID, name: memberName });
  expect(createMemberResponse.data.createMember.id).toEqual(memberID);
  expect(createMemberResponse.data.createMember.name).toEqual(memberName);
  await new Promise(res => setTimeout(res, SUBSCRIPTION_DELAY));
  // user that is authorized creates the update the mutation
  const deleteMemberResponse = await deleteMember(GRAPHQL_CLIENT_1, { id: memberID });
  expect(deleteMemberResponse.data.deleteMember.id).toEqual(memberID);

  return withTimeOut(subscriptionPromise, SUBSCRIPTION_TIMEOUT, 'OnDeleteMember Subscription timed out', () => {
    subscription?.unsubscribe();
  });
});

// ownerField Tests
test('Test subscription onCreatePost with ownerField', async () => {
  reconfigureAmplifyAPI('AMAZON_COGNITO_USER_POOLS');
  await Auth.signIn(USERNAME1, REAL_PASSWORD);
  const observer = API.graphql({
    // @ts-ignore
    query: gql`
    subscription OnCreatePost {
        onCreatePost(postOwner: "${USERNAME1}") {
            id
            title
            postOwner
        }
    }`,
    authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
  }) as unknown as Observable<any>;
  let subscription: ZenObservable.Subscription;
  const subscriptionPromise = new Promise((resolve, _) => {
    subscription = observer.subscribe((event: any) => {
      const post = event.value.data.onCreatePost;
      subscription.unsubscribe();
      expect(post.title).toEqual('someTitle');
      expect(post.postOwner).toEqual(USERNAME1);
      resolve(undefined);
    });
  });
  await new Promise(res => setTimeout(res, SUBSCRIPTION_DELAY));

  const createPostResponse = await createPost(GRAPHQL_CLIENT_1, {
    title: 'someTitle',
    postOwner: USERNAME1,
  });
  expect(createPostResponse.data.createPost.title).toEqual('someTitle');
  expect(createPostResponse.data.createPost.postOwner).toEqual(USERNAME1);

  return withTimeOut(subscriptionPromise, SUBSCRIPTION_TIMEOUT, 'OnCreatePost Subscription timed out', () => {
    subscription?.unsubscribe();
  });
});

test('Test onCreatePost with optional argument', async () => {
  reconfigureAmplifyAPI('AMAZON_COGNITO_USER_POOLS');
  await Auth.signIn(USERNAME1, REAL_PASSWORD);
  const failedObserver = API.graphql({
    // @ts-ignore
    query: gql`
      subscription OnCreatePost {
        onCreatePost {
          id
          title
          postOwner
        }
      }
    `,
    authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
  }) as unknown as Observable<any>;
  let subscription: ZenObservable.Subscription;
  const subscriptionPromise = new Promise((resolve, _) => {
    subscription = failedObserver.subscribe(
      event => {},
      err => {
        expect(err.error.errors[0].message).toEqual(
          'Connection failed: {"errors":[{"errorType":"Unauthorized","message":"Not Authorized to access onCreatePost on type Post"}]}',
        );
        resolve(undefined);
      },
    );
  });

  return withTimeOut(subscriptionPromise, SUBSCRIPTION_TIMEOUT, 'OnCreatePost Subscription timed out', () => {
    subscription?.unsubscribe();
  });
});

// iam tests
test('Test that IAM can listen and read to onCreatePost', async () => {
  const postID = 'subscriptionID';
  const postTitle = 'titleMadeByPostOwner';

  reconfigureAmplifyAPI('AWS_IAM');
  await Auth.signIn(USERNAME1, REAL_PASSWORD);
  const observer = API.graphql({
    // @ts-ignore
    query: gql`
      subscription OnCreatePost {
        onCreatePost {
          id
          title
          postOwner
        }
      }
    `,
    authMode: GRAPHQL_AUTH_MODE.AWS_IAM,
  }) as unknown as Observable<any>;
  let subscription: ZenObservable.Subscription;

  const subscriptionPromise = new Promise((resolve, reject) => {
    subscription = observer.subscribe(
      (event: any) => {
        const post = event.value.data.onCreatePost;
        subscription.unsubscribe();
        expect(post).toBeDefined();
        expect(post.id).toEqual(postID);
        expect(post.title).toEqual(postTitle);
        expect(post.postOwner).toEqual(USERNAME1);
        resolve(undefined);
      },
      err => {
        reject(err);
      },
    );
  });
  await new Promise(res => setTimeout(res, SUBSCRIPTION_DELAY));

  const createPostResponse = await createPost(GRAPHQL_CLIENT_1, { id: postID, title: postTitle, postOwner: USERNAME1 });
  expect(createPostResponse.data.createPost.id).toEqual(postID);
  expect(createPostResponse.data.createPost.title).toEqual(postTitle);
  expect(createPostResponse.data.createPost.postOwner).toEqual(USERNAME1);
  await new Promise(res => setTimeout(res, SUBSCRIPTION_DELAY));
  await subscriptionPromise;
});

test('test that subcsription with apiKey', async () => {
  reconfigureAmplifyAPI('API_KEY', API_KEY);
  await Auth.signIn(USERNAME1, REAL_PASSWORD);
  const observer = API.graphql({
    // @ts-ignore
    query: gql`
      subscription OnCreateTodo {
        onCreateTodo {
          id
          description
          name
        }
      }
    `,
    authMode: GRAPHQL_AUTH_MODE.API_KEY,
  }) as unknown as Observable<any>;
  let subscription: ZenObservable.Subscription;

  const subscriptionPromise = new Promise((resolve, _) => {
    subscription = observer.subscribe((event: any) => {
      const post = event.value.data.onCreateTodo;
      subscription.unsubscribe();
      expect(post.description).toEqual('someDescription');
      expect(post.name).toBeNull();
      resolve(undefined);
    });
  });

  await new Promise(res => setTimeout(res, SUBSCRIPTION_DELAY));

  const createTodoResponse = await createTodo(GRAPHQL_IAM_AUTH_CLIENT, {
    description: 'someDescription',
    name: 'todo1',
  });
  expect(createTodoResponse.data.createTodo.description).toEqual('someDescription');
  expect(createTodoResponse.data.createTodo.name).toEqual(null);

  return withTimeOut(subscriptionPromise, SUBSCRIPTION_TIMEOUT, 'OnCreateTodo Subscription timed out', () => {
    subscription?.unsubscribe();
  });
});

test('test that subscription with apiKey onUpdate', async () => {
  reconfigureAmplifyAPI('API_KEY', API_KEY);
  await Auth.signIn(USERNAME1, REAL_PASSWORD);
  const observer = API.graphql({
    // @ts-ignore
    query: gql`
      subscription OnUpdateTodo {
        onUpdateTodo {
          id
          description
          name
        }
      }
    `,
    authMode: GRAPHQL_AUTH_MODE.API_KEY,
  }) as unknown as Observable<any>;
  let subscription: ZenObservable.Subscription;
  const subscriptionPromise = new Promise((resolve, reject) => {
    subscription = observer.subscribe(
      (event: any) => {
        const todo = event.value.data.onUpdateTodo;
        subscription.unsubscribe();
        expect(todo.id).toEqual(todo2ID);
        expect(todo.description).toEqual('todo2newDesc');
        expect(todo.name).toBeNull();
        resolve(undefined);
      },
      err => {
        reject(undefined);
      },
    );
  });
  await new Promise(res => setTimeout(res, SUBSCRIPTION_DELAY));

  const todo2 = await createTodo(GRAPHQL_IAM_AUTH_CLIENT, {
    description: 'updateTodoDesc',
    name: 'todo2',
  });
  expect(todo2.data.createTodo.id).toBeDefined();
  const todo2ID = todo2.data.createTodo.id;
  expect(todo2.data.createTodo.description).toEqual('updateTodoDesc');
  expect(todo2.data.createTodo.name).toBeNull();

  // update the description on todo
  const updateResponse = await updateTodo(GRAPHQL_IAM_AUTH_CLIENT, {
    id: todo2ID,
    description: 'todo2newDesc',
  });
  expect(updateResponse.data.updateTodo.id).toEqual(todo2ID);
  expect(updateResponse.data.updateTodo.description).toEqual('todo2newDesc');

  return withTimeOut(subscriptionPromise, SUBSCRIPTION_TIMEOUT, 'createTodo Subscription timed out', () => {
    subscription?.unsubscribe();
  });
});

test('test that subscription with apiKey onDelete', async () => {
  reconfigureAmplifyAPI('API_KEY', API_KEY);
  await Auth.signIn(USERNAME1, REAL_PASSWORD);
  const observer = API.graphql({
    // @ts-ignore
    query: gql`
      subscription OnDeleteTodo {
        onDeleteTodo {
          id
          description
          name
        }
      }
    `,
    authMode: GRAPHQL_AUTH_MODE.API_KEY,
  }) as unknown as Observable<any>;
  let subscription: ZenObservable.Subscription;
  const subscriptionPromise = new Promise((resolve, _) => {
    subscription = observer.subscribe((event: any) => {
      const todo = event.value.data.onDeleteTodo;
      subscription.unsubscribe();
      expect(todo.id).toEqual(todo3ID);
      expect(todo.description).toEqual('deleteTodoDesc');
      expect(todo.name).toBeNull();
      resolve(undefined);
    });
  });
  await new Promise(res => setTimeout(res, SUBSCRIPTION_DELAY));

  const todo3 = await createTodo(GRAPHQL_IAM_AUTH_CLIENT, {
    description: 'deleteTodoDesc',
    name: 'todo3',
  });
  expect(todo3.data.createTodo.id).toBeDefined();
  const todo3ID = todo3.data.createTodo.id;
  expect(todo3.data.createTodo.description).toEqual('deleteTodoDesc');
  expect(todo3.data.createTodo.name).toBeNull();

  // delete todo3
  await deleteTodo(GRAPHQL_IAM_AUTH_CLIENT, {
    id: todo3ID,
  });

  return withTimeOut(subscriptionPromise, SUBSCRIPTION_TIMEOUT, ' OnDelete Todo Subscription timed out', () => {
    subscription?.unsubscribe();
  });
});

function reconfigureAmplifyAPI(appSyncAuthType: string, apiKey?: string) {
  if (appSyncAuthType === 'API_KEY') {
    API.configure({
      aws_appsync_graphqlEndpoint: GRAPHQL_ENDPOINT,
      aws_appsync_region: AWS_REGION,
      aws_appsync_authenticationType: appSyncAuthType,
      aws_appsync_apiKey: apiKey,
    });
  } else {
    API.configure({
      aws_appsync_graphqlEndpoint: GRAPHQL_ENDPOINT,
      aws_appsync_region: AWS_REGION,
      aws_appsync_authenticationType: appSyncAuthType,
    });
  }
}

// mutations
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
  return await client.mutate<any>({ mutation: request, variables: { input } });
}

async function updateMember(client: AWSAppSyncClient<any>, input: MemberInput) {
  const request = gql`
    mutation UpdateMember($input: UpdateMemberInput!) {
      updateMember(input: $input) {
        id
        name
        createdAt
        updatedAt
      }
    }
  `;
  return await client.mutate<any>({ mutation: request, variables: { input } });
}

async function deleteMember(client: AWSAppSyncClient<any>, input: MemberInput) {
  const request = gql`
    mutation DeleteMember($input: DeleteMemberInput!) {
      deleteMember(input: $input) {
        id
        name
        createdAt
        updatedAt
      }
    }
  `;
  return await client.mutate<any>({ mutation: request, variables: { input } });
}

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
  return await client.mutate<any>({ mutation: request, variables: { input } });
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
  return await client.mutate<any>({ mutation: request, variables: { input } });
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
  return await client.mutate<any>({ mutation: request, variables: { input } });
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
  return await client.mutate<any>({ mutation: request, variables: { input } });
}

async function createTodo(client: AWSAppSyncClient<any>, input: CreateTodoInput) {
  const request = gql`
    mutation CreateTodo($input: CreateTodoInput!) {
      createTodo(input: $input) {
        id
        description
        name
      }
    }
  `;
  return await client.mutate<any>({ mutation: request, variables: { input } });
}

async function updateTodo(client: AWSAppSyncClient<any>, input: UpdateTodoInput) {
  const request = gql`
    mutation UpdateTodo($input: UpdateTodoInput!) {
      updateTodo(input: $input) {
        id
        description
        name
      }
    }
  `;
  return await client.mutate<any>({ mutation: request, variables: { input } });
}

async function deleteTodo(client: AWSAppSyncClient<any>, input: DeleteTypeInput) {
  const request = gql`
    mutation DeleteTodo($input: DeleteTodoInput!) {
      deleteTodo(input: $input) {
        id
        description
        name
      }
    }
  `;
  return await client.mutate<any>({ mutation: request, variables: { input } });
}
