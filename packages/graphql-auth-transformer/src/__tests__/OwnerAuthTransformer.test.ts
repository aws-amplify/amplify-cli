import { parse } from 'graphql';
import { FeatureFlagProvider, GraphQLTransform } from 'graphql-transformer-core';
import { ResourceConstants } from 'graphql-transformer-common';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { ModelAuthTransformer } from '../ModelAuthTransformer';
import { getObjectType, getField } from './test-helpers';
const featureFlags = {
  getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
    if (name === 'improvePluralization') {
      return true;
    }
    return;
  }),
  getNumber: jest.fn(),
  getObject: jest.fn(),
  getString: jest.fn(),
};

test('Test ModelAuthTransformer validation happy case', () => {
  const validSchema = `
    type Post @model @auth(rules: [{allow: owner}]) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    featureFlags,
    transformers: [
      new DynamoDBModelTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'AMAZON_COGNITO_USER_POOLS',
          },
          additionalAuthenticationProviders: [],
        },
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual(
    'AMAZON_COGNITO_USER_POOLS',
  );
});

test('Test OwnerField with Subscriptions', () => {
  const validSchema = `
        type Post @model
            @auth(rules: [
                {allow: owner, ownerField: "postOwner"}
            ])
        {
            id: ID!
            title: String
            postOwner: String
        }`;
  const transformer = new GraphQLTransform({
    featureFlags,
    transformers: [
      new DynamoDBModelTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'AMAZON_COGNITO_USER_POOLS',
          },
          additionalAuthenticationProviders: [],
        },
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  // expect 'postOwner' as an argument for subscription operations
  expect(out.schema).toContain('onCreatePost(postOwner: String!)');
  expect(out.schema).toContain('onUpdatePost(postOwner: String!)');
  expect(out.schema).toContain('onDeletePost(postOwner: String!)');

  // expect logic in the resolvers to check for postOwner args as an allowerOwner
  expect(out.resolvers['Subscription.onCreatePost.res.vtl']).toContain(
    '#set( $allowedOwners0 = $util.defaultIfNull($ctx.args.postOwner, null) )',
  );
  expect(out.resolvers['Subscription.onUpdatePost.res.vtl']).toContain(
    '#set( $allowedOwners0 = $util.defaultIfNull($ctx.args.postOwner, null) )',
  );
  expect(out.resolvers['Subscription.onDeletePost.res.vtl']).toContain(
    '#set( $allowedOwners0 = $util.defaultIfNull($ctx.args.postOwner, null) )',
  );
});

test('Test multiple owner rules with Subscriptions', () => {
  const validSchema = `
        type Post @model
            @auth(rules: [
              { allow: owner },
              { allow: owner, ownerField: "editors", operations: [read, update] }
            ])
        {
            id: ID!
            title: String
            owner: String
            editors: [String]
        }`;
  const transformer = new GraphQLTransform({
    featureFlags,
    transformers: [
      new DynamoDBModelTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'AMAZON_COGNITO_USER_POOLS',
          },
          additionalAuthenticationProviders: [],
        },
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  // expect 'owner' and 'editors' as arguments for subscription operations
  expect(out.schema).toContain('onCreatePost(owner: String, editors: String)');
  expect(out.schema).toContain('onUpdatePost(owner: String, editors: String)');
  expect(out.schema).toContain('onDeletePost(owner: String, editors: String)');

  // expect logic in the resolvers to check for owner args as an allowedOwner
  expect(out.resolvers['Subscription.onCreatePost.res.vtl']).toContain(
    '#set( $allowedOwners0 = $util.defaultIfNull($ctx.args.owner, null) )',
  );
  expect(out.resolvers['Subscription.onUpdatePost.res.vtl']).toContain(
    '#set( $allowedOwners0 = $util.defaultIfNull($ctx.args.owner, null) )',
  );
  expect(out.resolvers['Subscription.onDeletePost.res.vtl']).toContain(
    '#set( $allowedOwners0 = $util.defaultIfNull($ctx.args.owner, null) )',
  );

  // expect logic in the resolvers to check for editors args as an allowedOwner
  expect(out.resolvers['Subscription.onCreatePost.res.vtl']).toContain(
    '#set( $allowedOwners1 = $util.defaultIfNull($ctx.args.editors, null) )',
  );
  expect(out.resolvers['Subscription.onUpdatePost.res.vtl']).toContain(
    '#set( $allowedOwners1 = $util.defaultIfNull($ctx.args.editors, null) )',
  );
  expect(out.resolvers['Subscription.onDeletePost.res.vtl']).toContain(
    '#set( $allowedOwners1 = $util.defaultIfNull($ctx.args.editors, null) )',
  );
});

describe('add missing implicit owner fields to type', () => {
  let ff: FeatureFlagProvider;
  const runTransformer = (validSchema: string) => {
    return new GraphQLTransform({
      transformers: [
        new DynamoDBModelTransformer(),
        new ModelAuthTransformer({
          authConfig: {
            defaultAuthentication: {
              authenticationType: 'AMAZON_COGNITO_USER_POOLS',
            },
            additionalAuthenticationProviders: [],
          },
        }),
      ],
      featureFlags: ff,
    });
  };
  beforeEach(() => {
    ff = {
      getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
        if (name === 'addMissingOwnerFields') {
          return true;
        }
        if (name === 'improvePluralization') {
          return true;
        }
      }),
      getNumber: jest.fn(),
      getObject: jest.fn(),
      getString: jest.fn(),
    };
  });
  describe('object level', () => {
    let transformer;
    const validSchema = `
        type Post @model
            @auth(rules: [
                {allow: owner, ownerField: "postOwner"}
                { allow: owner, ownerField: "customOwner", identityClaim: "sub"}
            ])
        {
            id: ID!
            title: String
        }`;

    beforeEach(() => {
      transformer = runTransformer(validSchema);
    });

    test('Test implicit owner fields get added to the type when addMissingOwnerFields feature flag is set', () => {
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

    test('Test implicit owner fields does not get added to the type when addMissingOwnerFields feature flag is not set', () => {
      (ff.getBoolean as any).mockImplementation(() => false);
      const out = transformer.transform(validSchema);
      expect(out).toBeDefined();
      const schema = parse(out.schema);
      const postType = getObjectType(schema, 'Post');
      expect(postType).toBeDefined();

      const postOwnerField = getField(postType, 'postOwner');
      expect(postOwnerField).not.toBeDefined();

      const customOwner = getField(postType, 'customOwner');
      expect(customOwner).not.toBeDefined();
    });
  });

  describe('field level', () => {
    let transformer;
    const validSchema = `
        type Post @model
        {
            id: ID!
            title: String
            protectedField: String @auth(rules: [
                {allow: owner, ownerField: "postOwner"}
                { allow: owner, ownerField: "customOwner", identityClaim: "sub"}
            ])
        }`;
    beforeEach(() => {
      transformer = runTransformer(validSchema);
    });
    test('Test implicit owner fields from field level auth get added to the type when addMissingOwnerFields feature flag is set', () => {
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

    test('Test implicit owner fields from field level auth does not get added to the type when addMissingOwnerFields feature flag is not set', () => {
      (ff.getBoolean as any).mockImplementation(() => false);
      const out = transformer.transform(validSchema);
      expect(out).toBeDefined();
      const schema = parse(out.schema);
      const postType = getObjectType(schema, 'Post');
      expect(postType).toBeDefined();

      const postOwnerField = getField(postType, 'postOwner');
      expect(postOwnerField).not.toBeDefined();

      const customOwner = getField(postType, 'customOwner');
      expect(customOwner).not.toBeDefined();
    });
  });
});
