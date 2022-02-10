import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import path from 'path';

const featureFlags = {
  getBoolean: jest.fn(),
  getNumber: jest.fn(),
  getObject: jest.fn(),
  getString: jest.fn(),
};

describe('ModelTransformer: ', () => {
  it('should override  model objects when given override config', () => {
    const validSchema = `
      type Post @model {
        id: ID!
        comments: [Comment]
      }
      type Comment @model{
        id: String!
        text: String!
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      overrideConfig: {
        overrideDir: path.join(__dirname, 'overrides'),
        overrideFlag: true,
        resourceName: 'myResource',
      },
      featureFlags,
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    const postStack = out.stacks.Post;
    const commentStack = out.stacks.Comment;

    expect(postStack).toMatchSnapshot();
    expect(commentStack).toMatchSnapshot();
  });
});
