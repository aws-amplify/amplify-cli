import { GraphQLTransform } from 'graphql-transformer-core';
import { ResourceConstants } from 'graphql-transformer-common';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { ModelAuthTransformer } from '../ModelAuthTransformer';
import _ from 'lodash';

test('Test simple model with public auth rule and amplify admin app is present', () => {
  const validSchema = `
    type Post @model @auth(rules: [{allow: public}]) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'API_KEY',
          },
          additionalAuthenticationProviders: [
            {
              authenticationType: 'AWS_IAM',
            },
          ],
        },
        addAwsIamAuthInOutputSchema: true,
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).toContain('Post @aws_api_key @aws_iam');
});

test('Test simple model with public auth rule and amplify admin app is not enabled', () => {
  const validSchema = `
      type Post @model @auth(rules: [{allow: public}]) {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
      }
      `;
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'API_KEY',
          },
          additionalAuthenticationProviders: [],
        },
        addAwsIamAuthInOutputSchema: false,
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).not.toContain('Post @aws_api_key @aws_iam');
});

test('Test simple model with private auth rule and amplify admin app is present', () => {
  const validSchema = `
      type Post @model @auth(rules: [{allow: groups, groups: ["Admin", "Dev"]}]) {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
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
          additionalAuthenticationProviders: [
            {
              authenticationType: 'AWS_IAM',
            },
          ],
        },
        addAwsIamAuthInOutputSchema: true,
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).toContain('Post @aws_iam @aws_cognito_user_pools');
});

test('Test simple model with private auth rule and amplify admin app not enabled', () => {
  const validSchema = `
      type Post @model @auth(rules: [{allow: groups, groups: ["Admin", "Dev"]}]) {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
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
          additionalAuthenticationProviders: [
            {
              authenticationType: 'AWS_IAM',
            },
          ],
        },
        addAwsIamAuthInOutputSchema: false,
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).not.toContain('Post @aws_cognito_user_pools @aws_iam');
});

test('Test model with public auth rule without all operations and amplify admin app is present', () => {
  const validSchema = `
      type Post @model @auth(rules: [{allow: public, operations: [read, update]}]) {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
      }
      `;
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'API_KEY',
          },
          additionalAuthenticationProviders: [
            {
              authenticationType: 'AWS_IAM',
            },
          ],
        },
        addAwsIamAuthInOutputSchema: true,
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  expect(out.schema).toContain('Post @aws_api_key @aws_iam');
  expect(out.schema).toContain('createPost(input: CreatePostInput!): Post @aws_api_key @aws_iam');
  expect(out.schema).toContain('deletePost(input: DeletePostInput!): Post @aws_api_key @aws_iam');
  expect(out.schema).toContain('updatePost(input: UpdatePostInput!): Post @aws_api_key @aws_iam');

  // No parameter for Auth and UnAuth policy
  expect(out.rootStack.Parameters.authRoleName).toBeUndefined();
  expect(out.rootStack.Parameters.unauthRoleName).toBeUndefined();

  // No Resource extending Auth and UnAuth role
  const policyResources = Object.values(out.rootStack.Resources).filter(r => r.Type === 'AWS::IAM::ManagedPolicy');
  expect(policyResources).toHaveLength(0);
});

test('Test simple model with private auth rule, few operations, and amplify admin app enabled', () => {
  const validSchema = `
      type Post @model @auth(rules: [{allow: groups, groups: ["Admin", "Dev"], operations: [read]}]) {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
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
          additionalAuthenticationProviders: [
            {
              authenticationType: 'AWS_IAM',
            },
          ],
        },
        addAwsIamAuthInOutputSchema: true,
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).toContain('Post @aws_iam @aws_cognito_user_pools');
  expect(out.schema).toContain('createPost(input: CreatePostInput!): Post @aws_iam');
  expect(out.schema).toContain('deletePost(input: DeletePostInput!): Post @aws_iam');
  expect(out.schema).toContain('updatePost(input: UpdatePostInput!): Post @aws_iam');

  // No parameter for Auth and UnAuth policy
  expect(out.rootStack.Parameters.authRoleName).toBeUndefined();
  expect(out.rootStack.Parameters.unauthRoleName).toBeUndefined();

  // No Resource extending Auth and UnAuth role
  const policyResources = Object.values(out.rootStack.Resources).filter(r => r.Type === 'AWS::IAM::ManagedPolicy');
  expect(policyResources).toHaveLength(0);
});

test('Test simple model with private IAM auth rule, few operations, and amplify admin app is not enabled', () => {
  const validSchema = `
      type Post @model @auth(rules: [{allow: private, provider: iam, operations: [read]}]) {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
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
          additionalAuthenticationProviders: [
            {
              authenticationType: 'AWS_IAM',
            },
          ],
        },
        addAwsIamAuthInOutputSchema: false,
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).toContain('Post @aws_iam');
  expect(out.schema).not.toContain('createPost(input: CreatePostInput!): Post @aws_iam');
  expect(out.schema).not.toContain('deletePost(input: DeletePostInput!): Post @aws_iam');
  expect(out.schema).not.toContain('updatePost(input: UpdatePostInput!): Post @aws_iam');

  expect(out.schema).toContain('getPost(id: ID!): Post @aws_iam');
  expect(out.schema).toContain('listPosts(filter: ModelPostFilterInput, limit: Int, nextToken: String): ModelPostConnection @aws_iam');
});

test('Test simple model with AdminUI enabled should add IAM policy only for fields that have explicit IAM auth', () => {
  const validSchema = `
      type Post @model @auth(rules: [{allow: private, provider: iam, operations: [read]}]) {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
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
          additionalAuthenticationProviders: [
            {
              authenticationType: 'AWS_IAM',
            },
          ],
        },
        addAwsIamAuthInOutputSchema: true,
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).toContain('Post @aws_iam @aws_cognito_user_pool');
  expect(out.schema).toContain('createPost(input: CreatePostInput!): Post @aws_iam @aws_cognito_user_pool');
  expect(out.schema).toContain('deletePost(input: DeletePostInput!): Post @aws_iam @aws_cognito_user_pool');
  expect(out.schema).toContain('updatePost(input: UpdatePostInput!): Post @aws_iam @aws_cognito_user_pool');

  expect(out.schema).toContain('getPost(id: ID!): Post @aws_iam');
  expect(out.schema).toContain('listPosts(filter: ModelPostFilterInput, limit: Int, nextToken: String): ModelPostConnection @aws_iam');
  const policyResources = _.filter(out.rootStack.Resources, r => r.Type === 'AWS::IAM::ManagedPolicy');
  expect(policyResources).toHaveLength(1);
  const resources = _.get(policyResources, '[0].Properties.PolicyDocument.Statement[0].Resource');
  const typeFieldList = _.map(resources, r => _.get(r, 'Fn::Sub[1]')).map(r => `${_.get(r, 'typeName')}.${_.get(r, 'fieldName', '*')}`);
  expect(typeFieldList).toEqual([
    'Post.*',
    'Query.getPost',
    'Query.listPosts',
    'Subscription.onCreatePost',
    'Subscription.onUpdatePost',
    'Subscription.onDeletePost',
  ]);

  ['Mutation.createPost', 'Mutation.updatePost', 'Mutation.deletePost'].forEach(field => expect(typeFieldList).not.toContain(field));
});
