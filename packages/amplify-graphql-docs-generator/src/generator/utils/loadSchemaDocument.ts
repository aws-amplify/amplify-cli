import { parse, GraphQLSchema, DocumentNode, buildASTSchema, concatAST, Source, buildClientSchema, IntrospectionQuery } from 'graphql'
import { readFileSync } from 'fs'
import { join, extname } from 'path';

function loadSchemaFromSDL(file: string): GraphQLSchema {
  const schemaDoc = new Source(readFileSync(file, 'utf8'), file)
  const authDirectives = new Source(
    readFileSync(join(__dirname, '..', '..', '..', 'appsync_custom_directives.graphql'), 'utf8')
  )
  const doc = concatAST([schemaDoc, authDirectives].map((source) => parse(source)))
  return buildASTSchema(doc);
}

function loadSchemaFromIntrospection(file: string): GraphQLSchema {
  const schemaContent = readFileSync(file, 'utf8').trim()
  const schemaData = JSON.parse(schemaContent)
  if (!schemaData.data && !schemaData.__schema) {
    throw new Error('GraphQL schema file should contain a valid GraphQL introspection query result')
  }
  const schema: IntrospectionQuery = schemaData.data || schemaData
  return buildClientSchema(schema);
}

export default function getSchema(file: string): GraphQLSchema {
  const ext = extname(file);
  if (ext === '.json') {
    return loadSchemaFromIntrospection(file)
  }
  return loadSchemaFromSDL(file)
}
