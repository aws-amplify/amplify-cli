import { GraphQLTransform, TRANSFORM_CURRENT_VERSION, TRANSFORM_BASE_VERSION } from 'graphql-transformer-core';
import { KeyTransformer } from 'graphql-key-transformer';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { parse } from 'graphql/language/parser';
import {
  DocumentNode,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  DefinitionNode,
  Kind,
  ObjectTypeDefinitionNode,
  FieldDefinitionNode,
} from 'graphql';
import { VersionedModelTransformer } from 'graphql-versioned-transformer';
import { ModelConnectionTransformer } from 'graphql-connection-transformer';
import { ModelAuthTransformer } from 'graphql-auth-transformer';

import { Auth } from 'aws-amplify';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import gql from 'graphql-tag';
import { ResourceConstants } from 'graphql-transformer-common';
import * as fs from 'fs';
import { CloudFormationClient } from '../CloudFormationClient';
import { Output } from 'aws-sdk/clients/cloudformation';
import { default as CognitoClient } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { default as S3 } from 'aws-sdk/clients/s3';
import { S3Client } from '../S3Client';
import * as path from 'path';
import { deploy } from '../deployNestedStacks';
import { default as moment } from 'moment';
import emptyBucket from '../emptyBucket';
import { createUserPool, createUserPoolClient, deleteUserPool, signupAndAuthenticateUser, configureAmplify } from '../cognitoUtils';
import Role from 'cloudform-types/types/iam/role';
import UserPoolClient from 'cloudform-types/types/cognito/userPoolClient';
import IdentityPool from 'cloudform-types/types/cognito/identityPool';
import IdentityPoolRoleAttachment from 'cloudform-types/types/cognito/identityPoolRoleAttachment';
import AWS = require('aws-sdk');
import 'isomorphic-fetch';

jest.setTimeout(2000000);

const transformAndParseSchema = (schema: string, version: number = TRANSFORM_CURRENT_VERSION): DocumentNode => {
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new VersionedModelTransformer(),
      new KeyTransformer(),
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
    transformConfig: {
      Version: version,
    },
  });

  const out = transformer.transform(schema);

  return parse(out.schema);
};

const getInputType = (doc: DocumentNode, typeName: string): InputObjectTypeDefinitionNode => {
  const type = doc.definitions.find((def: DefinitionNode) => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === typeName);

  expect(type).toBeDefined();

  return <InputObjectTypeDefinitionNode>type;
};

const expectInputTypeDefined = (doc: DocumentNode, typeName: string) => {
  const type = doc.definitions.find((def: DefinitionNode) => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === typeName);
  expect(type).toBeDefined();
};

const expectInputTypeUndefined = (doc: DocumentNode, typeName: string) => {
  const type = doc.definitions.find((def: DefinitionNode) => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === typeName);
  expect(type).toBeUndefined();
};

const expectEnumTypeDefined = (doc: DocumentNode, typeName: string) => {
  const type = doc.definitions.find((def: DefinitionNode) => def.kind === Kind.ENUM_TYPE_DEFINITION && def.name.value === typeName);
  expect(type).toBeDefined();
};

const expectEnumTypeUndefined = (doc: DocumentNode, typeName: string) => {
  const type = doc.definitions.find((def: DefinitionNode) => def.kind === Kind.ENUM_TYPE_DEFINITION && def.name.value === typeName);
  expect(type).toBeUndefined();
};

const expectFieldsOnInputType = (type: InputObjectTypeDefinitionNode, fields: string[]) => {
  expect(type.fields.length).toEqual(fields.length);

  for (const fieldName of fields) {
    const foundField = type.fields.find((f: InputValueDefinitionNode) => f.name.value === fieldName);
    expect(foundField).toBeDefined();
  }
};

const doNotExpectFieldsOnInputType = (type: InputObjectTypeDefinitionNode, fields: string[]) => {
  for (const fieldName of fields) {
    const foundField = type.fields.find((f: InputValueDefinitionNode) => f.name.value === fieldName);
    expect(foundField).toBeUndefined();
  }
};

