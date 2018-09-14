import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLArgument,
  GraphQLString,
  GraphQLID,
} from 'graphql'

import isRequired from '../../src/generator/utils/isRequired'
import getType from '../../src/generator/utils/getType'

import getArgs from '../../src/generator/getArgs'

jest.mock('../../src/generator/utils/isRequired')
jest.mock('../../src/generator/utils/getType')

describe('getArgs', () => {
  const id: GraphQLArgument = {
    name: 'id',
    type: GraphQLID,
    defaultValue: '1',
  }

  const query: GraphQLArgument = {
    name: 'query',
    type: GraphQLString,
  }

  const blogArticle = new GraphQLObjectType({
    name: 'BlogArticle',
    fields: {
      id: { type: GraphQLID },
      content: { type: GraphQLString },
    },
  })

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
  })

  beforeEach(() => {
    jest.resetAllMocks()
    isRequired.mockReturnValue(false)
    getType.mockReturnValue({ name: 'mockType' })
  })

  it('should return arguments', () => {
    const query = schema.getQueryType().getFields().searchArticle
    expect(getArgs(query.args)).toEqual([
      {
        name: 'id',
        type: 'mockType',
        defaultValue: '1',
        isRequired: false,
      },
      {
        name: 'query',
        type: 'mockType',
        defaultValue: undefined,
        isRequired: false,
      },
    ])
    expect(getType).toHaveBeenCalledTimes(2)
    expect(getType.mock.calls[0][0]).toEqual(GraphQLID)
    expect(getType.mock.calls[1][0]).toEqual(GraphQLString)

    expect(isRequired).toHaveBeenCalledTimes(2)
    expect(isRequired.mock.calls[0][0]).toEqual(query.args[0])
    expect(isRequired.mock.calls[1][0]).toEqual(query.args[1])
  })
})
