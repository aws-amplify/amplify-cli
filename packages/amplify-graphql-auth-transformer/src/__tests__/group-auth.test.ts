import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { IndexTransformer } from '@aws-amplify/graphql-index-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { ResourceConstants } from 'graphql-transformer-common';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import { AuthTransformer } from '../graphql-auth-transformer';

jest.mock('amplify-prompts');

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
  });
  const out = transformer.transform(validSchema);

  expect(out).toBeDefined();
  expect(out.rootStack!.Resources![ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual(
    'AMAZON_COGNITO_USER_POOLS',
  );

  expect(out.resolvers['Mutation.createPost.auth.1.req.vtl']).toContain('#if( $util.isString($groupClaim0) )');
  expect(out.resolvers['Mutation.createPost.auth.1.req.vtl']).toContain('#if( $util.isList($util.parseJson($groupClaim0)) )');
  expect(out.resolvers['Mutation.createPost.auth.1.req.vtl']).toContain('#set( $groupClaim0 = $util.parseJson($groupClaim0) )');
  expect(out.resolvers['Mutation.createPost.auth.1.req.vtl']).toContain('#set( $groupClaim0 = [$groupClaim0] )');

  expect(out.resolvers['Mutation.updatePost.auth.1.res.vtl']).toContain('#if( $util.isString($groupClaim0) )');
  expect(out.resolvers['Mutation.updatePost.auth.1.res.vtl']).toContain('#if( $util.isList($util.parseJson($groupClaim0)) )');
  expect(out.resolvers['Mutation.updatePost.auth.1.res.vtl']).toContain('#set( $groupClaim0 = $util.parseJson($groupClaim0) )');
  expect(out.resolvers['Mutation.updatePost.auth.1.res.vtl']).toContain('#set( $groupClaim0 = [$groupClaim0] )');

  expect(out.resolvers['Mutation.deletePost.auth.1.res.vtl']).toContain('#if( $util.isString($groupClaim0) )');
  expect(out.resolvers['Mutation.deletePost.auth.1.res.vtl']).toContain('#if( $util.isList($util.parseJson($groupClaim0)) )');
  expect(out.resolvers['Mutation.deletePost.auth.1.res.vtl']).toContain('#set( $groupClaim0 = $util.parseJson($groupClaim0) )');
  expect(out.resolvers['Mutation.deletePost.auth.1.res.vtl']).toContain('#set( $groupClaim0 = [$groupClaim0] )');
});