describe(`Local Mutation Condition tests`, () => {
  it('Type without directives', () => {
    const validSchema = `
            type Post
            @model
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, [
      'content',
      'type',
      'category',
      'author',
      'editors',
      'owner',
      'groups',
      'slug',
      'likeCount',
      'rating',
      'and',
      'or',
      'not',
    ]);
    doNotExpectFieldsOnInputType(type, ['id']);
  });

  it('Type with primary @key - single field - directive', () => {
    const validSchema = `
            type Post
            @model
            @key(fields: ["id"])
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, [
      'content',
      'type',
      'category',
      'author',
      'editors',
      'owner',
      'groups',
      'slug',
      'likeCount',
      'rating',
      'and',
      'or',
      'not',
    ]);
    doNotExpectFieldsOnInputType(type, ['id']);
  });

  it('Type with primary @key - multiple field - directive', () => {
    const validSchema = `
            type Post
            @model
            @key(fields: ["id", "type", "slug"])
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, [
      'content',
      'category',
      'author',
      'editors',
      'owner',
      'groups',
      'likeCount',
      'rating',
      'and',
      'or',
      'not',
    ]);
    doNotExpectFieldsOnInputType(type, ['id', 'type', 'slug']);
  });

  it('Type with @auth directive - owner', () => {
    const validSchema = `
            type Post
            @model
            @auth(rules: [
                {
                    allow: owner
                }
            ])
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, [
      'content',
      'type',
      'category',
      'author',
      'editors',
      'groups',
      'slug',
      'likeCount',
      'rating',
      'and',
      'or',
      'not',
    ]);
    doNotExpectFieldsOnInputType(type, ['id', 'owner']);
  });

  it('Type with @auth directive - owner custom field name', () => {
    const validSchema = `
            type Post
            @model
            @auth(rules: [
                {
                    allow: owner
                    ownerField: "author"
                }
            ])
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, [
      'content',
      'type',
      'category',
      'editors',
      'owner',
      'groups',
      'slug',
      'likeCount',
      'rating',
      'and',
      'or',
      'not',
    ]);
    doNotExpectFieldsOnInputType(type, ['id', 'author']);
  });

  it('Type with @auth directive - groups', () => {
    const validSchema = `
            type Post
            @model
            @auth(rules: [
                {
                    allow: groups
                }
            ])
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, [
      'content',
      'type',
      'category',
      'author',
      'editors',
      'owner',
      'slug',
      'likeCount',
      'rating',
      'and',
      'or',
      'not',
    ]);
    doNotExpectFieldsOnInputType(type, ['id', 'groups']);
  });

  it('Type with @auth directive - groups custom field name', () => {
    const validSchema = `
            type Post
            @model
            @auth(rules: [
                {
                    allow: groups
                    groupsField: "editors"
                }
            ])
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, [
      'content',
      'type',
      'category',
      'author',
      'owner',
      'groups',
      'slug',
      'likeCount',
      'rating',
      'and',
      'or',
      'not',
    ]);
    doNotExpectFieldsOnInputType(type, ['id', 'editors']);
  });

  it('Type with @auth directive - multiple rules', () => {
    const validSchema = `
            type Post
            @model
            @auth(rules: [
            {
                allow: owner
            }
            {
                allow: groups
            }
            {
                allow: owner
                ownerField: "author"
            }
            {
                allow: groups
                groupsField: "editors"
            }
            ])
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, ['content', 'type', 'category', 'slug', 'likeCount', 'rating', 'and', 'or', 'not']);
    doNotExpectFieldsOnInputType(type, ['id', 'author', 'editors', 'owner', 'groups']);
  });

  it('Type with @versioned directive - no changes on condition', () => {
    const validSchema = `
            type Post
            @model
            @versioned
            # @versioned(versionField: "vv", versionInput: "ww")
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, [
      'content',
      'type',
      'category',
      'author',
      'editors',
      'owner',
      'groups',
      'slug',
      'likeCount',
      'rating',
      'and',
      'or',
      'not',
    ]);
    doNotExpectFieldsOnInputType(type, ['id']);
  });

  it('Type with @versioned directive - custom field, no changes on condition', () => {
    const validSchema = `
            type Post
            @model
            @versioned(versionField: "version", versionInput: "requiredVersion")
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, [
      'content',
      'type',
      'category',
      'author',
      'editors',
      'owner',
      'groups',
      'slug',
      'likeCount',
      'rating',
      'and',
      'or',
      'not',
    ]);
    doNotExpectFieldsOnInputType(type, ['id']);
  });
});

// to deal with bug in cognito-identity-js
(global as any).fetch = require('node-fetch');

// To overcome of the way of how AmplifyJS picks up currentUserCredentials
const anyAWS = AWS as any;

if (anyAWS && anyAWS.config && anyAWS.config.credentials) {
  delete anyAWS.config.credentials;
}

