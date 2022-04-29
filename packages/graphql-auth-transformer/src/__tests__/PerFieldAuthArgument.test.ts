import { GraphQLTransform } from 'graphql-transformer-core';
import { ResourceConstants } from 'graphql-transformer-common';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { ModelConnectionTransformer } from 'graphql-connection-transformer';
import { KeyTransformer } from 'graphql-key-transformer';
import { ModelAuthTransformer } from '../ModelAuthTransformer';
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
test('Test that subscriptions are only generated if the respective mutation operation exists', () => {
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
  // expect to generate subscription resolvers for create and update only
  expect(out).toBeDefined();
  expect(out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual(
    'AMAZON_COGNITO_USER_POOLS',
  );
  expect(out.resolvers['Salary.secret.res.vtl']).toContain('#if( $operation == "Mutation" )');
  expect(out.resolvers['Salary.secret.res.vtl']).toMatchSnapshot();

  expect(out.resolvers['Mutation.createSalary.res.vtl']).toContain('$util.qr($ctx.result.put("operation", "Mutation"))');
  expect(out.resolvers['Mutation.createSalary.res.vtl']).toMatchSnapshot();

  expect(out.resolvers['Mutation.updateSalary.res.vtl']).toContain('$util.qr($ctx.result.put("operation", "Mutation"))');
  expect(out.resolvers['Mutation.updateSalary.res.vtl']).toMatchSnapshot();

  expect(out.resolvers['Mutation.deleteSalary.res.vtl']).toContain('$util.qr($ctx.result.put("operation", "Mutation"))');
  expect(out.resolvers['Mutation.deleteSalary.res.vtl']).toMatchSnapshot();
});

test('Test per-field @auth on a @connection field', () => {
  const validSchema = `
    type Post
      @model
      @auth(rules: [
        { allow: groups, groups: ["admin"] }
        { allow: owner, ownerField: "moderator" }
      ])
    {
      id: ID!
      name: String!
      tags: [Tag]
        @connection(keyName: "byTags", fields: ["id"])
        @auth(rules: [ { allow: groups, groups: ["admin"] } ])
    }
    type Tag
      @model
      @key(name: "byTags", fields: ["postID"])
      @auth(rules: [ { allow: groups, groups: ["admin"] } ])
    {
      id: ID!
      postID: ID!
      post: Post @connection(fields: ["postID"])
      createdAt: AWSDateTime
      updatedAt: AWSDateTime
    }
  `;
  const transformer = new GraphQLTransform({
    featureFlags,
    transformers: [
      new DynamoDBModelTransformer(),
      new KeyTransformer(),
      new ModelConnectionTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'AMAZON_COGNITO_USER_POOLS',
          },
          additionalAuthenticationProviders: [{ authenticationType: 'AWS_IAM' }],
        },
      }),
    ],
  });

  try {
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();

    const resolvers = out.resolvers;
    expect(resolvers['Tag.post.res.vtl']).toMatchSnapshot();
    expect(resolvers['Tag.post.res.vtl']).toContain('$util.toJson($ctx.result)');
  } catch (err) {
    throw err;
  }
});

test('Test per-field @auth without model', () => {
  const validSchema = `
    type Query {
      listContext: String @auth(rules: [{ allow: groups, groups: ["Allowed"] }, { allow: private, provider: iam }])
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
          additionalAuthenticationProviders: [
            {
              authenticationType: 'AWS_IAM',
            },
          ],
        },
      }),
    ],
  });

  const out = transformer.transform(validSchema);

  expect(out).toBeDefined();
  const resources = out.rootStack.Resources;
  expect(resources['AuthRolePolicy01']).toMatchSnapshot();
  expect(out.resolvers['Query.listContext.req.vtl']).toContain('#if( $authMode == "userPools" )');
  expect(out.resolvers['Query.listContext.req.vtl']).toContain(
    '## Authorization rule: { allow: groups, groups: ["Allowed"], groupClaim: "cognito:groups" } **',
  );
  expect(out.resolvers['Query.listContext.req.vtl']).toMatchSnapshot();
});
