import { Auth } from 'aws-amplify';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import gql from 'graphql-tag';
import { ResourceConstants } from 'graphql-transformer-common';
import GraphQLTransform from 'graphql-transformer-core';
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer';
import ModelAuthTransformer from 'graphql-auth-transformer';
import * as fs from 'fs';
import { CloudFormationClient } from '../CloudFormationClient';
import { Output } from 'aws-sdk/clients/cloudformation';
import * as CognitoClient from 'aws-sdk/clients/cognitoidentityserviceprovider';
import * as S3 from 'aws-sdk/clients/s3';
import { S3Client } from '../S3Client';
import * as path from 'path';
import { deploy } from '../deployNestedStacks'
import * as moment from 'moment';
import emptyBucket from '../emptyBucket';
import {
    createUserPool, createUserPoolClient, deleteUserPool,
    signupAndAuthenticateUser, configureAmplify
} from '../cognitoUtils';
import Role from 'cloudform-types/types/iam/role';
import UserPoolClient from 'cloudform-types/types/cognito/userPoolClient';
import IdentityPool from 'cloudform-types/types/cognito/identityPool';
import IdentityPoolRoleAttachment from 'cloudform-types/types/cognito/identityPoolRoleAttachment';

// to deal with bug in cognito-identity-js
(global as any).fetch = require("node-fetch");

jest.setTimeout(2000000);

const cf = new CloudFormationClient('us-west-2');

