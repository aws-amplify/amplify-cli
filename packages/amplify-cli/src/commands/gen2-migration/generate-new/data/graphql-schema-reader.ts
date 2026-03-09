import path from 'node:path';
import fs from 'node:fs/promises';
import glob from 'glob';
import { pathManager } from '@aws-amplify/amplify-cli-core';

/**
 * Reads the GraphQL schema from the local Gen1 project.
 *
 * Supports both a single `schema.graphql` file and a multi-file
 * `schema/` directory containing multiple `.graphql` files.
 */
export async function readGraphQLSchema(apiName: string): Promise<string> {
  const rootDir = pathManager.findProjectRoot();
  if (!rootDir) {
    throw new Error('Could not find Amplify project root');
  }

  const apiPath = path.join(rootDir, 'amplify', 'backend', 'api', apiName);

  // Try multi-file schema directory first
  const schemaFolderPath = path.join(apiPath, 'schema');
  try {
    const stats = await fs.stat(schemaFolderPath);
    if (stats.isDirectory()) {
      const graphqlFiles = glob.sync(path.join(schemaFolderPath, '*.graphql'));
      if (graphqlFiles.length > 0) {
        let mergedSchema = '';
        for (const file of graphqlFiles) {
          const content = await fs.readFile(file, 'utf8');
          mergedSchema += content + '\n';
        }
        return mergedSchema.trim();
      }
    }
  } catch {
    // Directory doesn't exist, fall through to single file
  }

  // Fall back to single schema.graphql
  const schemaFilePath = path.join(apiPath, 'schema.graphql');
  try {
    return await fs.readFile(schemaFilePath, 'utf8');
  } catch {
    throw new Error(`No GraphQL schema found for API '${apiName}' in ${apiPath}`);
  }
}