test('\'groups\' @auth with dynamic groups and custom claim on index query', () => {
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [],
  };
  const validSchema = `
    type Post @model @auth(rules: [{allow: groups, groupsField: "group", groupClaim: "tenants"}]) {
        id: ID!
        title: String!
        userId: ID! @index(name: "byUser", queryField: "postsByUser")
        group: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new AuthTransformer(), new IndexTransformer()],
  });
  const out = transformer.transform(validSchema);

  expect(out).toBeDefined();
  expect(out.rootStack!.Resources![ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual(
    'AMAZON_COGNITO_USER_POOLS',
  );

  expect(out.resolvers['Query.listPosts.auth.1.req.vtl']).toContain('#if( $util.isString($role0) )');
  expect(out.resolvers['Query.listPosts.auth.1.req.vtl']).toContain('#if( $util.isList($util.parseJson($role0)) )');
  expect(out.resolvers['Query.listPosts.auth.1.req.vtl']).toContain('#set( $role0 = $util.parseJson($role0) )');
  expect(out.resolvers['Query.listPosts.auth.1.req.vtl']).toContain('#set( $role0 = [$role0] )');

  expect(out.resolvers['Post.postsByUser.auth.1.req.vtl']).toContain('#if( $util.isString($role0) )');
  expect(out.resolvers['Post.postsByUser.auth.1.req.vtl']).toContain('#if( $util.isList($util.parseJson($role0)) )');
  expect(out.resolvers['Post.postsByUser.auth.1.req.vtl']).toContain('#set( $role0 = $util.parseJson($role0) )');
  expect(out.resolvers['Post.postsByUser.auth.1.req.vtl']).toContain('#set( $role0 = [$role0] )');
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
  });
  expect(() => transformer.transform(invalidSchema)).toThrowError('@auth on Post does not have any auth rules.');
});

test('dynamic group auth generates authorized fields list correctly', () => {
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [],
  };
  const schema = /* GraphQL */ `
    type Todo @model(subscriptions: { level: off }) {
      id: ID! @auth(rules: [{ allow: groups, groupsField: "allowedGroups", operations: [read, update], provider: userPools }])
      name: String!
      description: String @auth(rules: [{ allow: groups, groupsField: "allowedGroups", operations: [read, update], provider: userPools }])
      allowedGroups: [String]
    }
  `;
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new AuthTransformer()],
  });
  const result = transformer.transform(schema);
  // ideally this could be a more specific test rather than a big snapshot test
  // the part we are looking for here is that the allowedFields and nullAllowedFields are set to
  // groupAllowedFields0 and groupNullAllowedFields0, respectively.
  // a more targeted test would require some bigger refactoring
  expect(result.resolvers['Mutation.updateTodo.auth.1.res.vtl']).toMatchInlineSnapshot(`
    "## [Start] Authorization Steps. **
    $util.qr($ctx.stash.put(\\"hasAuth\\", true))
    #if( $ctx.error )
      $util.error($ctx.error.message, $ctx.error.type)
    #end
    #set( $inputFields = $util.parseJson($util.toJson($ctx.args.input.keySet())) )
    #set( $isAuthorized = false )
    #set( $allowedFields = [] )
    #set( $nullAllowedFields = [] )
    #set( $deniedFields = {} )
    #if( $util.authType() == \\"User Pool Authorization\\" )
      #if( !$isAuthorized )
        #set( $groupEntity0 = $util.defaultIfNull($ctx.result.allowedGroups, []) )
        #set( $groupClaim0 = $util.defaultIfNull($ctx.identity.claims.get(\\"cognito:groups\\"), []) )
        #set( $groupAllowedFields0 = [\\"id\\",\\"description\\"] )
        #set( $groupNullAllowedFields0 = [] )
        #set( $isAuthorizedOnAllFields0 = false )
        #if( $util.isString($groupClaim0) )
          #if( $util.isList($util.parseJson($groupClaim0)) )
            #set( $groupClaim0 = $util.parseJson($groupClaim0) )
          #else
            #set( $groupClaim0 = [$groupClaim0] )
          #end
        #end
        #foreach( $userGroup in $groupClaim0 )
          #if( $groupEntity0.contains($userGroup) )
            #if( $isAuthorizedOnAllFields0 )
              #set( $isAuthorized = true )
              #break
            #else
              $util.qr($allowedFields.addAll($groupAllowedFields0))
              $util.qr($nullAllowedFields.addAll($groupNullAllowedFields0))
            #end
          #end
        #end
      #end
    #end
    #if( !$isAuthorized && $allowedFields.isEmpty() && $nullAllowedFields.isEmpty() )
    $util.unauthorized()
    #end
    #if( !$isAuthorized )
      #foreach( $entry in $util.map.copyAndRetainAllKeys($ctx.args.input, $inputFields).entrySet() )
        #if( $util.isNull($entry.value) && !$nullAllowedFields.contains($entry.key) )
          $util.qr($deniedFields.put($entry.key, \\"\\"))
        #end
      #end
      #foreach( $deniedField in $util.list.copyAndRemoveAll($inputFields, $allowedFields) )
        $util.qr($deniedFields.put($deniedField, \\"\\"))
      #end
    #end
    #if( $deniedFields.keySet().size() > 0 )
      $util.error(\\"Unauthorized on \${deniedFields.keySet()}\\", \\"Unauthorized\\")
    #end
    $util.toJson({})
    ## [End] Authorization Steps. **"
  `);
});
