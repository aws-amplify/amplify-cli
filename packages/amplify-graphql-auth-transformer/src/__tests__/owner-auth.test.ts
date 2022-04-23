import { parse } from 'graphql';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { PrimaryKeyTransformer, IndexTransformer } from '@aws-amplify/graphql-index-transformer';
import { GraphQLTransform, validateModelSchema } from '@aws-amplify/graphql-transformer-core';
import { ResourceConstants } from 'graphql-transformer-common';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import { HasManyTransformer } from '@aws-amplify/graphql-relational-transformer';
import { AuthTransformer } from '../graphql-auth-transformer';
import { getField, getObjectType, featureFlags } from './test-helpers';

jest.mock('amplify-prompts');

describe('owner based @auth', () => {
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
      transformers: [new ModelTransformer(), new AuthTransformer()],
      featureFlags,
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    expect(out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual(
      'AMAZON_COGNITO_USER_POOLS',
    );
  });

  test('owner field where the field is a list', () => {
    const authConfig: AppSyncAuthConfiguration = {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    };
    const validSchema = `
      type Post @model @auth(rules: [{allow: owner, ownerField: "editors" }]) {
        id: ID!
        title: String!
        editors: [String]
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
    expect(out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual(
      'AMAZON_COGNITO_USER_POOLS',
    );
    expect(out.resolvers['Mutation.createPost.auth.1.req.vtl']).toMatchSnapshot();
    expect(out.resolvers['Mutation.updatePost.auth.1.req.vtl']).toMatchSnapshot();
    expect(out.resolvers['Mutation.deletePost.auth.1.req.vtl']).toMatchSnapshot();
    expect(out.resolvers['Query.getPost.auth.1.req.vtl']).toMatchSnapshot();
    expect(out.resolvers['Query.listPosts.auth.1.req.vtl']).toMatchSnapshot();
  });

  test('owner where field is "::" delimited string', () => {
    const authConfig: AppSyncAuthConfiguration = {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    };
    const validSchema = `
    type Post @model @auth(rules: [{allow: owner, identityClaim: "sub::username" }]) {
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
    expect(out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual(
      'AMAZON_COGNITO_USER_POOLS',
    );
    expect(out.resolvers['Mutation.createPost.auth.1.req.vtl']).toMatchSnapshot();
    expect(out.resolvers['Mutation.updatePost.auth.1.req.vtl']).toMatchSnapshot();
    expect(out.resolvers['Mutation.deletePost.auth.1.req.vtl']).toMatchSnapshot();
    expect(out.resolvers['Query.getPost.auth.1.req.vtl']).toMatchSnapshot();
    expect(out.resolvers['Query.listPosts.auth.1.req.vtl']).toMatchSnapshot();
  });

  test('owner field with subscriptions', () => {
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
      transformers: [new ModelTransformer(), new AuthTransformer()],
      featureFlags,
    });

    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();

    // expect 'postOwner' as an argument for subscription operations
    expect(out.schema).toContain('onCreatePost(postOwner: String)');
    expect(out.schema).toContain('onUpdatePost(postOwner: String)');
    expect(out.schema).toContain('onDeletePost(postOwner: String)');

    // expect logic in the resolvers to check for postOwner args as an allowed owner
    expect(out.resolvers['Subscription.onCreatePost.auth.1.req.vtl']).toContain(
      '#set( $ownerEntity0 = $util.defaultIfNull($ctx.args.postOwner, null) )',
    );
    expect(out.resolvers['Subscription.onUpdatePost.auth.1.req.vtl']).toContain(
      '#set( $ownerEntity0 = $util.defaultIfNull($ctx.args.postOwner, null) )',
    );
    expect(out.resolvers['Subscription.onDeletePost.auth.1.req.vtl']).toContain(
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
      transformers: [new ModelTransformer(), new AuthTransformer()],
      featureFlags,
    });

    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();

    // expect 'owner' and 'editors' as arguments for subscription operations
    expect(out.schema).toContain('onCreatePost(owner: String, editor: String)');
    expect(out.schema).toContain('onUpdatePost(owner: String, editor: String)');
    expect(out.schema).toContain('onDeletePost(owner: String, editor: String)');

    // expect logic in the resolvers to check for owner args as an allowedOwner
    expect(out.resolvers['Subscription.onCreatePost.auth.1.req.vtl']).toContain(
      '#set( $ownerEntity0 = $util.defaultIfNull($ctx.args.owner, null) )',
    );
    expect(out.resolvers['Subscription.onUpdatePost.auth.1.req.vtl']).toContain(
      '#set( $ownerEntity0 = $util.defaultIfNull($ctx.args.owner, null) )',
    );
    expect(out.resolvers['Subscription.onDeletePost.auth.1.req.vtl']).toContain(
      '#set( $ownerEntity0 = $util.defaultIfNull($ctx.args.owner, null) )',
    );

    // expect logic in the resolvers to check for editor args as an allowedOwner
    expect(out.resolvers['Subscription.onCreatePost.auth.1.req.vtl']).toContain(
      '#set( $ownerEntity1 = $util.defaultIfNull($ctx.args.editor, null) )',
    );
    expect(out.resolvers['Subscription.onUpdatePost.auth.1.req.vtl']).toContain(
      '#set( $ownerEntity1 = $util.defaultIfNull($ctx.args.editor, null) )',
    );
    expect(out.resolvers['Subscription.onDeletePost.auth.1.req.vtl']).toContain(
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
      transformers: [new ModelTransformer(), new AuthTransformer()],
      featureFlags,
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

    const customOwner = getField(postType, 'customOwner');
    expect(customOwner).toBeDefined();

    /* eslint-disable @typescript-eslint/no-explicit-any */
    expect((postOwnerField as any).type.name.value).toEqual('String');
    expect((customOwner as any).type.name.value).toEqual('String');
    /* eslint-enable */
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
      transformers: [new ModelTransformer(), new AuthTransformer()],
      featureFlags,
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    const schema = parse(out.schema);
    const postType = getObjectType(schema, 'Post');
    expect(postType).toBeDefined();

    const postOwnerField = getField(postType, 'postOwner');
    expect(postOwnerField).toBeDefined();

    const customOwner = getField(postType, 'customOwner');
    expect(customOwner).toBeDefined();

    /* eslint-disable @typescript-eslint/no-explicit-any */
    expect((postOwnerField as any).type.name.value).toEqual('String');
    expect((customOwner as any).type.name.value).toEqual('String');
    /* eslint-enable */
  });

  test('owner fields on primaryKey create auth filter for scan operation', () => {
    const validSchema = `
    type FamilyMember @model @auth(rules: [
      {allow: owner, ownerField: "parent", identityClaim: "sub", operations: [read] },
      {allow: owner, ownerField: "child", identityClaim: "sub", operations: [read] }
    ]){
      parent: ID! @primaryKey(sortKeyFields: ["child"]) @index(name: "byParent", queryField: "byParent")
      child: ID! @index(name: "byChild", queryField: "byChild")
      createdAt: AWSDateTime
      updatedAt: AWSDateTime
    }`;
    const authConfig: AppSyncAuthConfiguration = {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    };
    const transformer = new GraphQLTransform({
      authConfig,
      featureFlags: {
        getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
          if (name === 'secondaryKeyAsGSI') {
            return true;
          }
          if (name === 'useSubUsernameForDefaultIdentityClaim') {
            return true;
          }
          return defaultValue;
        }),
        getNumber: jest.fn(),
        getObject: jest.fn(),
        getString: jest.fn(),
      },
      transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new IndexTransformer(), new AuthTransformer()],
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    const schema = parse(out.schema);
    const familyMemberType = getObjectType(schema, 'FamilyMember');
    expect(familyMemberType).toBeDefined();

    // use double type as it's non-null
    const parentOwnerField = getField(familyMemberType, 'parent');
    expect(parentOwnerField).toBeDefined();

    const childOwnerField = getField(familyMemberType, 'child');
    expect(childOwnerField).toBeDefined();

    /* eslint-disable @typescript-eslint/no-explicit-any */
    expect((parentOwnerField as any).type.type.name.value).toEqual('ID');
    expect((childOwnerField as any).type.type.name.value).toEqual('ID');
    /* eslint-enable */

    expect(out.resolvers['Query.listFamilyMembers.auth.1.req.vtl']).toMatchSnapshot();
  });

  test('@auth on relational schema with LSI and GSI', () => {
    const inputSchema = `
      type User @model
        @auth(rules: [
          {allow: owner, ownerField: "sub", identityClaim: "sub"}
        ]) {
          sub: String! @primaryKey
          following: [Follow]! @hasMany(indexName: "byFollower", fields: ["sub"])
          followers: [Follow]! @hasMany(indexName: "byFollowed", fields: ["sub"])
      }

      type Follow
        @model
        @auth(rules: [
          {allow: owner, ownerField: "ownerSub", identityClaim: "sub"}
        ]) {
        ownerSub: String!
          @primaryKey(sortKeyFields: ["followed_sub"])
          @index(name: "byFollower", sortKeyFields: ["createdAt"])

        followed_sub: String! @index(name: "byFollowed", sortKeyFields: ["createdAt"])
        createdAt: AWSDateTime!
      }
    `;

    const authConfig: AppSyncAuthConfiguration = {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    };

    const transformer = new GraphQLTransform({
      authConfig,
      featureFlags: {
        getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
          if (name === 'secondaryKeyAsGSI') {
            return false;
          }
          if (name === 'useSubUsernameForDefaultIdentityClaim') {
            return true;
          }
          return defaultValue;
        }),
        getNumber: jest.fn(),
        getObject: jest.fn(),
        getString: jest.fn(),
      },
      transformers: [
        new ModelTransformer(),
        new HasManyTransformer(),
        new IndexTransformer(),
        new PrimaryKeyTransformer(),
        new AuthTransformer(),
      ],
    });

    const out = transformer.transform(inputSchema);
    expect(out).toBeDefined();
    const schema = parse(out.schema);
    validateModelSchema(schema);
  });

  test('@auth on schema with LSI and GSI', () => {
    const inputSchema = `
      type Model @model @auth(rules: [{allow: public, provider: apiKey}]) {
        user: String! @primaryKey(sortKeyFields: ["channel", "token", "secret"]) @index(name: "byUser", queryField: "listModelsByUser", sortKeyFields: ["channel"])
        channel: String! @index(name: "byChannel", queryField: "listModelsByChannel", sortKeyFields: ["user"])
        token: String!
        secret: String!
      }
    `;

    const authConfig: AppSyncAuthConfiguration = {
      defaultAuthentication: {
        authenticationType: 'API_KEY',
      },
      additionalAuthenticationProviders: [],
    };

    const transformer = new GraphQLTransform({
      authConfig,
      featureFlags: {
        getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
          if (name === 'secondaryKeyAsGSI') {
            return false;
          }
          if (name === 'useSubUsernameForDefaultIdentityClaim') {
            return true;
          }
          return defaultValue;
        }),
        getNumber: jest.fn(),
        getObject: jest.fn(),
        getString: jest.fn(),
      },
      transformers: [
        new ModelTransformer(),
        new HasManyTransformer(),
        new IndexTransformer(),
        new PrimaryKeyTransformer(),
        new AuthTransformer(),
      ],
    });

    const out = transformer.transform(inputSchema);
    expect(out).toBeDefined();
    const schema = parse(out.schema);
    validateModelSchema(schema);
  });

  test('owner field with custom cognito field', () => {
    const authConfig: AppSyncAuthConfiguration = {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    };
    const validSchema = `
    type Post @model @auth(rules: [{allow: owner, identityClaim: "custom:my_field" }]) {
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
    expect(out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual(
      'AMAZON_COGNITO_USER_POOLS',
    );
    expect(out.resolvers['Mutation.createPost.auth.1.req.vtl']).toMatchSnapshot();
    expect(out.resolvers['Mutation.updatePost.auth.1.req.vtl']).toMatchSnapshot();
    expect(out.resolvers['Mutation.deletePost.auth.1.req.vtl']).toMatchSnapshot();
    expect(out.resolvers['Query.getPost.auth.1.req.vtl']).toMatchSnapshot();
    expect(out.resolvers['Query.listPosts.auth.1.req.vtl']).toMatchSnapshot();
  });

  describe('with identity claim feature flag disabled', () => {
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
        transformers: [new ModelTransformer(), new AuthTransformer()],
        featureFlags: {
          ...featureFlags,
          ...{ getBoolean: () => false },
        },
      });
      const out = transformer.transform(validSchema);
      expect(out).toBeDefined();
      expect(out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual(
        'AMAZON_COGNITO_USER_POOLS',
      );
    });

    test('owner field where the field is a list', () => {
      const authConfig: AppSyncAuthConfiguration = {
        defaultAuthentication: {
          authenticationType: 'AMAZON_COGNITO_USER_POOLS',
        },
        additionalAuthenticationProviders: [],
      };
      const validSchema = `
        type Post @model @auth(rules: [{allow: owner, ownerField: "editors" }]) {
          id: ID!
          title: String!
          editors: [String]
          createdAt: String
          updatedAt: String
        }`;
      const transformer = new GraphQLTransform({
        authConfig,
        transformers: [new ModelTransformer(), new AuthTransformer()],
        featureFlags: {
          ...featureFlags,
          ...{ getBoolean: () => false },
        },
      });
      const out = transformer.transform(validSchema);
      expect(out).toBeDefined();
      expect(out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual(
        'AMAZON_COGNITO_USER_POOLS',
      );
      expect(out.resolvers['Mutation.createPost.auth.1.req.vtl']).toMatchSnapshot();
      expect(out.resolvers['Mutation.updatePost.auth.1.req.vtl']).toMatchSnapshot();
      expect(out.resolvers['Mutation.deletePost.auth.1.req.vtl']).toMatchSnapshot();
      expect(out.resolvers['Query.getPost.auth.1.req.vtl']).toMatchSnapshot();
      expect(out.resolvers['Query.listPosts.auth.1.req.vtl']).toMatchSnapshot();
    });

    test('owner where field is "::" delimited string', () => {
      const authConfig: AppSyncAuthConfiguration = {
        defaultAuthentication: {
          authenticationType: 'AMAZON_COGNITO_USER_POOLS',
        },
        additionalAuthenticationProviders: [],
      };
      const validSchema = `
        type Post @model @auth(rules: [{allow: owner, identityClaim: "sub::username" }]) {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
        }`;
      const transformer = new GraphQLTransform({
        authConfig,
        transformers: [new ModelTransformer(), new AuthTransformer()],
        featureFlags: {
          ...featureFlags,
          ...{ getBoolean: () => false },
        },
      });
      const out = transformer.transform(validSchema);
      expect(out).toBeDefined();
      expect(out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual(
        'AMAZON_COGNITO_USER_POOLS',
      );
      expect(out.resolvers['Mutation.createPost.auth.1.req.vtl']).toMatchSnapshot();
      expect(out.resolvers['Mutation.updatePost.auth.1.req.vtl']).toMatchSnapshot();
      expect(out.resolvers['Mutation.deletePost.auth.1.req.vtl']).toMatchSnapshot();
      expect(out.resolvers['Query.getPost.auth.1.req.vtl']).toMatchSnapshot();
      expect(out.resolvers['Query.listPosts.auth.1.req.vtl']).toMatchSnapshot();
    });

    test('owner field with subscriptions', () => {
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
        transformers: [new ModelTransformer(), new AuthTransformer()],
        featureFlags: {
          ...featureFlags,
          ...{ getBoolean: () => false },
        },
      });
      const out = transformer.transform(validSchema);
      expect(out).toBeDefined();

      // expect 'postOwner' as an argument for subscription operations
      expect(out.schema).toContain('onCreatePost(postOwner: String)');
      expect(out.schema).toContain('onUpdatePost(postOwner: String)');
      expect(out.schema).toContain('onDeletePost(postOwner: String)');

      // expect logic in the resolvers to check for postOwner args as an allowed owner
      expect(out.resolvers['Subscription.onCreatePost.auth.1.req.vtl']).toContain(
        '#set( $ownerEntity0 = $util.defaultIfNull($ctx.args.postOwner, null) )',
      );
      expect(out.resolvers['Subscription.onUpdatePost.auth.1.req.vtl']).toContain(
        '#set( $ownerEntity0 = $util.defaultIfNull($ctx.args.postOwner, null) )',
      );
      expect(out.resolvers['Subscription.onDeletePost.auth.1.req.vtl']).toContain(
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
        transformers: [new ModelTransformer(), new AuthTransformer()],
        featureFlags: {
          ...featureFlags,
          ...{ getBoolean: () => false },
        },
      });
      const out = transformer.transform(validSchema);
      expect(out).toBeDefined();

      // expect 'owner' and 'editors' as arguments for subscription operations
      expect(out.schema).toContain('onCreatePost(owner: String, editor: String)');
      expect(out.schema).toContain('onUpdatePost(owner: String, editor: String)');
      expect(out.schema).toContain('onDeletePost(owner: String, editor: String)');

      // expect logic in the resolvers to check for owner args as an allowedOwner
      expect(out.resolvers['Subscription.onCreatePost.auth.1.req.vtl']).toContain(
        '#set( $ownerEntity0 = $util.defaultIfNull($ctx.args.owner, null) )',
      );
      expect(out.resolvers['Subscription.onUpdatePost.auth.1.req.vtl']).toContain(
        '#set( $ownerEntity0 = $util.defaultIfNull($ctx.args.owner, null) )',
      );
      expect(out.resolvers['Subscription.onDeletePost.auth.1.req.vtl']).toContain(
        '#set( $ownerEntity0 = $util.defaultIfNull($ctx.args.owner, null) )',
      );

      // expect logic in the resolvers to check for editor args as an allowedOwner
      expect(out.resolvers['Subscription.onCreatePost.auth.1.req.vtl']).toContain(
        '#set( $ownerEntity1 = $util.defaultIfNull($ctx.args.editor, null) )',
      );
      expect(out.resolvers['Subscription.onUpdatePost.auth.1.req.vtl']).toContain(
        '#set( $ownerEntity1 = $util.defaultIfNull($ctx.args.editor, null) )',
      );
      expect(out.resolvers['Subscription.onDeletePost.auth.1.req.vtl']).toContain(
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
        transformers: [new ModelTransformer(), new AuthTransformer()],
        featureFlags: {
          ...featureFlags,
          ...{ getBoolean: () => false },
        },
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

      const customOwner = getField(postType, 'customOwner');
      expect(customOwner).toBeDefined();

      /* eslint-disable @typescript-eslint/no-explicit-any */
      expect((postOwnerField as any).type.name.value).toEqual('String');
      expect((customOwner as any).type.name.value).toEqual('String');
      /* eslint-enable */
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
        transformers: [new ModelTransformer(), new AuthTransformer()],
        featureFlags: {
          ...featureFlags,
          ...{ getBoolean: () => false },
        },
      });
      const out = transformer.transform(validSchema);
      expect(out).toBeDefined();
      const schema = parse(out.schema);
      const postType = getObjectType(schema, 'Post');
      expect(postType).toBeDefined();

      const postOwnerField = getField(postType, 'postOwner');
      expect(postOwnerField).toBeDefined();

      const customOwner = getField(postType, 'customOwner');
      expect(customOwner).toBeDefined();

      /* eslint-disable @typescript-eslint/no-explicit-any */
      expect((postOwnerField as any).type.name.value).toEqual('String');
      expect((customOwner as any).type.name.value).toEqual('String');
      /* eslint-enable */
    });

    test('owner fields on primaryKey create auth filter for scan operation', () => {
      const validSchema = `
      type FamilyMember @model @auth(rules: [
        {allow: owner, ownerField: "parent", identityClaim: "sub", operations: [read] },
        {allow: owner, ownerField: "child", identityClaim: "sub", operations: [read] }
      ]){
        parent: ID! @primaryKey(sortKeyFields: ["child"]) @index(name: "byParent", queryField: "byParent")
        child: ID! @index(name: "byChild", queryField: "byChild")
        createdAt: AWSDateTime
        updatedAt: AWSDateTime
      }`;
      const authConfig: AppSyncAuthConfiguration = {
        defaultAuthentication: {
          authenticationType: 'AMAZON_COGNITO_USER_POOLS',
        },
        additionalAuthenticationProviders: [],
      };
      const transformer = new GraphQLTransform({
        authConfig,
        featureFlags: {
          getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
            if (name === 'secondaryKeyAsGSI') {
              return true;
            }
            if (name === 'useSubUsernameForDefaultIdentityClaim') {
              return false;
            }
            return defaultValue;
          }),
          getNumber: jest.fn(),
          getObject: jest.fn(),
          getString: jest.fn(),
        },
        transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new IndexTransformer(), new AuthTransformer()],
      });
      const out = transformer.transform(validSchema);
      expect(out).toBeDefined();
      const schema = parse(out.schema);
      const familyMemberType = getObjectType(schema, 'FamilyMember');
      expect(familyMemberType).toBeDefined();

      // use double type as it's non-null
      const parentOwnerField = getField(familyMemberType, 'parent');
      expect(parentOwnerField).toBeDefined();

      const childOwnerField = getField(familyMemberType, 'child');
      expect(childOwnerField).toBeDefined();

      /* eslint-disable @typescript-eslint/no-explicit-any */
      expect((parentOwnerField as any).type.type.name.value).toEqual('ID');
      expect((childOwnerField as any).type.type.name.value).toEqual('ID');
      /* eslint-enable */

      expect(out.resolvers['Query.listFamilyMembers.auth.1.req.vtl']).toMatchSnapshot();
    });

    test('@auth on relational schema with LSI and GSI', () => {
      const inputSchema = `
        type User @model
          @auth(rules: [
            {allow: owner, ownerField: "sub", identityClaim: "sub"}
          ]) {
            sub: String! @primaryKey
            following: [Follow]! @hasMany(indexName: "byFollower", fields: ["sub"])
            followers: [Follow]! @hasMany(indexName: "byFollowed", fields: ["sub"])
        }

        type Follow
          @model
          @auth(rules: [
            {allow: owner, ownerField: "ownerSub", identityClaim: "sub"}
          ]) {
          ownerSub: String!
            @primaryKey(sortKeyFields: ["followed_sub"])
            @index(name: "byFollower", sortKeyFields: ["createdAt"])

          followed_sub: String! @index(name: "byFollowed", sortKeyFields: ["createdAt"])
          createdAt: AWSDateTime!
        }
      `;

      const authConfig: AppSyncAuthConfiguration = {
        defaultAuthentication: {
          authenticationType: 'AMAZON_COGNITO_USER_POOLS',
        },
        additionalAuthenticationProviders: [],
      };

      const transformer = new GraphQLTransform({
        authConfig,
        featureFlags: {
          getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
            if (name === 'secondaryKeyAsGSI') {
              return false;
            }
            if (name === 'useSubUsernameForDefaultIdentityClaim') {
              return false;
            }
            return defaultValue;
          }),
          getNumber: jest.fn(),
          getObject: jest.fn(),
          getString: jest.fn(),
        },
        transformers: [
          new ModelTransformer(),
          new HasManyTransformer(),
          new IndexTransformer(),
          new PrimaryKeyTransformer(),
          new AuthTransformer(),
        ],
      });

      const out = transformer.transform(inputSchema);
      expect(out).toBeDefined();
      const schema = parse(out.schema);
      validateModelSchema(schema);
    });

    test('@auth on schema with LSI and GSI', () => {
      const inputSchema = `
        type Model @model @auth(rules: [{allow: public, provider: apiKey}]) {
          user: String! @primaryKey(sortKeyFields: ["channel", "token", "secret"]) @index(name: "byUser", queryField: "listModelsByUser", sortKeyFields: ["channel"])
          channel: String! @index(name: "byChannel", queryField: "listModelsByChannel", sortKeyFields: ["user"])
          token: String!
          secret: String!
        }
      `;

      const authConfig: AppSyncAuthConfiguration = {
        defaultAuthentication: {
          authenticationType: 'API_KEY',
        },
        additionalAuthenticationProviders: [],
      };

      const transformer = new GraphQLTransform({
        authConfig,
        featureFlags: {
          getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
            if (name === 'secondaryKeyAsGSI') {
              return false;
            }
            if (name === 'useSubUsernameForDefaultIdentityClaim') {
              return false;
            }
            return defaultValue;
          }),
          getNumber: jest.fn(),
          getObject: jest.fn(),
          getString: jest.fn(),
        },
        transformers: [
          new ModelTransformer(),
          new HasManyTransformer(),
          new IndexTransformer(),
          new PrimaryKeyTransformer(),
          new AuthTransformer(),
        ],
      });

      const out = transformer.transform(inputSchema);
      expect(out).toBeDefined();
      const schema = parse(out.schema);
      validateModelSchema(schema);
    });
  });
});
