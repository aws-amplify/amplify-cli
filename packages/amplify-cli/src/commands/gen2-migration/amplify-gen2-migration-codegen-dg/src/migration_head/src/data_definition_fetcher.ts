import path from 'node:path';
import fs from 'node:fs/promises';
import glob from 'glob';
import assert from 'node:assert';

import { DataDefinition } from '../../core/migration-pipeline';
import { AmplifyStackParser } from './amplify_stack_parser.js';
import { BackendEnvironmentResolver } from './backend_environment_selector.js';
import { BackendDownloader } from './backend_downloader.js';
import { pathManager } from '@aws-amplify/amplify-cli-core';
import { fileOrDirectoryExists } from './directory_exists';

const dataSourceMappingOutputKey = 'DataSourceMappingOutput';

export class DataDefinitionFetcher {
  constructor(
    private backendEnvironmentResolver: BackendEnvironmentResolver,
    private ccbFetcher: BackendDownloader,
    private amplifyStackClient: AmplifyStackParser,
  ) {}

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
    const backendEnvironments = await this.backendEnvironmentResolver.getAllBackendEnvironments();

    const backendEnvironment = await this.backendEnvironmentResolver.selectBackendEnvironment();
    if (!backendEnvironment?.deploymentArtifacts) return undefined;

    const currentCloudBackendDirectory = await this.ccbFetcher.getCurrentCloudBackend(backendEnvironment.deploymentArtifacts);

    const amplifyMetaPath = path.join(currentCloudBackendDirectory, 'amplify-meta.json');

    if (!(await fileOrDirectoryExists(amplifyMetaPath))) {
      throw new Error('Could not find amplify-meta.json');
    }

    const amplifyMeta = (await this.readJsonFile(amplifyMetaPath)) ?? {};

    if ('api' in amplifyMeta && Object.keys(amplifyMeta.api).length > 0) {
      const tableMappings = await Promise.all(
        backendEnvironments.map(async (backendEnvironment) => {
          if (!backendEnvironment?.stackName) {
            return [backendEnvironment.environmentName, undefined];
          }
          console.log(`DEBUG - Fetching stacks for ${backendEnvironment.environmentName}, stackName: ${backendEnvironment?.stackName}`);
          const amplifyStacks = await this.amplifyStackClient.getAmplifyStacks(backendEnvironment?.stackName);
          console.log(`DEBUG - Found stacks:`, {
            dataStack: amplifyStacks.dataStack ? 'EXISTS' : 'MISSING',
            outputs: amplifyStacks.dataStack?.Outputs?.length || 0,
          });
          if (amplifyStacks.dataStack) {
            const outputs = amplifyStacks.dataStack.Outputs || [];
            console.log(
              `DEBUG - Stack outputs:`,
              outputs.map((o) => o.OutputKey),
            );
            const tableMappingText = outputs.find((o) => o.OutputKey === dataSourceMappingOutputKey)?.OutputValue;
            console.log(`DEBUG - Table mapping for ${dataSourceMappingOutputKey}:`, tableMappingText ? 'FOUND' : 'NOT FOUND');
            if (!tableMappingText) {
              return [backendEnvironment.environmentName, undefined];
            }
            try {
              const parsed = JSON.parse(tableMappingText);
              console.log(`DEBUG - Parsed mappings:`, parsed);
              return [backendEnvironment.environmentName, parsed];
            } catch (e) {
              console.log(`DEBUG - Parse error:`, e.message);
              return [backendEnvironment.environmentName, undefined];
            }
          }
          return [backendEnvironment.environmentName, undefined];
        }),
      );

      const schema = await this.getSchema(amplifyMeta.api);

      return {
        tableMappings: Object.fromEntries(tableMappings),
        schema,
      };
    }

    return undefined;
  };
}
