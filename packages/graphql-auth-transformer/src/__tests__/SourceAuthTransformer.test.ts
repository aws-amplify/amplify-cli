import { GraphQLTransform } from 'graphql-transformer-core';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { ModelAuthTransformer } from '../ModelAuthTransformer';
import { ResourceConstants } from 'graphql-transformer-common';
import { ModelConnectionTransformer } from 'graphql-connection-transformer';

test('@auth using source and sourceTypes', () => {
  const validSchema = `
    type User @model @auth(rules: [{allow: source, sourceTypes: ["Post"], operations: [read]}]) {
      name: String
        posts: [Post]
          @connection(name: "PostUser", keyField: "owner")
    }

    type Post @model {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
        user: User
          @connection(name: "PostUser", keyField: "owner")
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new ModelConnectionTransformer(),
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
    'AMAZON_COGNITO_USER_POOLS'
  );

  expect(out.resolvers['Post.user.res.vtl']).toMatchSnapshot();
  expect(out.resolvers['Post.user.res.vtl']).toContain('Authorization rule:');
});
