import { GraphQLTransform } from 'graphql-transformer-core';
import { ResourceConstants } from 'graphql-transformer-common';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { ModelAuthTransformer } from '../ModelAuthTransformer';

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
  expect(out.schema).toContain('Post @aws_iam @aws_api_key');
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
  expect(out.schema).not.toContain('Post @aws_iam @aws_api_key');
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
  expect(out.schema).not.toContain('Post @aws_iam @aws_cognito_user_pools');
});