describe(`Deployed Mutation Condition tests`, () => {
  const REGION = 'us-west-2';
  const cf = new CloudFormationClient(REGION);

  const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
  const STACK_NAME = `MutationConditionTest-${BUILD_TIMESTAMP}`;
  const BUCKET_NAME = `appsync-mutation-condition-test-bucket-${BUILD_TIMESTAMP}`;
  const LOCAL_FS_BUILD_DIR = '/tmp/mutation_condition_tests/';
  const S3_ROOT_DIR_KEY = 'deployments';
  const AUTH_ROLE_NAME = `${STACK_NAME}-authRole`;
  const UNAUTH_ROLE_NAME = `${STACK_NAME}-unauthRole`;
  const IDENTITY_POOL_NAME = `MutationConditionTest_${BUILD_TIMESTAMP}_identity_pool`;
  const USER_POOL_CLIENTWEB_NAME = `mutationcondition_${BUILD_TIMESTAMP}_clientweb`;
  const USER_POOL_CLIENT_NAME = `mutationcondition_${BUILD_TIMESTAMP}_client`;

  let GRAPHQL_ENDPOINT = undefined;

  let APIKEY_CLIENT: AWSAppSyncClient<any> = undefined;
  let USER_POOL_AUTH_CLIENT_1: AWSAppSyncClient<any> = undefined;
  let USER_POOL_AUTH_CLIENT_2: AWSAppSyncClient<any> = undefined;

  let USER_POOL_ID = undefined;

  const USERNAME1 = 'user1@test.com';
  const USERNAME2 = 'user2@test.com';

  const TMP_PASSWORD = 'Password123!';
  const REAL_PASSWORD = 'Password1234!';

  const cognitoClient = new CognitoClient({ apiVersion: '2016-04-19', region: REGION });
  const customS3Client = new S3Client(REGION);
  const awsS3Client = new S3({ region: REGION });

  const conditionRegexMatch = /GraphQL error: The conditional request failed \(Service: AmazonDynamoDBv2; Status Code: 400; Error Code: ConditionalCheckFailedException; .*/gm;

  function outputValueSelector(key: string) {
    return (outputs: Output[]) => {
      const output = outputs.find((o: Output) => o.OutputKey === key);
      return output ? output.OutputValue : null;
    };
  }

  beforeAll(async () => {
    const validSchema = `
    type Post
    @model
    @versioned
    @auth(rules: [
      { allow: owner }
      { allow: public }
    ])
    @key(fields: ["id", "type"])
    {
        id: ID!
        type: String!
        owner: String
        category: String
        content: String
        slug: String
        rating: Int
    }
`;

    const transformer = new GraphQLTransform({
      transformers: [
        new DynamoDBModelTransformer(),
        new VersionedModelTransformer(),
        new ModelConnectionTransformer(),
        new KeyTransformer(),
        new ModelAuthTransformer({
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
            ],
          },
        }),
      ],
      transformConfig: {
        Version: TRANSFORM_CURRENT_VERSION,
      },
    });

    try {
      await awsS3Client.createBucket({ Bucket: BUCKET_NAME }).promise();
    } catch (e) {
      console.error(`Failed to create bucket: ${e}`);
    }
    const userPoolResponse = await createUserPool(cognitoClient, `UserPool${STACK_NAME}`);
    USER_POOL_ID = userPoolResponse.UserPool.Id;
    const userPoolClientResponse = await createUserPoolClient(cognitoClient, USER_POOL_ID, `UserPool${STACK_NAME}`);
    const userPoolClientId = userPoolClientResponse.UserPoolClient.ClientId;

    try {
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
                Federated: 'cognito-identity.amazonaws.com',
              },
              Action: 'sts:AssumeRoleWithWebIdentity',
              Condition: {
                'ForAnyValue:StringLike': {
                  'cognito-identity.amazonaws.com:amr': 'authenticated',
                },
              },
            },
          ],
        },
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
                Federated: 'cognito-identity.amazonaws.com',
              },
              Action: 'sts:AssumeRoleWithWebIdentity',
              Condition: {
                'ForAnyValue:StringLike': {
                  'cognito-identity.amazonaws.com:amr': 'unauthenticated',
                },
              },
            },
          ],
        },
        Policies: [
          new Role.Policy({
            PolicyName: 'appsync-unauthrole-policy',
            PolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['appsync:GraphQL'],
                  Resource: [
                    {
                      'Fn::Join': [
                        '',
                        [
                          'arn:aws:appsync:',
                          { Ref: 'AWS::Region' },
                          ':',
                          { Ref: 'AWS::AccountId' },
                          ':apis/',
                          {
                            'Fn::GetAtt': ['GraphQLAPI', 'ApiId'],
                          },
                          '/*',
                        ],
                      ],
                    },
                  ],
                },
              ],
            },
          }),
        ],
      });

      const identityPool = new IdentityPool({
        IdentityPoolName: IDENTITY_POOL_NAME,
        CognitoIdentityProviders: [
          {
            ClientId: {
              Ref: 'UserPoolClient',
            },
            ProviderName: {
              'Fn::Sub': [
                'cognito-idp.${region}.amazonaws.com/${client}',
                {
                  region: {
                    Ref: 'AWS::Region',
                  },
                  client: USER_POOL_ID,
                },
              ],
            },
          } as unknown,
          {
            ClientId: {
              Ref: 'UserPoolClientWeb',
            },
            ProviderName: {
              'Fn::Sub': [
                'cognito-idp.${region}.amazonaws.com/${client}',
                {
                  region: {
                    Ref: 'AWS::Region',
                  },
                  client: USER_POOL_ID,
                },
              ],
            },
          } as unknown,
        ],
        AllowUnauthenticatedIdentities: true,
      });

      const identityPoolRoleMap = new IdentityPoolRoleAttachment({
        IdentityPoolId: ({ Ref: 'IdentityPool' } as unknown) as string,
        Roles: {
          unauthenticated: { 'Fn::GetAtt': ['UnauthRole', 'Arn'] },
          authenticated: { 'Fn::GetAtt': ['AuthRole', 'Arn'] },
        },
      });

      const userPoolClientWeb = new UserPoolClient({
        ClientName: USER_POOL_CLIENTWEB_NAME,
        RefreshTokenValidity: 30,
        UserPoolId: USER_POOL_ID,
      });

      const userPoolClient = new UserPoolClient({
        ClientName: USER_POOL_CLIENT_NAME,
        GenerateSecret: true,
        RefreshTokenValidity: 30,
        UserPoolId: USER_POOL_ID,
      });

      out.rootStack.Resources.IdentityPool = identityPool;
      out.rootStack.Resources.IdentityPoolRoleMap = identityPoolRoleMap;
      out.rootStack.Resources.UserPoolClientWeb = userPoolClientWeb;
      out.rootStack.Resources.UserPoolClient = userPoolClient;
      out.rootStack.Outputs.IdentityPoolId = { Value: { Ref: 'IdentityPool' } };
      out.rootStack.Outputs.IdentityPoolName = { Value: { 'Fn::GetAtt': ['IdentityPool', 'Name'] } };

      out.rootStack.Resources.AuthRole = authRole;
      out.rootStack.Outputs.AuthRoleArn = { Value: { 'Fn::GetAtt': ['AuthRole', 'Arn'] } };
      out.rootStack.Resources.UnauthRole = unauthRole;
      out.rootStack.Outputs.UnauthRoleArn = { Value: { 'Fn::GetAtt': ['UnauthRole', 'Arn'] } };

      // Since we're doing the policy here we've to remove the transformer generated artifacts from
      // the generated stack.
      const maxPolicyCount = 10;
      for (let i = 0; i < maxPolicyCount; i++) {
        const paddedIndex = `${i + 1}`.padStart(2, '0');
        const authResourceName = `${ResourceConstants.RESOURCES.AuthRolePolicy}${paddedIndex}`;
        const unauthResourceName = `${ResourceConstants.RESOURCES.UnauthRolePolicy}${paddedIndex}`;

        if (out.rootStack.Resources[authResourceName]) {
          delete out.rootStack.Resources[authResourceName];
        }

        if (out.rootStack.Resources[unauthResourceName]) {
          delete out.rootStack.Resources[unauthResourceName];
        }
      }

      delete out.rootStack.Parameters.authRoleName;
      delete out.rootStack.Parameters.unauthRoleName;

      for (const key of Object.keys(out.rootStack.Resources)) {
        if (
          out.rootStack.Resources[key].Properties &&
          out.rootStack.Resources[key].Properties.Parameters &&
          out.rootStack.Resources[key].Properties.Parameters.unauthRoleName
        ) {
          delete out.rootStack.Resources[key].Properties.Parameters.unauthRoleName;
        }

        if (
          out.rootStack.Resources[key].Properties &&
          out.rootStack.Resources[key].Properties.Parameters &&
          out.rootStack.Resources[key].Properties.Parameters.authRoleName
        ) {
          delete out.rootStack.Resources[key].Properties.Parameters.authRoleName;
        }
      }

      for (const stackKey of Object.keys(out.stacks)) {
        const stack = out.stacks[stackKey];

        for (const key of Object.keys(stack.Resources)) {
          if (stack.Parameters && stack.Parameters.unauthRoleName) {
            delete stack.Parameters.unauthRoleName;
          }
          if (stack.Parameters && stack.Parameters.authRoleName) {
            delete stack.Parameters.authRoleName;
          }
          if (
            stack.Resources[key].Properties &&
            stack.Resources[key].Properties.Parameters &&
            stack.Resources[key].Properties.Parameters.unauthRoleName
          ) {
            delete stack.Resources[key].Properties.Parameters.unauthRoleName;
          }
          if (
            stack.Resources[key].Properties &&
            stack.Resources[key].Properties.Parameters &&
            stack.Resources[key].Properties.Parameters.authRoleName
          ) {
            delete stack.Resources[key].Properties.Parameters.authRoleName;
          }
        }
      }

      const params = {
        CreateAPIKey: '1',
        AuthCognitoUserPoolId: USER_POOL_ID,
      };

      const finishedStack = await deploy(
        customS3Client,
        cf,
        STACK_NAME,
        out,
        params,
        LOCAL_FS_BUILD_DIR,
        BUCKET_NAME,
        S3_ROOT_DIR_KEY,
        BUILD_TIMESTAMP,
      );
      expect(finishedStack).toBeDefined();
      const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
      const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput);
      GRAPHQL_ENDPOINT = getApiEndpoint(finishedStack.Outputs);
      console.log(`Using graphql url: ${GRAPHQL_ENDPOINT}`);

      const apiKey = getApiKey(finishedStack.Outputs);
      console.log(`API KEY: ${apiKey}`);
      expect(apiKey).toBeTruthy();

      const getIdentityPoolId = outputValueSelector('IdentityPoolId');
      const identityPoolId = getIdentityPoolId(finishedStack.Outputs);
      expect(identityPoolId).toBeTruthy();
      console.log(`Identity Pool Id: ${identityPoolId}`);

      console.log(`User pool Id: ${USER_POOL_ID}`);
      console.log(`User pool ClientId: ${userPoolClientId}`);

      // Verify we have all the details
      expect(GRAPHQL_ENDPOINT).toBeTruthy();
      expect(USER_POOL_ID).toBeTruthy();
      expect(userPoolClientId).toBeTruthy();

      // Configure Amplify, create users, and sign in.
      configureAmplify(USER_POOL_ID, userPoolClientId, identityPoolId);

      const authRes1 = await signupAndAuthenticateUser(USER_POOL_ID, USERNAME1, TMP_PASSWORD, REAL_PASSWORD);
      const idToken1 = authRes1.getIdToken().getJwtToken();

      const authRes2 = await signupAndAuthenticateUser(USER_POOL_ID, USERNAME2, TMP_PASSWORD, REAL_PASSWORD);
      const idToken2 = authRes2.getIdToken().getJwtToken();

      USER_POOL_AUTH_CLIENT_1 = new AWSAppSyncClient({
        url: GRAPHQL_ENDPOINT,
        region: REGION,
        auth: {
          type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
          jwtToken: () => idToken1,
        },
        offlineConfig: {
          keyPrefix: 'userPools',
        },
        disableOffline: true,
      });

      USER_POOL_AUTH_CLIENT_2 = new AWSAppSyncClient({
        url: GRAPHQL_ENDPOINT,
        region: REGION,
        auth: {
          type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
          jwtToken: () => idToken2,
        },
        offlineConfig: {
          keyPrefix: 'userPools',
        },
        disableOffline: true,
      });

      APIKEY_CLIENT = new AWSAppSyncClient({
        url: GRAPHQL_ENDPOINT,
        region: REGION,
        auth: {
          type: AUTH_TYPE.API_KEY,
          apiKey,
        },
        offlineConfig: {
          keyPrefix: 'apikey',
        },
        disableOffline: true,
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

  it('Create Mutation with failing condition', async () => {
    const createMutation = gql`
      mutation {
        createPost(
          input: { id: "P1", type: "Post", category: "T1", content: "Content #1", slug: "content-1", rating: 4 }
          condition: { category: { eq: "T" } }
        ) {
          id
        }
      }
    `;

    try {
      await APIKEY_CLIENT.mutate({
        mutation: createMutation,
        fetchPolicy: 'no-cache',
      });
    } catch (e) {
      expect(e.message).toMatch(conditionRegexMatch);
    }
  });

  it('Update Mutation with failing and succeeding condition', async () => {
    const createMutation = gql`
      mutation {
        createPost(input: { id: "P1", type: "Post", category: "T1", content: "Content #1", slug: "content-1", rating: 4 }) {
          id
        }
      }
    `;

    const createResponse = await APIKEY_CLIENT.mutate({
      mutation: createMutation,
      fetchPolicy: 'no-cache',
    });

    expect(createResponse.data.createPost.id).toBeDefined();

    // Update P1 if rating === 5 (but it is 4)
    const updateMutationFailure = gql`
      mutation {
        updatePost(
          input: { id: "P1", type: "Post", content: "Content #1 - Update", expectedVersion: 1 }
          condition: { rating: { eq: 5 } }
        ) {
          id
        }
      }
    `;

    try {
      await APIKEY_CLIENT.mutate({
        mutation: updateMutationFailure,
        fetchPolicy: 'no-cache',
      });
    } catch (e) {
      expect(e.message).toMatch(conditionRegexMatch);
    }

    // Update P1 if rating === 4
    const updateMutationSuccess = gql`
      mutation {
        updatePost(
          input: { id: "P1", type: "Post", content: "Content #1 - Update", expectedVersion: 1 }
          condition: { rating: { eq: 4 } }
        ) {
          id
          content
        }
      }
    `;

    const updateResponse = await APIKEY_CLIENT.mutate({
      mutation: updateMutationSuccess,
      fetchPolicy: 'no-cache',
    });

    expect(updateResponse.data.updatePost.id).toBeDefined();
    expect(updateResponse.data.updatePost.content).toEqual('Content #1 - Update');
  });

  it('Update Mutation with failing and succeeding complex conditions', async () => {
    const createMutation = gql`
      mutation {
        createPost(input: { id: "P2", type: "Post", category: "T1", content: "Content #2", slug: "content-2", rating: 4 }) {
          id
        }
      }
    `;

    const createResponse = await APIKEY_CLIENT.mutate({
      mutation: createMutation,
      fetchPolicy: 'no-cache',
    });

    expect(createResponse.data.createPost.id).toBeDefined();

    // Update P2 if (content beginsWith "Content #2" AND rating === [4-5]) OR content is null
    const updateMutation = gql`
      mutation {
        updatePost(
          input: { id: "P2", type: "Post", content: "Content #2 - UpdateComplex", expectedVersion: 1 }
          condition: {
            or: [{ and: [{ content: { beginsWith: "Content #2" } }, { rating: { between: [4, 5] } }] }, { content: { eq: null } }]
          }
        ) {
          id
          content
        }
      }
    `;

    const updateResponse = await APIKEY_CLIENT.mutate({
      mutation: updateMutation,
      fetchPolicy: 'no-cache',
    });

    expect(updateResponse.data.updatePost.id).toBeDefined();
    expect(updateResponse.data.updatePost.content).toEqual('Content #2 - UpdateComplex');
  });

  it('Delete Mutation with failing and succeeding complex conditions', async () => {
    const createMutation = gql`
      mutation {
        createPost(input: { id: "P3", type: "Post", category: "T1", content: "Content #3", slug: "content-3", rating: 4 }) {
          id
        }
      }
    `;

    const createResponse = await APIKEY_CLIENT.mutate({
      mutation: createMutation,
      fetchPolicy: 'no-cache',
    });

    expect(createResponse.data.createPost.id).toBeDefined();

    // Delete P3 if (content equals "Content #3" AND rating === [4-5]) OR content is null
    const deleteMutation = gql`
      mutation {
        deletePost(
          input: { id: "P3", type: "Post", expectedVersion: 1 }
          condition: { or: [{ and: [{ content: { eq: "Content #3" } }, { rating: { between: [4, 5] } }] }, { content: { eq: null } }] }
        ) {
          id
          content
        }
      }
    `;

    const deleteResponse = await APIKEY_CLIENT.mutate({
      mutation: deleteMutation,
      fetchPolicy: 'no-cache',
    });

    expect(deleteResponse.data.deletePost.id).toBeDefined();
    expect(deleteResponse.data.deletePost.content).toEqual('Content #3');
  });

  it('Update Mutation with different owners and same condition', async () => {
    const createMutation = gql`
      mutation {
        createPost(input: { id: "P4", type: "Post", category: "T1", content: "Content #4", slug: "content-4", rating: 4 }) {
          id
        }
      }
    `;

    const createResponse = await USER_POOL_AUTH_CLIENT_1.mutate({
      mutation: createMutation,
      fetchPolicy: 'no-cache',
    });

    expect(createResponse.data.createPost.id).toBeDefined();

    // Update P4 if rating === 4, different user (non-owner)
    const updateMutation = gql`
      mutation {
        updatePost(
          input: { id: "P4", type: "Post", content: "Content #4 - Update", expectedVersion: 1 }
          condition: { rating: { eq: 4 } }
        ) {
          id
        }
      }
    `;

    try {
      await USER_POOL_AUTH_CLIENT_2.mutate({
        mutation: updateMutation,
        fetchPolicy: 'no-cache',
      });
    } catch (e) {
      expect(e.message).toMatch(conditionRegexMatch);
    }

    // Update P4 if rating === 5, owner user, wrong condition
    const updateMutation2 = gql`
      mutation {
        updatePost(
          input: { id: "P4", type: "Post", content: "Content #4 - Update", expectedVersion: 1 }
          condition: { rating: { eq: 5 } }
        ) {
          id
        }
      }
    `;

    try {
      await USER_POOL_AUTH_CLIENT_1.mutate({
        mutation: updateMutation2,
        fetchPolicy: 'no-cache',
      });
    } catch (e) {
      expect(e.message).toMatch(conditionRegexMatch);
    }

    // Update P4 if rating === 4, owner user, right condition
    const updateMutation3 = gql`
      mutation {
        updatePost(
          input: { id: "P4", type: "Post", content: "Content #4 - Update", expectedVersion: 1 }
          condition: { rating: { eq: 4 } }
        ) {
          id
          content
          version
        }
      }
    `;

    const updateResponse = await USER_POOL_AUTH_CLIENT_1.mutate({
      mutation: updateMutation3,
      fetchPolicy: 'no-cache',
    });

    expect(updateResponse.data.updatePost.id).toBeDefined();
    expect(updateResponse.data.updatePost.content).toEqual('Content #4 - Update');
    expect(updateResponse.data.updatePost.version).toEqual(2);
  });

  it('Delete Mutation with different owners and same condition', async () => {
    const createMutation = gql`
      mutation {
        createPost(input: { id: "P5", type: "Post", category: "T1", content: "Content #5", slug: "content-5", rating: 4 }) {
          id
        }
      }
    `;

    const createResponse = await USER_POOL_AUTH_CLIENT_1.mutate({
      mutation: createMutation,
      fetchPolicy: 'no-cache',
    });

    expect(createResponse.data.createPost.id).toBeDefined();

    // Delete P5 if rating === 4, different user (non-owner)
    const deleteMutation = gql`
      mutation {
        deletePost(input: { id: "P5", type: "Post", expectedVersion: 1 }, condition: { rating: { eq: 4 } }) {
          id
        }
      }
    `;

    try {
      await USER_POOL_AUTH_CLIENT_2.mutate({
        mutation: deleteMutation,
        fetchPolicy: 'no-cache',
      });
    } catch (e) {
      expect(e.message).toMatch(conditionRegexMatch);
    }

    // Delete P5 if rating === 5, owner user, wrong condition
    const deleteMutation2 = gql`
      mutation {
        deletePost(input: { id: "P5", type: "Post", expectedVersion: 1 }, condition: { rating: { eq: 5 } }) {
          id
        }
      }
    `;

    try {
      await USER_POOL_AUTH_CLIENT_1.mutate({
        mutation: deleteMutation2,
        fetchPolicy: 'no-cache',
      });
    } catch (e) {
      expect(e.message).toMatch(conditionRegexMatch);
    }

    // Delete P5 if rating === 4, owner user, right condition
    const deleteMutation3 = gql`
      mutation {
        deletePost(input: { id: "P5", type: "Post", expectedVersion: 1 }, condition: { rating: { eq: 4 } }) {
          id
          content
          version
        }
      }
    `;

    const deleteResponse = await USER_POOL_AUTH_CLIENT_1.mutate({
      mutation: deleteMutation3,
      fetchPolicy: 'no-cache',
    });

    expect(deleteResponse.data.deletePost.id).toBeDefined();
    expect(deleteResponse.data.deletePost.content).toEqual('Content #5');
    expect(deleteResponse.data.deletePost.version).toEqual(1);
  });
});

