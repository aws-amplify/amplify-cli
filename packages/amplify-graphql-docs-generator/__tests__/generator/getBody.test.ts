import { GraphQLField, GraphQLSchema, GraphQLObjectType, GraphQLArgument, GraphQLString, GraphQLID } from 'graphql';

import getFields from '../../src/generator/getFields';
import { GQLTemplateOpBody, GQLTemplateArgInvocation, GQLTemplateField } from '../../src/generator/types';
import getBody from '../../src/generator/getBody';

jest.mock('../../src/generator/getFields');
const maxDepth = 2;

describe('getBody', () => {
  const arg: GraphQLArgument = {
    name: 'id',
    type: GraphQLID,
  };
  const blogArticle = new GraphQLObjectType({
    name: 'BlogArticle',
    fields: {
      id: { type: GraphQLID },
      content: { type: GraphQLString },
    },
  });

  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        article: {
          args: { id: { type: GraphQLID } },
          type: blogArticle,
        },
      },
    }),
  });
  const mockFields = {
    filed1: 'field1',
    field2: 'field2',
  };

  beforeEach(() => {
    getFields.mockReturnValue(mockFields);
  });

  it('should return a list of arguments', () => {
    const query = schema.getQueryType().getFields().article;
    expect(getBody(query, schema, maxDepth, { useExternalFragmentForS3Object: true })).toEqual({
      args: [{ name: 'id', value: '$id' }],
      ...mockFields,
    });
    expect(getFields).toHaveBeenCalledWith(query, schema, maxDepth, { useExternalFragmentForS3Object: true });
  });
});