const REGION = 'us-west-2';
const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `MultiAuthModelAuthTransformerTest-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `appsync-multi-auth-transformer-test-bucket-${BUILD_TIMESTAMP}`;
const LOCAL_FS_BUILD_DIR = '/tmp/multi_auth_model_auth_transform_tests/';
const S3_ROOT_DIR_KEY = 'deployments';
const AUTH_ROLE_NAME = `${STACK_NAME}-authRole`;
const UNAUTH_ROLE_NAME = `${STACK_NAME}-unauthRole`;
const IDENTITY_POOL_NAME = `MultiAuthModelAuthTransformerTest_${BUILD_TIMESTAMP}_identity_pool`;
const USER_POOL_CLIENTWEB_NAME = `multiauth_${BUILD_TIMESTAMP}_clientweb`;
const USER_POOL_CLIENT_NAME = `multiauth_${BUILD_TIMESTAMP}_client`;

let GRAPHQL_ENDPOINT = undefined;

let APIKEY_GRAPHQL_CLIENT: AWSAppSyncClient<any> = undefined;
let USER_POOL_AUTH_CLIENT: AWSAppSyncClient<any> = undefined;
let IAM_UNAUTHCLIENT: AWSAppSyncClient<any> = undefined;

let USER_POOL_ID = undefined;

const USERNAME1 = 'user1@test.com';

const TMP_PASSWORD = 'Password123!';
const REAL_PASSWORD = 'Password1234!';

const cognitoClient = new CognitoClient({ apiVersion: '2016-04-19', region: REGION });
const customS3Client = new S3Client(REGION);
const awsS3Client = new S3({ region: REGION });

function outputValueSelector(key: string) {
    return (outputs: Output[]) => {
        const output = outputs.find((o: Output) => o.OutputKey === key);
        return output ? output.OutputValue : null;
    }
}

function deleteDirectory(directory: string) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const contentPath = path.join(directory, file);
        if (fs.lstatSync(contentPath).isDirectory()) {
            deleteDirectory(contentPath);
            fs.rmdirSync(contentPath);
        } else {
            fs.unlinkSync(contentPath);
        }
    }
}

beforeAll(async () => {
    // Create a stack for the post model with auth enabled.
    const validSchema = `
    # Allow anyone to access. This is translated into API_KEY.
    type PostPublic @model @auth(rules: [{ allow: public }]) {
        id: ID!
        title: String
    }

    # Allow anyone to access. This is translated to IAM with unauth role.
    type PostPublicIAM @model @auth(rules: [{ allow: public, provider: iam }]) {
        id: ID!
        title: String
    }

    # Allow anyone with a valid Amazon Cognito UserPools JWT to access.
    type PostPrivate @model @auth(rules: [{ allow: private }]) {
        id: ID!
        title: String
    }

    # Allow anyone with a sigv4 signed request with relevant policy to access.
    type PostPrivateIAM @model @auth(rules: [{ allow: private, provider: iam }]) {
        id: ID!
        title: String
    }

    # I have a model that is protected by userPools by default.
    # I want to call createPost from my lambda.
    type PostOwnerIAM @model
    @auth (
        rules: [
            # The cognito user pool owner can CRUD.
            { allow: owner },
            # A lambda function using IAM can call Mutation.createPost.
            { allow: private, provider: iam, operations: [create] }
        ]
    )
    {
        id: ID!
        title: String
        owner: String
    }

    type PostSecretFieldIAM @model
    @auth (
        rules: [
            # The cognito user pool and can CRUD.
            { allow: private }
        ]
    )
    {
        id: ID!
        title: String
        owner: String
        secret: String
            @auth (
                rules: [
                    # Only a lambda function using IAM can create/update this field
                    { allow: private, provider: iam, operations: [create, update] }
                ]
            )
    }
    `;

    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new ModelAuthTransformer({
                authConfig: {
                    defaultAuthentication: {
                        authenticationType: 'AMAZON_COGNITO_USER_POOLS'
                    },
                    additionalAuthenticationProviders: [
                        {
                            authenticationType: 'API_KEY',
                            apiKeyConfig: {
                                description: 'E2E Test API Key',
                                apiKeyExpirationDays: 300
                            }
                        },
                        {
                            authenticationType: 'AWS_IAM'
                        },
                    ],
                }
            })
        ]
    });

    try {
        await awsS3Client.createBucket({Bucket: BUCKET_NAME}).promise();
    } catch (e) {
        console.error(`Failed to create bucket: ${e}`);
    }
    const userPoolResponse = await createUserPool(cognitoClient, `UserPool${STACK_NAME}`);
    USER_POOL_ID = userPoolResponse.UserPool.Id;
    const userPoolClientResponse = await createUserPoolClient(cognitoClient, USER_POOL_ID, `UserPool${STACK_NAME}`);
    const userPoolClientId = userPoolClientResponse.UserPoolClient.ClientId;

    try {
        // Clean the bucket
        const out = transformer.transform(validSchema);

        const authRole = new Role({
            RoleName: AUTH_ROLE_NAME,
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: '',
                        Effect: 'Allow',
                        Principal: {
                            Federated: 'cognito-identity.amazonaws.com'
                        },
                        Action: 'sts:AssumeRoleWithWebIdentity',
                        Condition: {
                            'ForAnyValue:StringLike': {
                                'cognito-identity.amazonaws.com:amr': 'authenticated'
                            }
                        }
                    }
                ]
            }
        });

        const unauthRole = new Role({
            RoleName: UNAUTH_ROLE_NAME,
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: '',
                        Effect: 'Allow',
                        Principal: {
                            Federated: 'cognito-identity.amazonaws.com'
                        },
                        Action: 'sts:AssumeRoleWithWebIdentity',
                        Condition: {
                            'ForAnyValue:StringLike': {
                                'cognito-identity.amazonaws.com:amr': 'unauthenticated'
                            }
                        }
                    }
                ]
            },
            Policies: [
                new Role.Policy({
                    PolicyName: 'appsync-unauthrole-policy',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                        {
                            Effect: 'Allow',
                            Action: [
                                'appsync:GraphQL'
                            ],
                            Resource: [{
                                'Fn::Join': [
                                    '',
                                    [
                                        'arn:aws:appsync:',
                                        { Ref: 'AWS::Region' },
                                        ':',
                                        { Ref: 'AWS::AccountId' },
                                        ':apis/',
                                        {
                                            'Fn::GetAtt': [
                                                'GraphQLAPI',
                                                'ApiId'
                                            ]
                                        },
                                        '/*',
                                    ],
                                ],
                            }],
                        }],
                    },
                }),
            ]
        });

        const identityPool = new IdentityPool({
            IdentityPoolName: IDENTITY_POOL_NAME,
            CognitoIdentityProviders: [
                {
                    ClientId: {
                        Ref: 'UserPoolClient'
                    },
                    ProviderName: {
                        'Fn::Sub': [
                            'cognito-idp.${region}.amazonaws.com/${client}',
                            {
                                'region': {
                                    Ref: 'AWS::Region'
                                },
                                'client': USER_POOL_ID
                            }
                        ]
                    }
                } as unknown,
                {
                    ClientId: {
                        Ref: 'UserPoolClientWeb'
                    },
                    ProviderName: {
                        'Fn::Sub': [
                            'cognito-idp.${region}.amazonaws.com/${client}',
                            {
                                'region': {
                                    Ref: 'AWS::Region'
                                },
                                'client': USER_POOL_ID
                            }
                        ]
                    }
                } as unknown,
            ],
            AllowUnauthenticatedIdentities: true
        });

        const identityPoolRoleMap = new IdentityPoolRoleAttachment({
            IdentityPoolId: { Ref: 'IdentityPool' } as unknown as string,
            Roles: {
                'unauthenticated': { 'Fn::GetAtt': [ 'UnauthRole', 'Arn' ] },
                'authenticated': { 'Fn::GetAtt': [ 'AuthRole', 'Arn' ] }
            }
        });

        const userPoolClientWeb = new UserPoolClient({
            ClientName: USER_POOL_CLIENTWEB_NAME,
            RefreshTokenValidity: 30,
            UserPoolId: USER_POOL_ID
        });

        const userPoolClient = new UserPoolClient({
            ClientName: USER_POOL_CLIENT_NAME,
            GenerateSecret: true,
            RefreshTokenValidity: 30,
            UserPoolId: USER_POOL_ID
        });

        out.rootStack.Resources.IdentityPool = identityPool;
        out.rootStack.Resources.IdentityPoolRoleMap = identityPoolRoleMap;
        out.rootStack.Resources.UserPoolClientWeb = userPoolClientWeb;
        out.rootStack.Resources.UserPoolClient = userPoolClient;
        out.rootStack.Outputs.IdentityPoolId = { Value: { Ref: 'IdentityPool' } };
        out.rootStack.Outputs.IdentityPoolName = { Value: { 'Fn::GetAtt': [ 'IdentityPool', 'Name' ] } };

        out.rootStack.Resources.AuthRole = authRole;
        out.rootStack.Outputs.AuthRoleArn = { Value: { 'Fn::GetAtt': [ 'AuthRole', 'Arn' ] } };
        out.rootStack.Resources.UnauthRole = unauthRole;
        out.rootStack.Outputs.UnauthRoleArn = { Value: { 'Fn::GetAtt': [ 'UnauthRole', 'Arn' ] } };

        // Since we're doing the policy here we've to removed the transformer generated artifacts from
        // the generated stack.
        delete out.rootStack.Resources[ResourceConstants.RESOURCES.UnauthRolePolicy];
        delete out.rootStack.Parameters.unauthRoleName;

        for (const key of Object.keys(out.rootStack.Resources)) {
            if (out.rootStack.Resources[key].Properties &&
                out.rootStack.Resources[key].Properties.Parameters &&
                out.rootStack.Resources[key].Properties.Parameters.unauthRoleName) {
                delete out.rootStack.Resources[key].Properties.Parameters.unauthRoleName;
                const a2 = out.rootStack.Resources[key].Properties.Parameters.unauthRoleName;
            }
        }

        for (const stackKey of Object.keys(out.stacks)) {
            const stack = out.stacks[stackKey];

            for (const key of Object.keys(stack.Resources)) {
                if (stack.Parameters &&
                    stack.Parameters.unauthRoleName) {
                    delete stack.Parameters.unauthRoleName;
                }
                if (stack.Resources[key].Properties &&
                    stack.Resources[key].Properties.Parameters &&
                    stack.Resources[key].Properties.Parameters.unauthRoleName) {
                    delete stack.Resources[key].Properties.Parameters.unauthRoleName;
                }
            }
        }

        // const a = out.rootStack.Resources.PostOwnerIAM.Properties.Parameters.unauthRoleName;
        // delete out.rootStack.Resources.PostOwnerIAM.Properties.Parameters.unauthRoleName;
        // const b = out.rootStack.Resources.PostOwnerIAM.Properties.Parameters.unauthRoleName;

        const params = {
            CreateAPIKey: '1',
            AuthCognitoUserPoolId: USER_POOL_ID
        };

        const finishedStack = await deploy(
            customS3Client, cf, STACK_NAME, out, params,
            LOCAL_FS_BUILD_DIR, BUCKET_NAME, S3_ROOT_DIR_KEY, BUILD_TIMESTAMP
        );
        expect(finishedStack).toBeDefined();
        const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
        const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput);
        GRAPHQL_ENDPOINT = getApiEndpoint(finishedStack.Outputs);
        console.log(`Using graphql url: ${GRAPHQL_ENDPOINT}`);

        const apiKey = getApiKey(finishedStack.Outputs);
        console.log(`API KEY: ${apiKey}`);
        expect(apiKey).toBeTruthy();

        const getIdentityPoolId = outputValueSelector('IdentityPoolId')
        const identityPoolId = getIdentityPoolId(finishedStack.Outputs);
        expect(identityPoolId).toBeTruthy();
        console.log(`Identity Pool Id: ${identityPoolId}`);

        // Verify we have all the details
        expect(GRAPHQL_ENDPOINT).toBeTruthy();
        expect(USER_POOL_ID).toBeTruthy();
        expect(userPoolClientId).toBeTruthy();

        // Configure Amplify, create users, and sign in.
        configureAmplify(USER_POOL_ID, userPoolClientId, identityPoolId);

        const unauthCredentials = await Auth.currentCredentials();

        IAM_UNAUTHCLIENT = new AWSAppSyncClient({
            url: GRAPHQL_ENDPOINT,
            region: REGION,
            auth: {
                type: AUTH_TYPE.AWS_IAM,
                credentials: {
                accessKeyId: unauthCredentials.accessKeyId,
                secretAccessKey: unauthCredentials.secretAccessKey
                }
            },
            offlineConfig: {
                keyPrefix: 'iam'
            },
            disableOffline: true,
            });

        const authRes = await signupAndAuthenticateUser(USER_POOL_ID, USERNAME1, TMP_PASSWORD, REAL_PASSWORD);
        const idToken = authRes.getIdToken().getJwtToken();

        USER_POOL_AUTH_CLIENT = new AWSAppSyncClient({
            url: GRAPHQL_ENDPOINT,
            region: REGION,
            auth: {
                type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
                jwtToken: () => idToken
            },
            offlineConfig: {
                keyPrefix: 'userPools'
            },
            disableOffline: true,
        });

        APIKEY_GRAPHQL_CLIENT = new AWSAppSyncClient({
            url: GRAPHQL_ENDPOINT,
            region: REGION,
            auth: {
                type: AUTH_TYPE.API_KEY,
                apiKey: apiKey
            },
            offlineConfig: {
                keyPrefix: 'apikey'
            },
            disableOffline: true,
        });

        // Wait for any propagation to avoid random
        // "The security token included in the request is invalid" errors
        await new Promise((res) => setTimeout(() => res(), 5000));
    } catch (e) {
        console.error(e);
        expect(true).toEqual(false);
    }
});

afterAll(async () => {
    try {
        console.log('Deleting stack ' + STACK_NAME);
        await cf.deleteStack(STACK_NAME);
        await deleteUserPool(cognitoClient, USER_POOL_ID);
        await cf.waitForStack(STACK_NAME);
        console.log('Successfully deleted stack ' + STACK_NAME);
    } catch (e) {
        if (e.code === 'ValidationError' && e.message === `Stack with id ${STACK_NAME} does not exist`) {
            // The stack was deleted. This is good.
            expect(true).toEqual(true);
            console.log('Successfully deleted stack ' + STACK_NAME);
        } else {
            console.error(e);
            expect(true).toEqual(false);
        }
    }
    try {
        await emptyBucket(BUCKET_NAME);
    } catch (e) {
        console.error(`Failed to empty S3 bucket: ${e}`);
    }
});

/**
 * Test queries below
 */
test(`Test 'public' authStrategy`, async () => {
    try {
        const createMutation = gql(`mutation {
            createPostPublic(input: { title: "Hello, World!" }) {
                id
                title
            }
        }`);

        const getQuery = gql(`query ($id: ID!) {
            getPostPublic(id: $id) {
                id
                title
            }
        }`);

        const response = await APIKEY_GRAPHQL_CLIENT.mutate({
            mutation: createMutation,
            fetchPolicy: 'no-cache',
        });
        expect(response.data.createPostPublic.id).toBeDefined();
        expect(response.data.createPostPublic.title).toEqual('Hello, World!');

        const postId = response.data.createPostPublic.id;

        // Authenticate User Pools user must fail
        try {
            await USER_POOL_AUTH_CLIENT.query({
                query: getQuery,
                fetchPolicy: 'no-cache',
                variables: {
                    id: postId
                }
            });
        } catch (e) {
            expect(e.message).toMatch('GraphQL error: Not Authorized to access getPostPublic on type Query');
        }

        // IAM with unauth role must fail
        try {
            await IAM_UNAUTHCLIENT.query({
                query: getQuery,
                fetchPolicy: 'no-cache',
                variables: {
                    id: postId
                }
            });
        } catch (e) {
            expect(e.message).toMatch('GraphQL error: Not Authorized to access getPostPublic on type Query');
        }

    } catch (e) {
        console.error(e);
        expect(true).toEqual(false);
    }
});

test(`Test 'public' provider: 'iam' authStrategy`, async () => {
    try {
        const createMutation = gql(`mutation {
            createPostPublicIAM(input: { title: "Hello, World!" }) {
                id
                title
            }
        }`);

        const getQuery = gql(`query ($id: ID!) {
            getPostPublicIAM(id: $id) {
                id
                title
            }
        }`);

        const response = await IAM_UNAUTHCLIENT.mutate({
            mutation: createMutation,
            fetchPolicy: 'no-cache',
        });
        expect(response.data.createPostPublicIAM.id).toBeDefined();
        expect(response.data.createPostPublicIAM.title).toEqual('Hello, World!');

        const postId = response.data.createPostPublicIAM.id;

        // Authenticate User Pools user must fail
        try {
            await USER_POOL_AUTH_CLIENT.query({
                query: getQuery,
                fetchPolicy: 'no-cache',
                variables: {
                    id: postId
                }
            });
        } catch (e) {
            expect(e.message).toMatch('GraphQL error: Not Authorized to access getPostPublicIAM on type Query');
        }

        // API Key must fail
        try {
            await APIKEY_GRAPHQL_CLIENT.query({
                query: getQuery,
                fetchPolicy: 'no-cache',
                variables: {
                    id: postId
                }
            });
        } catch (e) {
            expect(e.message).toMatch('GraphQL error: Not Authorized to access getPostPublicIAM on type Query');
        }

    } catch (e) {
        console.error(e);
        expect(true).toEqual(false);
    }
});

test(`Test 'private' authStrategy`, async () => {
    try {
        const createMutation = gql(`mutation {
            createPostPrivate(input: { title: "Hello, World!" }) {
                id
                title
            }
        }`);

        const getQuery = gql(`query ($id: ID!) {
            getPostPrivate(id: $id) {
                id
                title
            }
        }`);

        const response = await USER_POOL_AUTH_CLIENT.mutate({
            mutation: createMutation,
            fetchPolicy: 'no-cache',
        });
        expect(response.data.createPostPrivate.id).toBeDefined();
        expect(response.data.createPostPrivate.title).toEqual('Hello, World!');

        const postId = response.data.createPostPrivate.id;

        // Authenticate API Key fail
        try {
            await APIKEY_GRAPHQL_CLIENT.query({
                query: getQuery,
                fetchPolicy: 'no-cache',
                variables: {
                    id: postId
                }
            });
        } catch (e) {
            expect(e.message).toMatch('GraphQL error: Not Authorized to access getPostPrivate on type Query');
        }

        // IAM with unauth role must fail
        try {
            await IAM_UNAUTHCLIENT.query({
                query: getQuery,
                fetchPolicy: 'no-cache',
                variables: {
                    id: postId
                }
            });
        } catch (e) {
            expect(e.message).toMatch('GraphQL error: Not Authorized to access getPostPrivate on type Query');
        }

    } catch (e) {
        console.error(e);
        expect(true).toEqual(false);
    }
});

test(`Test 'private' provider: 'iam' authStrategy`, async () => {
    // This test reuses the unauth role, but any IAM credentials would work
    // in real world scenarios, we've to see if provider override works.
    try {
        const createMutation = gql(`mutation {
            createPostPrivateIAM(input: { title: "Hello, World!" }) {
                id
                title
            }
        }`);

        const getQuery = gql(`query ($id: ID!) {
            getPostPrivateIAM(id: $id) {
                id
                title
            }
        }`);

        const response = await IAM_UNAUTHCLIENT.mutate({
            mutation: createMutation,
            fetchPolicy: 'no-cache',
        });
        expect(response.data.createPostPrivateIAM.id).toBeDefined();
        expect(response.data.createPostPrivateIAM.title).toEqual('Hello, World!');

        const postId = response.data.createPostPrivateIAM.id;

        // Authenticate User Pools user must fail
        try {
            await USER_POOL_AUTH_CLIENT.query({
                query: getQuery,
                fetchPolicy: 'no-cache',
                variables: {
                    id: postId
                }
            });
        } catch (e) {
            expect(e.message).toMatch('GraphQL error: Not Authorized to access getPostPrivateIAM on type Query');
        }

        // API Key must fail
        try {
            await APIKEY_GRAPHQL_CLIENT.query({
                query: getQuery,
                fetchPolicy: 'no-cache',
                variables: {
                    id: postId
                }
            });
        } catch (e) {
            expect(e.message).toMatch('GraphQL error: Not Authorized to access getPostPrivateIAM on type Query');
        }

    } catch (e) {
        console.error(e);
        expect(true).toEqual(false);
    }
});

test(`Test 'private' provider: 'iam' authStrategy`, async () => {
    // This test reuses the unauth role, but any IAM credentials would work
    // in real world scenarios, we've to see if provider override works.

    // - Create UserPool - Verify owner
    // - Create IAM - Verify owner (blank)
    // - Get UserPool owner - Verify success
    // - Get UserPool non-owner - Verify deny
    // - Get IAM - Verify deny
    // - Get API Key - Verify deny

    try {
        const createMutation = gql(`mutation {
            createPostOwnerIAM(input: { title: "Hello, World!" }) {
                id
                title
                owner
            }
        }`);

        const getQuery = gql(`query ($id: ID!) {
            getPostOwnerIAM(id: $id) {
                id
                title
                owner
            }
        }`);

        const response = await USER_POOL_AUTH_CLIENT.mutate({
            mutation: createMutation,
            fetchPolicy: 'no-cache',
        });
        expect(response.data.createPostOwnerIAM.id).toBeDefined();
        expect(response.data.createPostOwnerIAM.title).toEqual('Hello, World!');
        expect(response.data.createPostOwnerIAM.owner).toEqual(USERNAME1);

        const postIdOwner = response.data.createPostOwnerIAM.id;

        const responseIAM = await IAM_UNAUTHCLIENT.mutate({
            mutation: createMutation,
            fetchPolicy: 'no-cache',
        });
        expect(responseIAM.data.createPostOwnerIAM.id).toBeDefined();
        expect(responseIAM.data.createPostOwnerIAM.title).toEqual('Hello, World!');
        expect(responseIAM.data.createPostOwnerIAM.owner).toBeNull();

        const postIdIAM = responseIAM.data.createPostOwnerIAM.id;

        const responseGetUserPool = await USER_POOL_AUTH_CLIENT.query<any>({
            query: getQuery,
            fetchPolicy: 'no-cache',
            variables: {
                id: postIdOwner
            }
        });

        expect(responseGetUserPool.data.getPostOwnerIAM.id).toBeDefined();
        expect(responseGetUserPool.data.getPostOwnerIAM.title).toEqual('Hello, World!');
        expect(responseGetUserPool.data.getPostOwnerIAM.owner).toEqual(USERNAME1);

        try {
            await USER_POOL_AUTH_CLIENT.query({
                query: getQuery,
                fetchPolicy: 'no-cache',
                variables: {
                    id: postIdIAM
                }
            });
        } catch (e) {
            expect(e.message).toMatch('GraphQL error: Not Authorized to access getPostOwnerIAM on type Query');
        }

        // IAM user must fail
        try {
            await IAM_UNAUTHCLIENT.query({
                query: getQuery,
                fetchPolicy: 'no-cache',
                variables: {
                    id: postIdOwner
                }
            });
        } catch (e) {
            expect(e.message).toMatch('GraphQL error: Not Authorized to access getPostOwnerIAM on type Query');
        }

        // API Key must fail
        try {
            await APIKEY_GRAPHQL_CLIENT.query({
                query: getQuery,
                variables: {
                    id: postIdOwner
                }
            });
        } catch (e) {
            expect(e.message).toMatch('GraphQL error: Not Authorized to access getPostOwnerIAM on type Query');
        }

    } catch (e) {
        console.error(e);
        expect(true).toEqual(false);
    }
});

test(`Test IAM protected field operations`, async () => {
    // This test reuses the unauth role, but any IAM credentials would work
    // in real world scenarios, we've to see if provider override works.

    // - Create UserPool - no secret - Verify success
    // - Create IAM - with secret - Verify success
    // - Get UserPool - Verify success
    // - Get UserPool with secret - Verify deny
    // - Get IAM with secret - Verify deny (only create and update)

    try {
        const createMutation = gql(`mutation {
            createPostSecretFieldIAM(input: { title: "Hello, World!"  }) {
                id
                title
            }
        }`);

        const createMutationWithSecret = gql(`mutation {
            createPostSecretFieldIAM(input: { title: "Hello, World!", secret: "42" }) {
                id
                title
                secret
            }
        }`);

        const getQuery = gql(`query ($id: ID!) {
            getPostSecretFieldIAM(id: $id) {
                id
                title
            }
        }`);

        const getQueryWithSecret = gql(`query ($id: ID!) {
            getPostSecretFieldIAM(id: $id) {
                id
                title
                secret
            }
        }`);

        const response = await USER_POOL_AUTH_CLIENT.mutate({
            mutation: createMutation,
            fetchPolicy: 'no-cache',
        });
        expect(response.data.createPostSecretFieldIAM.id).toBeDefined();
        expect(response.data.createPostSecretFieldIAM.title).toEqual('Hello, World!');

        const postIdNoSecret = response.data.createPostSecretFieldIAM.id;

        const responseIAMSecret = await IAM_UNAUTHCLIENT.mutate({
            mutation: createMutationWithSecret,
            fetchPolicy: 'no-cache',
        });
        expect(responseIAMSecret.data.createPostSecretFieldIAM.id).toBeDefined();
        expect(responseIAMSecret.data.createPostSecretFieldIAM.title).toEqual('Hello, World!');
        expect(responseIAMSecret.data.createPostSecretFieldIAM.secret).toEqual('42');

        const postIdSecret = responseIAMSecret.data.createPostSecretFieldIAM.id;

        const responseGetUserPool = await USER_POOL_AUTH_CLIENT.query<any>({
            query: getQuery,
            fetchPolicy: 'no-cache',
            variables: {
                id: postIdNoSecret
            }
        });
        expect(responseGetUserPool.data.getPostSecretFieldIAM.id).toBeDefined();
        expect(responseGetUserPool.data.getPostSecretFieldIAM.title).toEqual('Hello, World!');

        try {
            await USER_POOL_AUTH_CLIENT.query({
                query: getQueryWithSecret,
                fetchPolicy: 'no-cache',
                variables: {
                    id: postIdSecret
                }
            });
        } catch (e) {
            expect(e.message).toMatch('GraphQL error: Not Authorized to access secret on type PostSecretFieldIAM');
        }

        try {
            await IAM_UNAUTHCLIENT.query({
                query: getQueryWithSecret,
                fetchPolicy: 'no-cache',
                variables: {
                    id: postIdSecret
                }
            });
        } catch (e) {
            expect(e.message).toMatch('GraphQL error: Not Authorized to access getPostSecretFieldIAM on type Query');
        }

    } catch (e) {
        console.error(e);
        expect(true).toEqual(false);
    }
});
