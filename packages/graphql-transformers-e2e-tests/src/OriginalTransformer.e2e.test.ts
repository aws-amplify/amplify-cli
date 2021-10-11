import { GraphQLTransform } from 'graphql-transformer-core';
import { ModelAuthTransformer } from '../../graphql-auth-transformer/lib';
import { ModelConnectionTransformer } from '../../graphql-connection-transformer/lib';
import { DynamoDBModelTransformer } from '../../graphql-dynamodb-transformer/lib';

describe('original directive', () => {
  const validSchema = `
  type NewTypeName @model @original(name: "OldTypeName") {
    id: ID!
    name: String!
  }
  `;
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new OriginalTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'API_KEY',
          },
          additionalAuthenticationProviders: [],
        },
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  it('uses original name name when naming DDB table', async () => {});
});
