import { AuthTransformer } from '../graphql-auth-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { ResourceConstants } from 'graphql-transformer-common';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import { featureFlags } from './test-helpers';

test('happy case with static groups', () => {
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [],
  };
  const validSchema = `
  type Post @model @auth(rules: [{allow: groups, groups: ["Admin", "Dev"]}]) {
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
  expect(out.rootStack!.Resources![ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual(
    'AMAZON_COGNITO_USER_POOLS',
  );
});

test('happy case with dynamic groups', () => {
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [],
  };
  const validSchema = `
    type Post @model @auth(rules: [{allow: groups, groupsField: "groups"}]) {
        id: ID!
        title: String!
        groups: [String]
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new AuthTransformer()],
    featureFlags,
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.rootStack!.Resources![ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual(
    'AMAZON_COGNITO_USER_POOLS',
  );
});

test('validation on @auth on a non-@model type', () => {
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [],
  };
  const invalidSchema = `
    type Post @auth(rules: [{allow: groups, groupsField: "groups"}]) {
        id: ID!
        title: String!
        group: String
        createdAt: String
        updatedAt: String
    }`;
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new AuthTransformer()],
    featureFlags,
  });
  expect(() => transformer.transform(invalidSchema)).toThrowError('Types annotated with @auth must also be annotated with @model.');
});

test('empty groups list', () => {
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [],
  };
  const invalidSchema = `
    type Post @model @auth(rules: [{ allow: groups, groups: [] }]) {
      id: ID!
      title: String!
      group: String
      createdAt: String
      updatedAt: String
    }`;
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new AuthTransformer()],
    featureFlags,
  });
  expect(() => transformer.transform(invalidSchema)).toThrowError('@auth rules using groups cannot have an empty list');
});

test('no @auth rules list', () => {
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [],
  };
  const invalidSchema = `
    type Post @model @auth(rules: []) {
      id: ID!
      title: String!
      group: String
      createdAt: String
      updatedAt: String
    }`;
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new AuthTransformer()],
    featureFlags,
  });
  expect(() => transformer.transform(invalidSchema)).toThrowError('@auth on Post does not have any auth rules.');
});
