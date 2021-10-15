import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { HasManyTransformer } from '@aws-amplify/graphql-relational-transformer';
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
    transformers: [
      new ModelTransformer(),
      new HasManyTransformer(),
      new AuthTransformer({
        authConfig,
        addAwsIamAuthInOutputSchema: false,
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  // expect to generate subscription resolvers for create and update only
  expect(out).toBeDefined();
  expect(out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual(
    'AMAZON_COGNITO_USER_POOLS',
  );
  expect(out.pipelineFunctions['Salary.secret.res.vtl']).toContain('#if( $operation == "Mutation" )');

  expect(out.pipelineFunctions['Mutation.createSalary.res.vtl']).toContain('$util.qr($ctx.result.put("__operation", "Mutation"))');
  expect(out.pipelineFunctions['Mutation.updateSalary.res.vtl']).toContain('$util.qr($ctx.result.put("__operation", "Mutation"))');
  expect(out.pipelineFunctions['Mutation.deleteSalary.res.vtl']).toContain('$util.qr($ctx.result.put("__operation", "Mutation"))');
});

test('per-field auth on relational field', () => {
  const validSchema = `
  type Post @model @auth(rules: [ { allow: groups, groups: ["admin"] }, { allow: groups, groups: ["viewer"], operations: [read] } ]){
    id: ID!
    title: String!
    comments: [Comment] @hasMany @auth(rules: [ { allow: groups, groups: ["admin"] } ])
  }

  type Comment @model {
    id: ID!
    content: String
  }`;
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [{ authenticationType: 'AWS_IAM' }],
  };
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [
      new ModelTransformer(),
      new HasManyTransformer(),
      new AuthTransformer({
        authConfig,
        addAwsIamAuthInOutputSchema: false,
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  expect(out.pipelineFunctions['Post.comments.auth.1.req.vtl']).toContain(
    '#set( $staticGroupRoles = [{"claim":"cognito:groups","entity":"admin"}] )',
  );
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

  const resources = out.rootStack.Resources;
  const authPolicyIdx = Object.keys(out.rootStack.Resources).find(r => r.includes('AuthRolePolicy'));
  expect(resources[authPolicyIdx]).toMatchSnapshot();
  expect(out.pipelineFunctions['Query.listContext.req.vtl']).toContain(
    '#set( $staticGroupRoles = [{"claim":"cognito:groups","entity":"Allowed"}] )',
  );
});
