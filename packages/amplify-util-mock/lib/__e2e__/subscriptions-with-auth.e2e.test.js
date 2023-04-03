"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_auth_transformer_1 = require("graphql-auth-transformer");
const graphql_dynamodb_transformer_1 = require("graphql-dynamodb-transformer");
const graphql_transformer_core_1 = require("graphql-transformer-core");
const index_1 = require("./utils/index");
const aws_appsync_1 = __importStar(require("aws-appsync"));
const cognito_utils_1 = require("./utils/cognito-utils");
const AWS = require("aws-sdk");
const graphql_tag_1 = __importDefault(require("graphql-tag"));
require("isomorphic-fetch");
const graphql_client_1 = require("./utils/graphql-client");
global.WebSocket = require('ws');
const anyAWS = AWS;
if (anyAWS && anyAWS.config && anyAWS.config.credentials) {
    delete anyAWS.config.credentials;
}
const SUBSCRIPTION_DELAY = 2000;
const PROPAGATAION_DELAY = 5000;
const JEST_TIMEOUT = 20000;
jest.setTimeout(JEST_TIMEOUT);
let GRAPHQL_ENDPOINT = undefined;
let ddbEmulator = null;
let dbPath = null;
let server;
const AWS_REGION = 'my-local-2';
let APPSYNC_CLIENT_1 = undefined;
let APPSYNC_CLIENT_2 = undefined;
let APPSYNC_CLIENT_3 = undefined;
let GRAPHQL_CLIENT_1 = undefined;
let GRAPHQL_CLIENT_2 = undefined;
let GRAPHQL_CLIENT_3 = undefined;
const USER_POOL_ID = 'fake_user_pool';
const USERNAME1 = 'user1@domain.com';
const USERNAME2 = 'user2@domain.com';
const USERNAME3 = 'user3@domain.com';
const INSTRUCTOR_GROUP_NAME = 'Instructor';
const ADMIN_GROUP_NAME = 'Admin';
const MEMBER_GROUP_NAME = 'Member';
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
    const transformer = new graphql_transformer_core_1.GraphQLTransform({
        transformers: [
            new graphql_dynamodb_transformer_1.DynamoDBModelTransformer(),
            new graphql_auth_transformer_1.ModelAuthTransformer({
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
        },
    });
    try {
        const out = transformer.transform(validSchema);
        let ddbClient;
        ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await (0, index_1.launchDDBLocal)());
        const result = await (0, index_1.deploy)(out, ddbClient);
        server = result.simulator;
        GRAPHQL_ENDPOINT = server.url + '/graphql';
        expect(GRAPHQL_ENDPOINT).toBeTruthy();
        const idToken1 = (0, cognito_utils_1.signUpAddToGroupAndGetJwtToken)(USER_POOL_ID, USERNAME1, USERNAME1, [INSTRUCTOR_GROUP_NAME, ADMIN_GROUP_NAME]);
        APPSYNC_CLIENT_1 = new aws_appsync_1.default({
            url: GRAPHQL_ENDPOINT,
            region: AWS_REGION,
            disableOffline: true,
            offlineConfig: {
                keyPrefix: 'userPools',
            },
            auth: {
                type: aws_appsync_1.AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
                jwtToken: idToken1,
            },
        });
        GRAPHQL_CLIENT_1 = new graphql_client_1.GraphQLClient(GRAPHQL_ENDPOINT, {
            Authorization: idToken1,
        });
        const idToken2 = (0, cognito_utils_1.signUpAddToGroupAndGetJwtToken)(USER_POOL_ID, USERNAME2, USERNAME2, [INSTRUCTOR_GROUP_NAME, MEMBER_GROUP_NAME]);
        APPSYNC_CLIENT_2 = new aws_appsync_1.default({
            url: GRAPHQL_ENDPOINT,
            region: AWS_REGION,
            disableOffline: true,
            offlineConfig: {
                keyPrefix: 'userPools',
            },
            auth: {
                type: aws_appsync_1.AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
                jwtToken: idToken2,
            },
        });
        GRAPHQL_CLIENT_2 = new graphql_client_1.GraphQLClient(GRAPHQL_ENDPOINT, {
            Authorization: idToken2,
        });
        const idToken3 = (0, cognito_utils_1.signUpAddToGroupAndGetJwtToken)(USER_POOL_ID, USERNAME3, USERNAME3, []);
        APPSYNC_CLIENT_3 = new aws_appsync_1.default({
            url: GRAPHQL_ENDPOINT,
            region: AWS_REGION,
            disableOffline: true,
            offlineConfig: {
                keyPrefix: 'userPools',
            },
            auth: {
                type: aws_appsync_1.AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
                jwtToken: idToken3,
            },
        });
        GRAPHQL_CLIENT_3 = new graphql_client_1.GraphQLClient(GRAPHQL_ENDPOINT, {
            Authorization: idToken3,
        });
        await new Promise((res) => setTimeout(res, PROPAGATAION_DELAY));
    }
    catch (e) {
        console.error(e);
        expect(true).toEqual(false);
    }
});
afterAll(async () => {
    try {
        if (server) {
            await server.stop();
        }
        await (0, index_1.terminateDDB)(ddbEmulator, dbPath);
    }
    catch (e) {
        console.error(e);
        throw e;
    }
});
test('Test that only authorized members are allowed to view subscriptions', async () => {
    const observer = APPSYNC_CLIENT_2.subscribe({
        query: (0, graphql_tag_1.default) `
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
    const subscriptionPromise = new Promise((resolve, _) => {
        let subscription = observer.subscribe((event) => {
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
    const subscriptionPromise = new Promise((resolve, _) => {
        const observer = APPSYNC_CLIENT_2.subscribe({
            query: (0, graphql_tag_1.default) `
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
        let subscription = observer.subscribe((event) => {
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
    const subscriptionPromise = new Promise((resolve, _) => {
        const observer = APPSYNC_CLIENT_2.subscribe({
            query: (0, graphql_tag_1.default) `
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
        let subscription = observer.subscribe((event) => {
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
    const result = await createMember(GRAPHQL_CLIENT_2, { id: '001', name: 'notUser' });
    expect(result.errors[0].message === 'Unauthorized');
    const subscriptionPromise = new Promise((resolve, _) => {
        const observer = APPSYNC_CLIENT_2.subscribe({
            query: (0, graphql_tag_1.default) `
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
        const subscription = observer.subscribe((event) => {
            const member = event.data.onCreateMember;
            subscription.unsubscribe();
            expect(member).toBeDefined();
            expect(member.id).toEqual(memberID);
            expect(member.name).toEqual(memberName);
            resolve(undefined);
        });
    });
    await new Promise((res) => setTimeout(res, SUBSCRIPTION_DELAY));
    await createMember(GRAPHQL_CLIENT_1, { id: memberID, name: memberName });
    return subscriptionPromise;
});
test('authorized group is allowed to listen to onUpdate', async () => {
    const memberID = '001';
    const memberName = 'newUsername';
    const subscriptionPromise = new Promise((resolve, _) => {
        const observer = APPSYNC_CLIENT_2.subscribe({
            query: (0, graphql_tag_1.default) `
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
        const subscription = observer.subscribe((event) => {
            const subResponse = event.data.onUpdateMember;
            subscription.unsubscribe();
            expect(subResponse).toBeDefined();
            expect(subResponse.id).toEqual(memberID);
            expect(subResponse.name).toEqual(memberName);
            resolve(undefined);
        });
    });
    await new Promise((res) => setTimeout(res, SUBSCRIPTION_DELAY));
    await updateMember(GRAPHQL_CLIENT_1, { id: memberID, name: memberName });
    return subscriptionPromise;
});
test('authoirzed group is allowed to listen to onDelete', async () => {
    const memberID = '001';
    const memberName = 'newUsername';
    const subscriptionPromise = new Promise((resolve, _) => {
        const observer = APPSYNC_CLIENT_2.subscribe({
            query: (0, graphql_tag_1.default) `
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
        const subscription = observer.subscribe((event) => {
            const subResponse = event.data.onDeleteMember;
            subscription.unsubscribe();
            expect(subResponse).toBeDefined();
            expect(subResponse.id).toEqual(memberID);
            expect(subResponse.name).toEqual(memberName);
            resolve(undefined);
        });
    });
    await new Promise((res) => setTimeout(res, SUBSCRIPTION_DELAY));
    await deleteMember(GRAPHQL_CLIENT_1, { id: memberID });
    return subscriptionPromise;
});
test('Test subscription onCreatePost with ownerField', async () => {
    const subscriptionPromise = new Promise((resolve, _) => {
        const observer = APPSYNC_CLIENT_1.subscribe({
            query: (0, graphql_tag_1.default) `
      subscription OnCreatePost {
          onCreatePost(postOwner: "${USERNAME1}") {
              id
              title
              postOwner
          }
      }`,
        });
        let subscription = observer.subscribe((event) => {
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
async function createStudent(client, input) {
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
async function createMember(client, input) {
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
async function updateMember(client, input) {
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
async function deleteMember(client, input) {
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
async function updateStudent(client, input) {
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
async function deleteStudent(client, input) {
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
async function createPost(client, input) {
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
//# sourceMappingURL=subscriptions-with-auth.e2e.test.js.map