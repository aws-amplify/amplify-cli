import { ResourceConstants } from 'graphql-transformer-common'
import GraphQLTransform from 'graphql-transformer-core'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'
import ModelAuthTransformer from 'graphql-auth-transformer'
import ModelConnectionTransformer from 'graphql-connection-transformer'
import * as fs from 'fs'
import { CloudFormationClient } from '../CloudFormationClient'
import { Output } from 'aws-sdk/clients/cloudformation'
import * as S3 from 'aws-sdk/clients/s3'
import { CreateBucketRequest } from 'aws-sdk/clients/s3'
import * as CognitoClient from 'aws-sdk/clients/cognitoidentityserviceprovider'
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import gql from 'graphql-tag';
import { S3Client } from '../S3Client';
import { deploy } from '../deployNestedStacks'
import * as moment from 'moment';
import emptyBucket from '../emptyBucket';
import { IAM as cfnIAM, Cognito as cfnCognito } from 'cloudform-types';
import {
    createUserPool, createUserPoolClient, deleteUserPool,
    signupAndAuthenticateUser, createGroup, addUserToGroup, configureAmplify
} from '../cognitoUtils';
import 'isomorphic-fetch';

// to deal with bug in cognito-identity-js
(global as any).fetch = require("node-fetch");
// to deal with subscriptions in node env
(global as any).WebSocket = require('ws');

jest.setTimeout(2000000);

const AWS_REGION = 'us-west-2'
const cf = new CloudFormationClient(AWS_REGION)

const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss')
const STACK_NAME = `SubscriptionAuthTests-${BUILD_TIMESTAMP}`
const BUCKET_NAME = `subscription-auth-tests-bucket-${BUILD_TIMESTAMP}`
const LOCAL_BUILD_ROOT = '/tmp/subscription_auth_tests/'
const DEPLOYMENT_ROOT_KEY = 'deployments'
const AUTH_ROLE_NAME = `${STACK_NAME}-authRole`;
const UNAUTH_ROLE_NAME = `${STACK_NAME}-unauthRole`;
const IDENTITY_POOL_NAME = `SubscriptionAuthModelAuthTransformerTest_${BUILD_TIMESTAMP}_identity_pool`;
const USER_POOL_CLIENTWEB_NAME = `subs_multiauth_${BUILD_TIMESTAMP}_clientweb`;
const USER_POOL_CLIENT_NAME = `subs_multiauth_${BUILD_TIMESTAMP}_client`;

let GRAPHQL_ENDPOINT = undefined;

/**
 * Client 1 is logged in and is a member of the Admin group.
 */
let GRAPHQL_CLIENT_1: AWSAppSyncClient<any> = undefined;

/**
 * Client 2 is logged in and is a member of the Devs group.
 */
let GRAPHQL_CLIENT_2: AWSAppSyncClient<any> = undefined;

/**
 * Client 3 is logged in and has no group memberships.
 */
let GRAPHQL_CLIENT_3: AWSAppSyncClient<any> = undefined;

let USER_POOL_ID = undefined;

const USERNAME1 = 'user1@test.com'
const USERNAME2 = 'user2@test.com'
const USERNAME3 = 'user3@test.com'
const TMP_PASSWORD = 'Password123!'
const REAL_PASSWORD = 'Password1234!'

const INSTRUCTOR_GROUP_NAME = 'Instructor';

const cognitoClient = new CognitoClient({ apiVersion: '2016-04-19', region: AWS_REGION })
const customS3Client = new S3Client(AWS_REGION)
const awsS3Client = new S3({ region: AWS_REGION })

interface CreateStudentInput {
    id?: string,
    name?: string,
    email?: string,
    ssn?: string,
}

function outputValueSelector(key: string) {
    return (outputs: Output[]) => {
        const output = outputs.find((o: Output) => o.OutputKey === key)
        return output ? output.OutputValue : null
    }
}

