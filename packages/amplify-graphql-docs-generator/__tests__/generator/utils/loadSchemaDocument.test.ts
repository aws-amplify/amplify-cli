import loadSchemaDocument from '../../../src/generator/utils/loadSchemaDocument'
import {
  parse,
  GraphQLSchema,
  DocumentNode,
  buildASTSchema,
  concatAST,
  Source,
  buildClientSchema,
  IntrospectionQuery,
} from 'graphql'
import { readFileSync } from 'fs'

jest.mock('fs')
jest.mock('graphql')

describe('loadSchmeaDocument', () => {
  const mockIntrospectionSchema = {
    data: {
      'foo': 'bar'
    },
  }
  describe('introspection schema', () => {
    beforeEach(() => {
      jest.resetAllMocks()
      readFileSync.mockReturnValue(JSON.stringify(mockIntrospectionSchema))
    })
    it('should build client schmea if the schema file ends with .json', () => {
      loadSchemaDocument('foo.json')
      expect(buildClientSchema).toHaveBeenCalledWith(mockIntrospectionSchema.data)
    })
    it('should build schema client if the there is __schema', () => {
      const mockIntrospectionSchema = {
        __schema: {
          'foo': 'bar'
        },
      }
      readFileSync.mockReturnValue(JSON.stringify(mockIntrospectionSchema))
      loadSchemaDocument('foo.json')
      expect(buildClientSchema).toHaveBeenCalledWith(mockIntrospectionSchema)
    })
  })

  describe('SDL Schema', () => {
    
  })
})
