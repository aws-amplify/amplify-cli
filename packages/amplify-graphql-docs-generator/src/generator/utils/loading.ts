import * as fs from 'fs'

import {
  buildClientSchema,
  Source,
  concatAST,
  parse,
  DocumentNode,
  GraphQLSchema,
  buildASTSchema
} from 'graphql';

import { extname, join, normalize } from 'path';


export function loadSchema(schemaPath: string): GraphQLSchema {
  if (extname(schemaPath) === '.json') {
    return loadIntrospectionSchema(schemaPath)
  }
  return loadSDLSchema(schemaPath)
}

function loadIntrospectionSchema(schemaPath: string): GraphQLSchema  {
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Cannot find GraphQL schema file: ${schemaPath}`);
  }
  const schemaData = require(schemaPath);

  if (!schemaData.data && !schemaData.__schema) {
    throw new Error('GraphQL schema file should contain a valid GraphQL introspection query result');
  }
  return buildClientSchema((schemaData.data) ? schemaData.data : schemaData);
}

function loadSDLSchema(schemaPath: string): GraphQLSchema  {
  const authDirectivePath = normalize(join(__dirname, '../../..', 'awsApppSyncDirectives.graphql'));
  const doc = loadAndMergeQueryDocuments([authDirectivePath, schemaPath]);
  return buildASTSchema(doc);
}

export function loadAndMergeQueryDocuments(inputPaths: string[], tagName: string = 'gql'): DocumentNode {
  const sources = inputPaths.map(inputPath => {
    const body = fs.readFileSync(inputPath, 'utf8');
    if (!body) {
      return null;
    }
    return new Source(body, inputPath);
  }).filter(source => source);

  return concatAST((sources as Source[]).map(source => parse(source)));
}