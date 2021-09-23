import { parse } from 'graphql';
import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { ResourceConstants } from 'graphql-transformer-common';
import { getField, getObjectType } from './test-helpers';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';

test('auth transformer validation happy case', () => {
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [],
  };
  const validSchema = `
    type Post @model @auth(rules: [{allow: owner}]) {
      id: ID!
      title: String!
      createdAt: String
      updatedAt: String
    }`;
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [
      new ModelTransformer(),
      new AuthTransformer({
        authConfig,
        addAwsIamAuthInOutputSchema: false,
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual(
    'AMAZON_COGNITO_USER_POOLS',
  );
});

test('ownerfield with subscriptions', () => {
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [],
  };
  const validSchema = `
    type Post @model @auth(rules: [
        {allow: owner, ownerField: "postOwner"}
    ]){
      id: ID!
      title: String
      postOwner: String
    }`;
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [
      new ModelTransformer(),
      new AuthTransformer({
        authConfig,
        addAwsIamAuthInOutputSchema: false,
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  // expect 'postOwner' as an argument for subscription operations
  expect(out.schema).toContain('onCreatePost(postOwner: String)');
  expect(out.schema).toContain('onUpdatePost(postOwner: String)');
  expect(out.schema).toContain('onDeletePost(postOwner: String)');

  // expect logic in the resolvers to check for postOwner args as an allowed owner
  expect(out.pipelineFunctions['Subscription.onCreatePost.auth.1.req.vtl']).toContain(
    '#set( $ownerEntity0 = $util.defaultIfNull($ctx.args.postOwner, null) )',
  );
  expect(out.pipelineFunctions['Subscription.onUpdatePost.auth.1.req.vtl']).toContain(
    '#set( $ownerEntity0 = $util.defaultIfNull($ctx.args.postOwner, null) )',
  );
  expect(out.pipelineFunctions['Subscription.onDeletePost.auth.1.req.vtl']).toContain(
    '#set( $ownerEntity0 = $util.defaultIfNull($ctx.args.postOwner, null) )',
  );
});

test('multiple owner rules with subscriptions', () => {
  const validSchema = `
        type Post @model
            @auth(rules: [
              { allow: owner },
              { allow: owner, ownerField: "editor", operations: [read, update] }
            ])
        {
            id: ID!
            title: String
            owner: String
            editor: String
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
      new AuthTransformer({
        authConfig,
        addAwsIamAuthInOutputSchema: false,
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  // expect 'owner' and 'editors' as arguments for subscription operations
  expect(out.schema).toContain('onCreatePost(owner: String, editor: String)');
  expect(out.schema).toContain('onUpdatePost(owner: String, editor: String)');
  expect(out.schema).toContain('onDeletePost(owner: String, editor: String)');

  // expect logic in the resolvers to check for owner args as an allowedOwner
  expect(out.pipelineFunctions['Subscription.onCreatePost.auth.1.req.vtl']).toContain(
    '#set( $ownerEntity0 = $util.defaultIfNull($ctx.args.owner, null) )',
  );
  expect(out.pipelineFunctions['Subscription.onUpdatePost.auth.1.req.vtl']).toContain(
    '#set( $ownerEntity0 = $util.defaultIfNull($ctx.args.owner, null) )',
  );
  expect(out.pipelineFunctions['Subscription.onDeletePost.auth.1.req.vtl']).toContain(
    '#set( $ownerEntity0 = $util.defaultIfNull($ctx.args.owner, null) )',
  );

  // expect logic in the resolvers to check for editor args as an allowedOwner
  expect(out.pipelineFunctions['Subscription.onCreatePost.auth.1.req.vtl']).toContain(
    '#set( $ownerEntity1 = $util.defaultIfNull($ctx.args.editor, null) )',
  );
  expect(out.pipelineFunctions['Subscription.onUpdatePost.auth.1.req.vtl']).toContain(
    '#set( $ownerEntity1 = $util.defaultIfNull($ctx.args.editor, null) )',
  );
  expect(out.pipelineFunctions['Subscription.onDeletePost.auth.1.req.vtl']).toContain(
    '#set( $ownerEntity1 = $util.defaultIfNull($ctx.args.editor, null) )',
  );
});

test('implicit owner fields get added to the type', () => {
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
      new AuthTransformer({
        authConfig,
        addAwsIamAuthInOutputSchema: false,
      }),
    ],
  });
  const validSchema = `
  type Post @model
            @auth(rules: [
                {allow: owner, ownerField: "postOwner"}
                { allow: owner, ownerField: "customOwner", identityClaim: "sub"}
            ])
        {
            id: ID!
            title: String
        }
  `;
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  const schema = parse(out.schema);
  const postType = getObjectType(schema, 'Post');
  expect(postType).toBeDefined();

  const postOwnerField = getField(postType, 'postOwner');
  expect(postOwnerField).toBeDefined();
  expect((postOwnerField as any).type.name.value).toEqual('String');

  const customOwner = getField(postType, 'customOwner');
  expect(customOwner).toBeDefined();
  expect((customOwner as any).type.name.value).toEqual('String');
});

test('implicit owner fields from field level auth get added to the type', () => {
  const validSchema = `
        type Post @model
        {
            id: ID
            title: String
            protectedField: String @auth(rules: [
                {allow: owner, ownerField: "postOwner"}
                { allow: owner, ownerField: "customOwner", identityClaim: "sub"}
            ])
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
      new AuthTransformer({
        authConfig,
        addAwsIamAuthInOutputSchema: false,
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  const postType = getObjectType(schema, 'Post');
  expect(postType).toBeDefined();

  const postOwnerField = getField(postType, 'postOwner');
  expect(postOwnerField).toBeDefined();
  expect((postOwnerField as any).type.name.value).toEqual('String');

  const customOwner = getField(postType, 'customOwner');
  expect(customOwner).toBeDefined();
  expect((customOwner as any).type.name.value).toEqual('String');
});
