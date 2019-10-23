import { GraphQLSchema, GraphQLObjectType, GraphQLArgument, GraphQLString, GraphQLID } from 'graphql';

import isRequired from '../../src/generator/utils/isRequired';
import getType from '../../src/generator/utils/getType';

import getArgs from '../../src/generator/getArgs';
import isList from '../../src/generator/utils/isList';
import isRequiredList from '../../src/generator/utils/isRequiredList';

jest.mock('../../src/generator/utils/isRequired');
jest.mock('../../src/generator/utils/getType');
jest.mock('../../src/generator/utils/isList');
jest.mock('../../src/generator/utils/isRequiredList');

describe('getArgs', () => {
  const id: GraphQLArgument = {
    name: 'id',
    type: GraphQLID,
    defaultValue: '1',
  };

  const query: GraphQLArgument = {
    name: 'query',
    type: GraphQLString,
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
        searchArticle: {
          args: { id, query },
          type: blogArticle,
        },
      },
    }),
  });

  beforeEach(() => {
    jest.resetAllMocks();
    isRequired.mockReturnValue(false);
    getType.mockReturnValue({ name: 'mockType' });
    isRequiredList.mockReturnValue(false);
    isList.mockReturnValue(false);
  });

  it('should return arguments', () => {
    isList.mockReturnValueOnce(true);
    const query = schema.getQueryType().getFields().searchArticle;
    expect(getArgs(query.args)).toEqual([
      {
        name: 'id',
        type: 'mockType',
        defaultValue: '1',
        isRequired: false,
        isList: true,
        isListRequired: false,
      },
      {
        name: 'query',
        type: 'mockType',
        defaultValue: undefined,
        isRequired: false,
        isList: false,
        isListRequired: false,
      },
    ]);
    expect(getType).toHaveBeenCalledTimes(2);
    expect(getType.mock.calls[0][0]).toEqual(GraphQLID);
    expect(getType.mock.calls[1][0]).toEqual(GraphQLString);

    expect(isRequired).toHaveBeenCalledTimes(2);
    expect(isRequired.mock.calls[0][0]).toEqual(query.args[0].type);
    expect(isRequired.mock.calls[1][0]).toEqual(query.args[1].type);

    expect(isList).toHaveBeenCalledTimes(2);
    expect(isRequiredList).toHaveBeenCalledTimes(2);
  });
});
