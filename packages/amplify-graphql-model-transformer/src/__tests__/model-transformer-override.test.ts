import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import path from 'path';

const featureFlags = {
  getBoolean: jest.fn(),
  getNumber: jest.fn(),
  getObject: jest.fn(),
  getString: jest.fn(),
};

const getVmSandbox = jest.fn();
jest.mock('@aws-amplify/cli-extensibility-helper', () => {
  return {
    getVmSandbox: () => getVmSandbox(),
  }
});

describe('ModelTransformer: ', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

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
    expect(getVmSandbox).toHaveBeenCalledTimes(1);
  });
});
