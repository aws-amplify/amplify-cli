import { AuthTransformer } from '../graphql-auth-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { HasOneTransformer, HasManyTransformer, BelongsToTransformer } from '@aws-amplify/graphql-relational-transformer'
import { PrimaryKeyTransformer } from '@aws-amplify/graphql-index-transformer'
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { ResourceConstants } from 'graphql-transformer-common';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';

test('auth with hasMany relation - only partition key', () => {
  const validSchema = `
      type Post
        @model
        @auth(rules: [
                {allow: owner},
                {allow: groups, groups: ["Moderator"]}
            ]) {
        id: ID!
        title: String
        description: String
        comments: [Comment] @hasMany
      }
      
      type Comment
        @model
        @auth(rules: [
          {allow: owner},
          {allow: groups, groups: ["Moderator"]}
      ]) {
        id: ID!
        text: String
        post: Post @belongsTo
      }`;
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [],
  };
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [
      new ModelTransformer(),
      new HasManyTransformer(),
      new BelongsToTransformer(),
      new AuthTransformer()
    ],
  });
  let out;
  expect(() => {
    out = transformer.transform(validSchema);
  }).not.toThrowError();
  expect(out).toBeDefined();
  expect(out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual(
    'AMAZON_COGNITO_USER_POOLS',
  );
});

test('auth with hasOne relation mismatch fields count - missing sort key must throw an error', () => {
  const validSchema = `
      type Student
        @model
        @auth(rules: [
            {allow: owner}
        ]) {
        id: ID!
        firstName: String
        lastName: String
        courseId: ID!
        scores: StudentScore @hasOne(fields: ["id"])
      }
      
      type StudentScore
        @model
        @auth(rules: [
          {allow: owner}
        ]) {
        studentId: ID! @primaryKey(sortKeyFields: ["courseId"])
        courseId: ID!
        score: Int
        student: Student @belongsTo
      }`;
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [],
  };
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [
      new ModelTransformer(),
      new PrimaryKeyTransformer(),
      new HasOneTransformer(),
      new HasManyTransformer(),
      new BelongsToTransformer(),
      new AuthTransformer()
    ],
  });
  let out;
  expect(() => {
    out = transformer.transform(validSchema);
  }).toThrowError('Invalid @hasOne on Student:scores. Provided fields do not match the size of primary key(s) for StudentScore');
});

test('auth with hasOne relation match fields count - single sort key do not throw error', () => {
  const validSchema = `
      type Student
        @model
        @auth(rules: [
            {allow: owner}
        ]) {
        id: ID!
        firstName: String
        lastName: String
        courseId: ID!
        scores: [StudentScore] @hasMany(fields: ["id", "courseId"])
      }
      
      type StudentScore
        @model
        @auth(rules: [
          {allow: owner}
        ]) {
        studentId: ID! @primaryKey(sortKeyFields: ["courseId"])
        courseId: ID!
        score: Int
        student: Student @belongsTo
      }`;
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [],
  };
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [
      new ModelTransformer(),
      new PrimaryKeyTransformer(),
      new HasOneTransformer(),
      new HasManyTransformer(),
      new BelongsToTransformer(),
      new AuthTransformer()
    ],
  });
  let out;
  expect(() => {
    out = transformer.transform(validSchema);
  }).not.toThrowError();
});

test('auth with hasOne relation mismatch fields count - partial missing sort key must throw an error', () => {
  const validSchema = `
      type Student
        @model
        @auth(rules: [
            {allow: owner}
        ]) {
        id: ID!
        firstName: String
        lastName: String
        courseId: ID!
        localId: ID!
        scores: StudentScore @hasOne(fields: ["id", "courseId"])
      }
      
      type StudentScore
        @model
        @auth(rules: [
          {allow: owner}
        ]) {
        studentId: ID! @primaryKey(sortKeyFields: ["courseId", "localId"])
        courseId: ID!
        localId: ID!
        score: Int
        student: Student @belongsTo
      }`;
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [],
  };
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [
      new ModelTransformer(),
      new PrimaryKeyTransformer(),
      new HasOneTransformer(),
      new HasManyTransformer(),
      new BelongsToTransformer(),
      new AuthTransformer()
    ],
  });
  let out;
  expect(() => {
    out = transformer.transform(validSchema);
  }).toThrowError('Invalid @hasOne directive on scores. Partial sort keys are not accepted.');
});

test('auth with hasOne relation match fields count - multiple sort keys do not throw error', () => {
  const validSchema = `
      type Student
        @model
        @auth(rules: [
            {allow: owner}
        ]) {
        id: ID!
        firstName: String
        lastName: String
        courseId: ID!
        localId: ID!
        scores: StudentScore @hasOne(fields: ["id", "courseId", "localId"])
      }
      
      type StudentScore
        @model
        @auth(rules: [
          {allow: owner}
        ]) {
        studentId: ID! @primaryKey(sortKeyFields: ["courseId", "localId"])
        courseId: ID!
        localId: ID!
        score: Int
        student: Student @belongsTo
      }`;
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [],
  };
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [
      new ModelTransformer(),
      new PrimaryKeyTransformer(),
      new HasOneTransformer(),
      new HasManyTransformer(),
      new BelongsToTransformer(),
      new AuthTransformer()
    ],
  });
  let out;
  expect(() => {
    out = transformer.transform(validSchema);
  }).not.toThrowError();
});