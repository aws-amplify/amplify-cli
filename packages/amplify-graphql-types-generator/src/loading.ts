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

import { ToolError } from './errors'
import { extname, join, normalize, relative } from 'path';

export function loadSchema(schemaPath: string): GraphQLSchema {
  if (extname(schemaPath) === '.json') {
    return loadIntrospectionSchema(schemaPath)
  }
  return loadSDLSchema(schemaPath)
}

function loadIntrospectionSchema(schemaPath: string): GraphQLSchema  {
  if (!fs.existsSync(schemaPath)) {
    throw new ToolError(`Cannot find GraphQL schema file: ${schemaPath}`);
  }
  const schemaData = require(schemaPath);

  if (!schemaData.data && !schemaData.__schema) {
    throw new ToolError('GraphQL schema file should contain a valid GraphQL introspection query result');
  }
  return buildClientSchema((schemaData.data) ? schemaData.data : schemaData);
}

function loadSDLSchema(schemaPath: string): GraphQLSchema  {
  const authDirectivePath = normalize(join(__dirname, '..', 'awsApppSyncDirectives.graphql'));
  const doc = loadAndMergeQueryDocuments([authDirectivePath, schemaPath]);
  return buildASTSchema(doc);
}
function extractDocumentFromJavascript(content: string, tagName: string = 'gql'): string | null {
  const re = new RegExp(tagName + '\\s*`([^`/]*)`', 'g');

  let match
  const matches = []

  while (match = re.exec(content)) {
    const doc = match[1]
      .replace(/\${[^}]*}/g, '')

    matches.push(doc)
  }

  const doc = matches.join('\n')
  return doc.length ? doc : null;
}

export function loadAndMergeQueryDocuments(inputPaths: string[], tagName: string = 'gql'): DocumentNode {
  const sources = inputPaths.map(inputPath => {
    const body = fs.readFileSync(inputPath, 'utf8');
    if (!body) {
      return null;
    }

    if (inputPath.endsWith('.jsx') || inputPath.endsWith('.js')
      || inputPath.endsWith('.tsx') || inputPath.endsWith('.ts')
    ) {
      const doc = extractDocumentFromJavascript(body.toString(), tagName);
      return doc ? new Source(doc, inputPath) : null;
    }

    return new Source(body, inputPath);
  }).filter((source): source is Source => Boolean(source));

  const parsedSources = sources.map(source => {
    try {
      return parse(source);
    } catch (err) {
      const relativePathToInput = relative(process.cwd(), source.name);
      throw new ToolError(`Could not parse graphql operations in ${relativePathToInput}\n  Failed on : ${source.body}`)
    }
  })
  return concatAST(parsedSources);
}
