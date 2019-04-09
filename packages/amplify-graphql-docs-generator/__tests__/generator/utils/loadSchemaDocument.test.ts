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
  describe('introspection schema', () => {
    beforeEach(() => {
      jest.resetAllMocks()
    })
    it('should build client schmea if the schema file ends with .json', () => {
      const mockIntrospectionSchema = {
        data: {
          foo: 'bar',
        },
      }
      readFileSync.mockReturnValue(JSON.stringify(mockIntrospectionSchema))
      loadSchemaDocument('foo.json')
      expect(buildClientSchema).toHaveBeenCalledWith(mockIntrospectionSchema.data)
    })
    it('should build schema client if the there is __schema', () => {
      const mockIntrospectionSchema = {
        __schema: {
          foo: 'bar',
        },
      }
      readFileSync.mockReturnValue(JSON.stringify(mockIntrospectionSchema))
      loadSchemaDocument('foo.json')
      expect(buildClientSchema).toHaveBeenCalledWith(mockIntrospectionSchema)
    })

    it("should throw error if the introspection schema doesn't have data", () => {
      const mockIntrospectionSchema = {}
      readFileSync.mockReturnValue(JSON.stringify(mockIntrospectionSchema))
      expect(() => loadSchemaDocument('foo.json')).toThrowError(
        /GraphQL schema file should contain a valid GraphQL introspection query result/
      )
    })
  })

  describe('SDL Schema', () => {
    const mockSDLSchema = `type Foo {
      bar: String
    }`
    const mockAuthDirective = `MOCK_AUTH_DIRECTIVES`

    const mockAst = 'MOCK_AST'
    const mockConcatenateAst = 'MOCK_CONCATENATE_AST'


    beforeEach(() => {
      jest.resetAllMocks()
      readFileSync.mockImplementation((path) => {
        if (path.endsWith('aws_auth_directives.graphql')) {
          return mockAuthDirective
        }
        return mockSDLSchema
      })
  
    })

    it('should load SDL Schema', () => {
      parse.mockReturnValue(mockAst)
      concatAST.mockReturnValue(mockConcatenateAst)
      loadSchemaDocument('foo.graphql')

      expect(readFileSync).toHaveBeenCalledTimes(2)
      expect(readFileSync.mock.calls[0][0]).toEqual('foo.graphql')

      expect(parse).toHaveBeenCalledTimes(2)
      
      expect(concatAST).toHaveBeenCalled()
      expect(buildASTSchema).toHaveBeenCalledWith(mockConcatenateAst)
    })
  })
})
