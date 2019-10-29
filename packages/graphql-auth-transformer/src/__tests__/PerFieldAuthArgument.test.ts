import { GraphQLTransform } from 'graphql-transformer-core';
import { ResourceConstants } from 'graphql-transformer-common';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { ModelAuthTransformer } from '../ModelAuthTransformer';

test('Test that subscriptions are only generated if the respective mutation operation exists', () => {
  const validSchema = `
    type Salary
        @model
        @auth(rules: [
                {allow: owner},
                {allow: groups, groups: ["Moderator"]}
            ])
    {
        id: ID!
        wage: Int
        owner: String
        secret: String @auth(rules: [{allow: owner}])
    }
    `;
  const transformer = new GraphQLTransform({
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
  // expect to generate subscription resolvers for create and update only
  expect(out).toBeDefined();
  expect(out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual(
    'AMAZON_COGNITO_USER_POOLS'
  );
  expect(out.resolvers['Salary.secret.res.vtl']).toContain('#if( $operation == "Mutation" )');
  expect(out.resolvers['Salary.secret.res.vtl']).toMatchSnapshot();

  expect(out.resolvers['Mutation.createSalary.res.vtl']).toContain('#set( $context.result.operation = "Mutation" )');
  expect(out.resolvers['Mutation.createSalary.res.vtl']).toMatchSnapshot();

  expect(out.resolvers['Mutation.updateSalary.res.vtl']).toContain('#set( $context.result.operation = "Mutation" )');
  expect(out.resolvers['Mutation.updateSalary.res.vtl']).toMatchSnapshot();

  expect(out.resolvers['Mutation.deleteSalary.res.vtl']).toContain('#set( $context.result.operation = "Mutation" )');
  expect(out.resolvers['Mutation.deleteSalary.res.vtl']).toMatchSnapshot();
});

test('Test per-field @auth without model', () => {
  const validSchema = `
    type Query {
      listContext: String @auth(rules: [{ allow: groups, groups: ["Allowed"] }])
    }
  `;

  const transformer = new GraphQLTransform({
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
  expect(out.resolvers['Query.listContext.req.vtl']).toContain(
    '## Authorization rule: { allow: groups, groups: ["Allowed"], groupClaim: "cognito:groups" } **'
  );
  expect(out.resolvers['Query.listContext.req.vtl']).toMatchSnapshot();
});
