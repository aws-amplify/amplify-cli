import {
  ObjectTypeDefinitionNode,
  parse,
  FieldDefinitionNode,
  DocumentNode,
  DefinitionNode,
  Kind,
  InputObjectTypeDefinitionNode,
} from 'graphql';
import { GraphQLTransform } from 'graphql-transformer-core';
import { ResourceConstants } from 'graphql-transformer-common';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { ModelAuthTransformer } from '../ModelAuthTransformer';

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
    'AMAZON_COGNITO_USER_POOLS'
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
    '#set( $allowedOwners0 = $util.defaultIfNull($ctx.args.postOwner, null) )'
  );
  expect(out.resolvers['Subscription.onUpdatePost.res.vtl']).toContain(
    '#set( $allowedOwners0 = $util.defaultIfNull($ctx.args.postOwner, null) )'
  );
  expect(out.resolvers['Subscription.onDeletePost.res.vtl']).toContain(
    '#set( $allowedOwners0 = $util.defaultIfNull($ctx.args.postOwner, null) )'
  );
});
