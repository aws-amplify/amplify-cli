import { AuthTransformer } from '../graphql-auth-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { ResourceConstants } from 'graphql-transformer-common';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';

test('subscriptions are only generated if the respective mutation operation exists', () => {
  const validSchema = `
      type Salary
        @model
        @auth(rules: [
                {allow: owner},
                {allow: groups, groups: ["Moderator"]}
            ]) {
        id: ID!
        wage: Int
        owner: String
        secret: String @auth(rules: [{allow: owner}])
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
  });
  const out = transformer.transform(validSchema);
  // expect to generate subscription resolvers for create and update only
  expect(out).toBeDefined();
  expect(out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual(
    'AMAZON_COGNITO_USER_POOLS',
  );
  expect(out.resolvers['Salary.secret.res.vtl']).toContain('#if( $operation == "Mutation" )');

  expect(out.resolvers['Mutation.createSalary.res.vtl']).toContain('$util.qr($ctx.result.put("__operation", "Mutation"))');
  expect(out.resolvers['Mutation.updateSalary.res.vtl']).toContain('$util.qr($ctx.result.put("__operation", "Mutation"))');
  expect(out.resolvers['Mutation.deleteSalary.res.vtl']).toContain('$util.qr($ctx.result.put("__operation", "Mutation"))');
});

test('per-field @auth without @model', () => {
  const validSchema = `
    type Query {
      listContext: String @auth(rules: [{ allow: groups, groups: ["Allowed"] }, { allow: private, provider: iam }])
    }`;
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [{ authenticationType: 'AWS_IAM' }],
  };
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new AuthTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  const resources = out.rootStack.Resources;
  const authPolicyIdx = Object.keys(out.rootStack.Resources).find(r => r.includes('AuthRolePolicy'));
  expect(resources[authPolicyIdx]).toMatchSnapshot();
  expect(out.resolvers['Query.listContext.req.vtl']).toContain(
    '#set( $staticGroupRoles = [{"claim":"cognito:groups","entity":"Allowed"}] )',
  );
});

test('error on non null fields which need resolvers', () => {
  const invalidSchema = `
    type Post @model @auth(rules: [{ allow: groups, groups: ["admin"] }]) {
      id: ID!
      name: String!
      ssn: String! @auth(rules: [{ allow: owner }])
    }
  `;
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [{ authenticationType: 'AWS_IAM' }],
  };
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new AuthTransformer()],
  });
  expect(() => transformer.transform(invalidSchema)).toThrowErrorMatchingSnapshot();
});

test('does not generate field resolvers when private rule takes precedence over provider-related rules', () => {
  const validSchema = `
  type Student @model @auth(rules: [{ allow: private, provider: userPools }, { allow: private, provider: iam }]) {
    id: ID!
    name: String!
    ssn: String @auth(rules: [{ allow: owner }])
  }`;

  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [{ authenticationType: 'AWS_IAM' }],
  };
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new AuthTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.resolvers['Student.ssn.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Student.ssn.res.vtl']).toMatchSnapshot();
  for (let field of ['id', 'name']) {
    expect(out.resolvers[`Student.${field}.req.vtl`]).toBeUndefined();
    expect(out.resolvers[`Student.${field}.res.vtl`]).toBeUndefined();
  }
});

test('generates field resolver for other provider rules even if private removes all provided-related rules', () => {
  const validSchema = `
  type Student @model @auth(rules: [{ allow: private, provider: userPools }]) {
    id: ID
    name: String
    ssn: String @auth(rules: [{ allow: owner }, { allow: private, provider: iam }])
  }`;

  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [{ authenticationType: 'AWS_IAM' }],
  };
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new AuthTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.resolvers['Student.ssn.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Student.ssn.res.vtl']).toMatchSnapshot();
  for (let field of ['id', 'name']) {
    expect(out.resolvers[`Student.${field}.req.vtl`]).toBeDefined();
    expect(out.resolvers[`Student.${field}.res.vtl`]).toBeDefined();
  }
});

describe('subscription disabled and userPools configured', () => {
  describe('with non-nullable (required) fields', () => {
    describe('top level private and field level owner auth', () => {
      test('generates field resolver for required field with expected owner claim', () => {
        const validSchema = `
          type Student
            @model(subscriptions: { level: off })
            @auth(rules: [
              { allow: private }
            ])
          {
            id: ID
            name: String
            ssn: String! @auth(rules: [{ allow: owner }])
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
        });
        const out = transformer.transform(validSchema);
        expect(out).toBeDefined();

        expect(out.resolvers['Student.ssn.req.vtl']).toMatchSnapshot();
        expect(out.resolvers['Student.ssn.req.vtl']).toContain(`#if( $util.authType() == "User Pool Authorization" )
  #if( !$isAuthorized )
    #set( $ownerEntity0 = $util.defaultIfNull($ctx.source.owner, null) )
    #set( $ownerClaim0 = $util.defaultIfNull($ctx.identity.claims.get("username"), $util.defaultIfNull($ctx.identity.claims.get("cognito:username"), "___xamznone____")) )
    #if( $ownerEntity0 == $ownerClaim0 )
      #set( $isAuthorized = true )
    #end
  #end
#end`);
      });
    });

    describe('top level private and field level group auth', () => {
      test('generates field resolver for required field with expected group role', () => {
        const validSchema = `
          type Student
            @model(subscriptions: { level: off })
            @auth(rules: [
              { allow: private }
            ])
          {
            id: ID
            name: String
            ssn: String! @auth(rules: [{ allow: groups, groups: ["admin"] }])
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
        });
        const out = transformer.transform(validSchema);
        expect(out).toBeDefined();

        expect(out.resolvers['Student.ssn.req.vtl']).toMatchSnapshot();
        expect(out.resolvers['Student.ssn.req.vtl']).toContain(`#if( $util.authType() == "User Pool Authorization" )
  #if( !$isAuthorized )
    #set( $staticGroupRoles = [{"claim":"cognito:groups","entity":"admin"}] )
    #foreach( $groupRole in $staticGroupRoles )
      #set( $groupsInToken = $util.defaultIfNull($ctx.identity.claims.get($groupRole.claim), []) )
      #if( $groupsInToken.contains($groupRole.entity) )
        #set( $isAuthorized = true )
        #break
      #end
    #end
  #end
#end`);
      });
    });
  });

  describe('with nullable fields', () => {
    describe('top level private and field level owner auth', () => {
      test('generates field resolver for field with expected owner claim', () => {
        const validSchema = `
          type Student
            @model(subscriptions: { level: off })
            @auth(rules: [
              { allow: private }
            ])
          {
            id: ID
            name: String
            ssn: String @auth(rules: [{ allow: owner }])
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
        });
        const out = transformer.transform(validSchema);
        expect(out).toBeDefined();

        expect(out.resolvers['Student.ssn.req.vtl']).toMatchSnapshot();
        expect(out.resolvers['Student.ssn.req.vtl']).toContain(`#if( $util.authType() == "User Pool Authorization" )
  #if( !$isAuthorized )
    #set( $ownerEntity0 = $util.defaultIfNull($ctx.source.owner, null) )
    #set( $ownerClaim0 = $util.defaultIfNull($ctx.identity.claims.get("username"), $util.defaultIfNull($ctx.identity.claims.get("cognito:username"), "___xamznone____")) )
    #if( $ownerEntity0 == $ownerClaim0 )
      #set( $isAuthorized = true )
    #end
  #end
#end`);
      });
    });

    describe('top level private and field level group auth', () => {
      test('generates field resolver for field with expected group roles', () => {
        const validSchema = `
          type Student
            @model(subscriptions: { level: off })
            @auth(rules: [
              { allow: private }
            ])
          {
            id: ID
            name: String
            ssn: String @auth(rules: [{ allow: groups, groups: ["admin"] }])
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
        });
        const out = transformer.transform(validSchema);
        expect(out).toBeDefined();

        expect(out.resolvers['Student.ssn.req.vtl']).toMatchSnapshot();
        expect(out.resolvers['Student.ssn.req.vtl']).toContain(`#if( $util.authType() == "User Pool Authorization" )
  #if( !$isAuthorized )
    #set( $staticGroupRoles = [{"claim":"cognito:groups","entity":"admin"}] )
    #foreach( $groupRole in $staticGroupRoles )
      #set( $groupsInToken = $util.defaultIfNull($ctx.identity.claims.get($groupRole.claim), []) )
      #if( $groupsInToken.contains($groupRole.entity) )
        #set( $isAuthorized = true )
        #break
      #end
    #end
  #end
#end`);
      });
    });
  });
});
