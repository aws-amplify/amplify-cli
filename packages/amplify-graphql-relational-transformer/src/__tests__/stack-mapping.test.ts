import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { BelongsToTransformer, HasManyTransformer } from '..';

describe('transformer stack mapping', () => {
  it('maps relational resolvers to specified stack', async () => {
    const inputSchema = /* GraphQL */ `
      type Blog @model {
        id: ID!
        name: String!
        posts: [Post] @hasMany
      }

      type Post @model {
        id: ID!
        title: String!
        blog: Blog @belongsTo
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new HasManyTransformer(), new BelongsToTransformer()],
      stackMapping: {
        BlogpostsResolver: 'myCustomStack1',
        PostblogResolver: 'myCustomStack2',
      },
    });

    const result = transformer.transform(inputSchema);
    expect(Object.keys(result.stacks['myCustomStack1'].Resources!).includes('BlogpostsResolver')).toBe(true);
    expect(Object.keys(result.stacks['myCustomStack2'].Resources!).includes('PostblogResolver')).toBe(true);
  });
});
