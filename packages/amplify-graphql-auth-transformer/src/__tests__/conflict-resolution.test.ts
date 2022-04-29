import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform, ConflictHandlerType } from '@aws-amplify/graphql-transformer-core';
import { AuthTransformer } from '../graphql-auth-transformer';
import { featureFlags } from './test-helpers';

jest.mock('amplify-prompts');

test('single auth model is enabled with conflict resolution', () => {
  const validSchema = `
    type Post @model @auth(rules: [{ allow: owner}]) {
      id: ID!
      title: String!
      createdAt: String
      updatedAt: String
    }`;
  const transformer = new GraphQLTransform({
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    transformConfig: {},
    resolverConfig: {
      project: {
        ConflictDetection: 'VERSION',
        ConflictHandler: ConflictHandlerType.AUTOMERGE,
      },
    },
    transformers: [new ModelTransformer(), new AuthTransformer()],
    featureFlags: {
      ...featureFlags,
      ...{ getBoolean: () => false },
    },
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).toContain(
    'syncPosts(filter: ModelPostFilterInput, limit: Int, nextToken: String, lastSync: AWSTimestamp): ModelPostConnection',
  );
  expect(out.resolvers['Query.syncPosts.auth.1.req.vtl']).toMatchSnapshot();
});

test('multi auth model with conflict resolution', () => {
  const validSchema = `
    type Post @model @auth(rules: [{ allow: owner }, { allow: private, provider: iam }]) {
      id: ID!
      title: String!
      createdAt: String
      updatedAt: String
    }`;
  const transformer = new GraphQLTransform({
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [{ authenticationType: 'AWS_IAM' }],
    },
    transformConfig: {},
    resolverConfig: {
      project: {
        ConflictDetection: 'VERSION',
        ConflictHandler: ConflictHandlerType.AUTOMERGE,
      },
    },
    transformers: [new ModelTransformer(), new AuthTransformer()],
    featureFlags: {
      ...featureFlags,
      ...{ getBoolean: () => false },
    },
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).toContain(
    'syncPosts(filter: ModelPostFilterInput, limit: Int, nextToken: String, lastSync: AWSTimestamp): ModelPostConnection @aws_iam @aws_cognito_user_pools',
  );
  expect(out.resolvers['Query.syncPosts.auth.1.req.vtl']).toMatchSnapshot();
});

test('multi auth model with field auth with conflict resolution', () => {
  const validSchema = `
    type Test
      @model
      @auth(rules: [
        { provider: iam, allow: private },
        { provider: userPools, allow: private, operations: [read, update] }
      ])
    {
      id: ID!
      writable: String

      readOnly: String
        @auth(rules: [
          { provider: iam, allow: private },
          { provider: userPools, allow: private, operations: [read] }
        ])

      hidden: String
        @auth(rules: [
          { provider: iam, allow: private },
        ])
    }`;

  const transformer = new GraphQLTransform({
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [{ authenticationType: 'AWS_IAM' }],
    },
    transformConfig: {},
    resolverConfig: {
      project: {
        ConflictDetection: 'VERSION',
        ConflictHandler: ConflictHandlerType.AUTOMERGE,
      },
    },
    transformers: [new ModelTransformer(), new AuthTransformer()],
    featureFlags: {
      ...featureFlags,
      ...{ getBoolean: () => false },
    },
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.resolvers['Mutation.updateTest.auth.1.res.vtl']).toMatchSnapshot();
});