async function createBucket(name: string) {
    return new Promise((res, rej) => {
        const params: CreateBucketRequest = {
            Bucket: name,
        }
        awsS3Client.createBucket(params, (err, data) => err ? rej(err) : res(data))
    })
}

async function deleteBucket(name: string) {
    return new Promise((res, rej) => {
        const params: CreateBucketRequest = {
            Bucket: name,
        }
        awsS3Client.deleteBucket(params, (err, data) => err ? rej(err) : res(data))
    })
}

beforeAll(async () => {
    // Create a stack for the post model with auth enabled.
    if (!fs.existsSync(LOCAL_BUILD_ROOT)) {
        fs.mkdirSync(LOCAL_BUILD_ROOT);
    }
    await createBucket(BUCKET_NAME)
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
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new ModelConnectionTransformer(),
            new ModelAuthTransformer({
                authConfig: {
                    defaultAuthentication: {
                        authenticationType: 'AMAZON_COGNITO_USER_POOLS'
                    },
                    additionalAuthenticationProviders: []
                }
            }),
        ]
    })
    const userPoolResponse = await createUserPool(cognitoClient, `UserPool${STACK_NAME}`);
    USER_POOL_ID = userPoolResponse.UserPool.Id;
    const userPoolClientResponse = await createUserPoolClient(cognitoClient, USER_POOL_ID, `UserPool${STACK_NAME}`);
    const userPoolClientId = userPoolClientResponse.UserPoolClient.ClientId;
    try {
        // Clean the bucket
        const out = transformer.transform(validSchema)

        const params = {
            AuthCognitoUserPoolId: USER_POOL_ID
        }

        const finishedStack = await deploy(
            customS3Client, cf, STACK_NAME, out, params,
            LOCAL_BUILD_ROOT, BUCKET_NAME, DEPLOYMENT_ROOT_KEY, BUILD_TIMESTAMP
        )
        expect(finishedStack).toBeDefined()
        const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput)
        GRAPHQL_ENDPOINT = getApiEndpoint(finishedStack.Outputs)
        console.log(`Using graphql url: ${GRAPHQL_ENDPOINT}`);


        console.log(`User pool Id: ${USER_POOL_ID}`);
        console.log(`User pool ClientId: ${userPoolClientId}`);

        // Verify we have all the details
        expect(GRAPHQL_ENDPOINT).toBeTruthy()
        expect(USER_POOL_ID).toBeTruthy()
        expect(userPoolClientId).toBeTruthy()

        // Configure Amplify, create users, and sign in.
        configureAmplify(USER_POOL_ID, userPoolClientId)

        await signupAndAuthenticateUser(USER_POOL_ID, USERNAME1, TMP_PASSWORD, REAL_PASSWORD)
        await signupAndAuthenticateUser(USER_POOL_ID, USERNAME2, TMP_PASSWORD, REAL_PASSWORD)
        await createGroup(USER_POOL_ID, INSTRUCTOR_GROUP_NAME)
        await addUserToGroup(INSTRUCTOR_GROUP_NAME, USERNAME1, USER_POOL_ID)
        await addUserToGroup(INSTRUCTOR_GROUP_NAME, USERNAME2, USER_POOL_ID)

        const authResAfterGroup: any = await signupAndAuthenticateUser(USER_POOL_ID, USERNAME1, TMP_PASSWORD, REAL_PASSWORD)
        const idToken = authResAfterGroup.getIdToken().getJwtToken()
        GRAPHQL_CLIENT_1 = new AWSAppSyncClient({url: GRAPHQL_ENDPOINT, region: AWS_REGION,
            disableOffline: true,
            auth: {
                type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
                jwtToken: idToken,
            }})

        const authRes2AfterGroup: any = await signupAndAuthenticateUser(USER_POOL_ID, USERNAME2, TMP_PASSWORD, REAL_PASSWORD)
        const idToken2 = authRes2AfterGroup.getIdToken().getJwtToken()
        GRAPHQL_CLIENT_2 = new AWSAppSyncClient({url: GRAPHQL_ENDPOINT, region: AWS_REGION,
            disableOffline: true,
            auth: {
                type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
                jwtToken: idToken2,
            }})

        const authRes3: any = await signupAndAuthenticateUser(USER_POOL_ID, USERNAME3, TMP_PASSWORD, REAL_PASSWORD)
        const idToken3 = authRes3.getIdToken().getJwtToken()
        GRAPHQL_CLIENT_3 = new AWSAppSyncClient({url: GRAPHQL_ENDPOINT, region: AWS_REGION,
            disableOffline: true,
            auth: {
                type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
                jwtToken: idToken3,
            }})

        // Wait for any propagation to avoid random
        // "The security token included in the request is invalid" errors
        await new Promise((res) => setTimeout(() => res(), 5000))
    } catch (e) {
        console.error(e)
        expect(true).toEqual(false)
    }
});

