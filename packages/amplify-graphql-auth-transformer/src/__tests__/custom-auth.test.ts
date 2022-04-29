import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { ResourceConstants } from 'graphql-transformer-common';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import { AuthTransformer } from '../graphql-auth-transformer';
import { featureFlags } from './test-helpers';

test('happy case with lambda auth mode as default auth mode', () => {
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AWS_LAMBDA',
      lambdaAuthorizerConfig: {
        lambdaFunction: 'test',
        ttlSeconds: 600,
      },
    },
    additionalAuthenticationProviders: [],
  };
  const validSchema = `
  type Post @model @auth(rules: [{ allow: custom, provider: function }]) {
    id: ID!
    title: String!
    createdAt: String
    updatedAt: String
  }`;
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new AuthTransformer()],
    featureFlags,
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.rootStack!.Resources![ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual('AWS_LAMBDA');
});

test('happy case with lambda auth mode as additional auth mode', () => {
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [
      {
        authenticationType: 'AWS_LAMBDA',
        lambdaAuthorizerConfig: {
          lambdaFunction: 'test',
          ttlSeconds: 600,
        },
      },
    ],
  };
  const validSchema = `
    type Post @model @auth(rules: [{ allow: custom, provider: function }]) {
      id: ID!
      title: String!
      createdAt: String
      updatedAt: String
    }`;
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new AuthTransformer()],
    featureFlags,
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(
    out.rootStack!.Resources![ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AdditionalAuthenticationProviders[0]
      .AuthenticationType,
  ).toEqual('AWS_LAMBDA');
});

test('allow: custom defaults provider to function', () => {
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AWS_LAMBDA',
      lambdaAuthorizerConfig: {
        lambdaFunction: 'test',
        ttlSeconds: 600,
      },
    },
    additionalAuthenticationProviders: [],
  };
  const validSchema = `
    type Post @model @auth(rules: [{ allow: custom }]) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }`;
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new AuthTransformer()],
    featureFlags,
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.rootStack!.Resources![ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual('AWS_LAMBDA');
});

test('allow: custom error out when there is no lambda auth mode defined', () => {
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [],
  };
  const validSchema = `
    type Post @model @auth(rules: [{ allow: custom, provider: function }]) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }`;
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new AuthTransformer()],
    featureFlags,
  });
  expect(() => transformer.transform(validSchema)).toThrowError(
    '@auth directive with \'function\' provider found, but the project has no Lambda authentication provider configured.',
  );
});

test('allow: custom and provider: iam error out for invalid combination', () => {
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AWS_LAMBDA',
      lambdaAuthorizerConfig: {
        lambdaFunction: 'test',
        ttlSeconds: 600,
      },
    },
    additionalAuthenticationProviders: [],
  };
  const validSchema = `
    type Post @model @auth(rules: [{ allow: custom, provider: iam }]) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }`;
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new AuthTransformer()],
    featureFlags,
  });
  expect(() => transformer.transform(validSchema)).toThrowError(
    '@auth directive with \'custom\' strategy only supports \'function\' (default) provider, but found \'iam\' assigned.',
  );
});

test('allow: non-custom and provider: function error out for invalid combination', () => {
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AWS_LAMBDA',
      lambdaAuthorizerConfig: {
        lambdaFunction: 'test',
        ttlSeconds: 600,
      },
    },
    additionalAuthenticationProviders: [],
  };
  const validSchema = `
    type Post @model @auth(rules: [{ allow: public, provider: function }]) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }`;
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new AuthTransformer()],
    featureFlags,
  });
  expect(() => transformer.transform(validSchema)).toThrowError(
    '@auth directive with \'public\' strategy only supports \'apiKey\' (default) and \'iam\' providers, but found \'function\' assigned.',
  );
});