describe(`Local V4-V5 Transformer tests`, () => {
  it('V4 transform result', () => {
    const validSchema = `
            type Post
            @model
            {
                id: ID!
                content: String
                rating: Int
                state: State
                stateList: [State]
            }

            enum State {
              DRAFT,
              PUBLISHED
            }
        `;

    const schema = transformAndParseSchema(validSchema, TRANSFORM_BASE_VERSION);

    const filterType = getInputType(schema, 'ModelPostFilterInput');
    expectFieldsOnInputType(filterType, ['id', 'content', 'rating', 'state', 'stateList', 'and', 'or', 'not']);
    doNotExpectFieldsOnInputType(filterType, ['attributeExists']);
    doNotExpectFieldsOnInputType(filterType, ['attributeType']);

    expectInputTypeUndefined(schema, 'ModelPostConditionInput');

    expectInputTypeDefined(schema, 'ModelStringFilterInput');
    expectInputTypeDefined(schema, 'ModelIDFilterInput');
    expectInputTypeDefined(schema, 'ModelIntFilterInput');
    expectInputTypeDefined(schema, 'ModelFloatFilterInput');
    expectInputTypeDefined(schema, 'ModelBooleanFilterInput');
    expectInputTypeDefined(schema, 'ModelStateFilterInput');
    expectInputTypeDefined(schema, 'ModelStateListFilterInput');

    expectInputTypeUndefined(schema, 'ModelSizeInput');
    expectEnumTypeUndefined(schema, 'ModelAttributeTypes');

    const mutation = <ObjectTypeDefinitionNode>(
      schema.definitions.find((def: DefinitionNode) => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === 'Mutation')
    );
    expect(mutation).toBeDefined();

    const checkMutation = (name: string) => {
      const field = <FieldDefinitionNode>mutation.fields.find(f => f.name.value === `${name}Post`);
      expect(field).toBeDefined();
      const conditionArg = field.arguments.find(a => a.name.value === 'condition');
      expect(conditionArg).toBeUndefined();
    };

    checkMutation('create');
    checkMutation('update');
    checkMutation('delete');
  });

  it(`V5 transform result`, () => {
    const validSchema = `
            type Post
            @model
            {
                id: ID!
                content: String
                rating: Int
                state: State
                stateList: [State]
            }

            enum State {
              DRAFT,
              PUBLISHED
            }
        `;

    const conditionFeatureVersion = 5;
    const schema = transformAndParseSchema(validSchema, conditionFeatureVersion);

    const filterType = getInputType(schema, 'ModelPostFilterInput');
    expectFieldsOnInputType(filterType, ['id', 'content', 'rating', 'state', 'stateList', 'and', 'or', 'not']);

    const conditionType = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(conditionType, ['content', 'rating', 'state', 'stateList', 'and', 'or', 'not']);

    expectInputTypeDefined(schema, 'ModelStringInput');
    expectInputTypeDefined(schema, 'ModelIDInput');
    expectInputTypeDefined(schema, 'ModelIntInput');
    expectInputTypeDefined(schema, 'ModelFloatInput');
    expectInputTypeDefined(schema, 'ModelBooleanInput');
    expectInputTypeDefined(schema, 'ModelStateInput');
    expectInputTypeDefined(schema, 'ModelStateListInput');
    expectInputTypeDefined(schema, 'ModelSizeInput');
    expectEnumTypeDefined(schema, 'ModelAttributeTypes');

    const mutation = <ObjectTypeDefinitionNode>(
      schema.definitions.find((def: DefinitionNode) => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === 'Mutation')
    );
    expect(mutation).toBeDefined();

    const checkMutation = (name: string) => {
      const field = <FieldDefinitionNode>mutation.fields.find(f => f.name.value === `${name}Post`);
      expect(field).toBeDefined();
      const conditionArg = field.arguments.find(a => a.name.value === 'condition');
      expect(conditionArg).toBeDefined();
    };

    checkMutation('create');
    checkMutation('update');
    checkMutation('delete');
  });

  it(`Current version transform result`, () => {
    const validSchema = `
            type Post
            @model
            {
                id: ID!
                content: String
                rating: Int
                state: State
                stateList: [State]
            }

            enum State {
              DRAFT,
              PUBLISHED
            }
        `;

    const schema = transformAndParseSchema(validSchema, TRANSFORM_CURRENT_VERSION);

    const filterType = getInputType(schema, 'ModelPostFilterInput');
    expectFieldsOnInputType(filterType, ['id', 'content', 'rating', 'state', 'stateList', 'and', 'or', 'not']);

    const conditionType = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(conditionType, ['content', 'rating', 'state', 'stateList', 'and', 'or', 'not']);

    expectInputTypeDefined(schema, 'ModelStringInput');
    expectInputTypeDefined(schema, 'ModelIDInput');
    expectInputTypeDefined(schema, 'ModelIntInput');
    expectInputTypeDefined(schema, 'ModelFloatInput');
    expectInputTypeDefined(schema, 'ModelBooleanInput');
    expectInputTypeDefined(schema, 'ModelStateInput');
    expectInputTypeDefined(schema, 'ModelStateListInput');
    expectInputTypeDefined(schema, 'ModelSizeInput');
    expectEnumTypeDefined(schema, 'ModelAttributeTypes');

    const mutation = <ObjectTypeDefinitionNode>(
      schema.definitions.find((def: DefinitionNode) => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === 'Mutation')
    );
    expect(mutation).toBeDefined();

    const checkMutation = (name: string) => {
      const field = <FieldDefinitionNode>mutation.fields.find(f => f.name.value === `${name}Post`);
      expect(field).toBeDefined();
      const conditionArg = field.arguments.find(a => a.name.value === 'condition');
      expect(conditionArg).toBeDefined();
    };

    checkMutation('create');
    checkMutation('update');
    checkMutation('delete');
  });
});
