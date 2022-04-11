import { IndexTransformer, PrimaryKeyTransformer } from '@aws-amplify/graphql-index-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import {
  BelongsToTransformer,
  HasManyTransformer,
  HasOneTransformer,
  ManyToManyTransformer,
} from '@aws-amplify/graphql-relational-transformer';
import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { ResourceConstants } from 'graphql-transformer-common';
import { CloudFormationClient } from '../CloudFormationClient';
import { Output } from 'aws-sdk/clients/cloudformation';
import { GraphQLClient } from '../GraphQLClient';
import { cleanupStackAfterTest, deploy } from '../deployNestedStacks';
import { S3Client } from '../S3Client';
import { S3, CognitoIdentityServiceProvider as CognitoClient } from 'aws-sdk';
import { default as moment } from 'moment';
import {
  addUserToGroup,
  authenticateUser,
  configureAmplify,
  createGroup,
  createUserPool,
  createUserPoolClient,
  signupUser,
} from '../cognitoUtils';
// to deal with bug in cognito-identity-js
(global as any).fetch = require('node-fetch');

jest.setTimeout(2000000);

const cf = new CloudFormationClient('us-west-2');
const customS3Client = new S3Client('us-west-2');
const awsS3Client = new S3({ region: 'us-west-2' });
const cognitoClient = new CognitoClient({ apiVersion: '2016-04-19', region: 'us-west-2' });
const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `RelationalAuthV2TransformersTest-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `appsync-relational-auth-transformer-test-${BUILD_TIMESTAMP}`;
const LOCAL_FS_BUILD_DIR = '/tmp/relational_auth_transformer_tests/';
const S3_ROOT_DIR_KEY = 'deployments';

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

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}

beforeAll(async () => {
  const validSchema = `
    type Post @model @auth(rules: [{allow: owner}]) {
      id: ID!
      title: String!
      author: User @belongsTo(fields: ["owner"])
      owner: ID! @index(name: "byOwner", sortKeyFields: ["id"])
    }

    type User @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      posts: [Post] @hasMany(indexName: "byOwner", fields: ["id"])
    }

    type FieldProtected @model @auth(rules: [{ allow: private }, { allow: owner, operations: [read] }]) {
      id: ID!
      owner: String
      ownerOnly: String @auth(rules: [{allow: owner}])
    }

    type OpenTopLevel @model @auth(rules: [{allow: private}]) {
      id: ID!
      name: String
      owner: String
      protected: [ConnectionProtected] @hasMany(indexName: "byTopLevel", fields: ["id"])
    }

    type ConnectionProtected @model(queries: null) @auth(rules: [{allow: owner}]) {
      id: ID!
      name: String
      owner: String
      topLevelID: ID! @index(name: "byTopLevel", sortKeyFields: ["id"])
      topLevel: OpenTopLevel @belongsTo(fields: ["topLevelID"])
    }`;
  let out;
  try {
    const modelTransformer = new ModelTransformer();
    const indexTransformer = new IndexTransformer();
    const hasOneTransformer = new HasOneTransformer();
    const authTransformer = new AuthTransformer();
    const transformer = new GraphQLTransform({
      authConfig: {
        defaultAuthentication: {
          authenticationType: 'AMAZON_COGNITO_USER_POOLS',
        },
        additionalAuthenticationProviders: [],
      },
      transformers: [
        modelTransformer,
        new PrimaryKeyTransformer(),
        indexTransformer,
        hasOneTransformer,
        new HasManyTransformer(),
        new BelongsToTransformer(),
        new ManyToManyTransformer(modelTransformer, indexTransformer, hasOneTransformer, authTransformer),
        authTransformer,
      ],
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
      }
    });
    out = transformer.transform(validSchema);
  } catch (e) {
    console.error(`Failed to transform schema: ${e}`);
    expect(true).toEqual(false);
  }
  try {
    await awsS3Client
      .createBucket({
        Bucket: BUCKET_NAME,
      })
      .promise();
  } catch (e) {
    console.error(`Failed to create S3 bucket: ${e}`);
    expect(true).toEqual(false);
  }
  const userPoolResponse = await createUserPool(cognitoClient, `UserPool${STACK_NAME}`);
  USER_POOL_ID = userPoolResponse.UserPool.Id;
  const userPoolClientResponse = await createUserPoolClient(cognitoClient, USER_POOL_ID, `UserPool${STACK_NAME}`);
  const userPoolClientId = userPoolClientResponse.UserPoolClient.ClientId;
  try {
    const finishedStack = await deploy(
      customS3Client,
      cf,
      STACK_NAME,
      out,
      { AuthCognitoUserPoolId: USER_POOL_ID },
      LOCAL_FS_BUILD_DIR,
      BUCKET_NAME,
      S3_ROOT_DIR_KEY,
      BUILD_TIMESTAMP,
    );
    expect(finishedStack).toBeDefined();
    const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
    const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput);
    const apiKey = getApiKey(finishedStack.Outputs);
    GRAPHQL_ENDPOINT = getApiEndpoint(finishedStack.Outputs);
    expect(apiKey).not.toBeTruthy();

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
    await addUserToGroup(ADMIN_GROUP_NAME, USERNAME1, USER_POOL_ID);
    await addUserToGroup(PARTICIPANT_GROUP_NAME, USERNAME1, USER_POOL_ID);
    await addUserToGroup(WATCHER_GROUP_NAME, USERNAME1, USER_POOL_ID);
    await addUserToGroup(DEVS_GROUP_NAME, USERNAME2, USER_POOL_ID);
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
 * Test queries below
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
  expect(createUser1.data.createUser.id).toEqual('user1@test.com');

  const response = await GRAPHQL_CLIENT_1.query(
    `mutation {
        createPost(input: { title: "Hello, World!", owner: "user1@test.com" }) {
            id
            title
            owner
        }
    }`,
    {},
  );
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
  expect(response1.data.createFieldProtected.id).toEqual('1');
  expect(response1.data.createFieldProtected.owner).toEqual(USERNAME1);
  expect(response1.data.createFieldProtected.ownerOnly).toEqual(null);

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
  expect(response1.data.createOpenTopLevel.id).toEqual('1');
  expect(response1.data.createOpenTopLevel.owner).toEqual(USERNAME1);
  expect(response1.data.createOpenTopLevel.name).toEqual('open');

  const response2 = await GRAPHQL_CLIENT_2.query(
    `mutation {
        createConnectionProtected(input: { id: "1", owner: "${USERNAME2}", name: "closed", topLevelID: "1" }) {
            id
            owner
            name
            topLevelID
        }
    }`,
    {},
  );
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
  expect(response1.data.createFieldProtected.id).toEqual('2');
  expect(response1.data.createFieldProtected.owner).toEqual(USERNAME1);
  expect(response1.data.createFieldProtected.ownerOnly).toEqual(null);

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
  expect(response2.data.createFieldProtected).toBeNull();
  expect(response2.errors).toHaveLength(1);

  // The owner auth rule is on ownerOnly. Omitting the "ownerOnly" field will
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
    {},
  );
  expect(response1.data.createFieldProtected.id).not.toBeNull();
  expect(response1.data.createFieldProtected.owner).toEqual(USERNAME1);
  expect(response1.data.createFieldProtected.ownerOnly).toEqual(null);

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
  const resposne3ID = response3.data.updateFieldProtected.id;
  expect(resposne3ID).toEqual(response1.data.createFieldProtected.id);
  expect(response3.data.updateFieldProtected.owner).toEqual(USERNAME1);

  const response3query = await GRAPHQL_CLIENT_1.query(`query getMake1 {
        getFieldProtected(id: "${resposne3ID}"){
            id
            owner
            ownerOnly
        }
    }`);
  expect(response3query.data.getFieldProtected.ownerOnly).toEqual('updated');

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
  expect(response4.data.updateFieldProtected.id).toEqual(response1.data.createFieldProtected.id);
  expect(response4.data.updateFieldProtected.owner).toEqual(USERNAME3);
  expect(response4.data.updateFieldProtected.ownerOnly).toBeNull();

  const response5 = await GRAPHQL_CLIENT_3.query(
    `query {
        getFieldProtected( id: "${response1.data.createFieldProtected.id}" ) {
            id
            owner
            ownerOnly
        }
    }`,
    {},
  );
  expect(response5.data.getFieldProtected.ownerOnly).toEqual('updated');
});