afterAll(async () => {
    try {
        console.log('Deleting stack ' + STACK_NAME)
        await cf.deleteStack(STACK_NAME)
        await deleteUserPool(cognitoClient, USER_POOL_ID)
        await cf.waitForStack(STACK_NAME)
        console.log('Successfully deleted stack ' + STACK_NAME)
    } catch (e) {
        if (e.code === 'ValidationError' && e.message === `Stack with id ${STACK_NAME} does not exist`) {
            // The stack was deleted. This is good.
            expect(true).toEqual(true)
            console.log('Successfully deleted stack ' + STACK_NAME)
        } else {
            console.error(e)
            throw e;
        }
    }
    try {
        await emptyBucket(BUCKET_NAME);
    } catch (e) {
        console.error(`Failed to empty S3 bucket: ${e}`)
    }
})

/**
 * Tests
 */

// tests using cognito
test('Test that only authorized members are allowed to view subscriptions', async done => {
    // subscribe to create students as user 2
    const observer = onCreateStudent(GRAPHQL_CLIENT_2, 'suscribing to events as user 2')
    let subscription = observer.subscribe( (event: any) => {
        console.log('subscription event: ', event)
        const student = event.data.onCreateStudent;
        subscription.unsubscribe()
        expect(student.name).toEqual('student1')
        expect(student.email).toEqual('student1@domain.com')
        expect(student.ssn).toBeNull()
        done();
    });

    await new Promise((res) => setTimeout(() => res(), 1000))

    createStudent(GRAPHQL_CLIENT_1,
        'create student 1',
        {
            name: "student1",
            email: "student1@domain.com",
            ssn: "AAA-01-SSSS",
        })
})

test('Test that an user not in the group is not allowed to view the subscription', async done => {
    // suscribe to create students as user 3
    const observer = onCreateStudent(GRAPHQL_CLIENT_3, 'suscribing to events as user 3')
    observer.subscribe({
        error: (err: any) => {
            console.log(err.graphQLErrors[0])
            expect(err.graphQLErrors[0].message).toEqual('Not Authorized to access onCreateStudent on type Subscription')
            expect(err.graphQLErrors[0].errorType).toEqual('Unauthorized')
            done()
        }
    });
    await new Promise((res) => setTimeout(() => res(), 1000))

    createStudent(GRAPHQL_CLIENT_1,
        'create student 2', {
            name: "student2",
            email: "student2@domain.com",
            ssn: "BBB-00-SNSN"
    })
})

async function createStudent(client: AWSAppSyncClient<any>, logMsg: string, input: CreateStudentInput) {
    const request = gql`mutation CreateStudent($input: CreateStudentInput!) {
        createStudent(input: $input) {
          id
          name
          email
          ssn
          owner
        }
      }
    `;
    const response = await client.mutate({mutation: request, variables: {input}});
    console.log(logMsg);
    return response;
}

function onCreateStudent(client: AWSAppSyncClient<any>, logMsg: string, owner?: string) {
    const request = gql`subscription OnCreateStudent {
        onCreateStudent {
          id
          name
          email
          ssn
          owner
        }
      }`;
      console.log(logMsg);
      return client.subscribe({query: request});
}