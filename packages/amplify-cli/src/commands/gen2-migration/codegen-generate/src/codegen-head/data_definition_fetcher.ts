import path from 'node:path';
import fs from 'node:fs/promises';
import glob from 'glob';
import assert from 'node:assert';

import { DataDefinition } from '../core/migration-pipeline';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import { BackendDownloader } from './backend_downloader';
import { pathManager } from '@aws-amplify/amplify-cli-core';
import { fileOrDirectoryExists } from './directory_exists';

export class DataDefinitionFetcher {
  constructor(private backendEnvironmentResolver: BackendEnvironmentResolver, private ccbFetcher: BackendDownloader) {}

  private readJsonFile = async (filePath: string) => {
    const contents = await fs.readFile(filePath, { encoding: 'utf8' });
    return JSON.parse(contents);
  };

  getSchema = async (apis: any): Promise<string> => {
    try {
      let apiName;

      Object.keys(apis).forEach((api) => {
        const apiObj = apis[api];
        if (apiObj.service === 'AppSync') {
          apiName = api;
        }
      });

      assert(apiName);

      const rootDir = pathManager.findProjectRoot();
      assert(rootDir);
      const apiPath = path.join(rootDir, 'amplify', 'backend', 'api', apiName);

      // Check for schema folder first
      const schemaFolderPath = path.join(apiPath, 'schema');
      try {
        const stats = await fs.stat(schemaFolderPath);
        if (stats.isDirectory()) {
          // Read all .graphql files from schema folder
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
      } catch (error) {
        // Directory doesn't exist or other error, continue to check for schema.graphql
      }

      // If schema folder doesn't exist or is empty, check for schema.graphql file
      const schemaFilePath = path.join(apiPath, 'schema.graphql');
      try {
        return await fs.readFile(schemaFilePath, 'utf8');
      } catch (error) {
        throw new Error('No GraphQL schema found in the project');
      }
    } catch (error) {
      throw new Error(`Error reading GraphQL schema: ${error.message}`);
    }
  };

  getDefinition = async (): Promise<DataDefinition | undefined> => {
    const backendEnvironment = await this.backendEnvironmentResolver.selectBackendEnvironment();
    if (!backendEnvironment?.deploymentArtifacts) return undefined;

    const currentCloudBackendDirectory = await this.ccbFetcher.getCurrentCloudBackend(backendEnvironment.deploymentArtifacts);

    const amplifyMetaPath = path.join(currentCloudBackendDirectory, 'amplify-meta.json');

    if (!(await fileOrDirectoryExists(amplifyMetaPath))) {
      throw new Error('Could not find amplify-meta.json');
    }

    const amplifyMeta = (await this.readJsonFile(amplifyMetaPath)) ?? {};

    if ('api' in amplifyMeta && Object.keys(amplifyMeta.api).length > 0) {
      const schema = await this.getSchema(amplifyMeta.api);

      return {
        tableMappings: undefined, // Will be generated from schema
        schema,
      };
    }

    return undefined;
  };
}
