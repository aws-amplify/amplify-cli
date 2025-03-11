import path from 'node:path';
import fs from 'node:fs/promises';
import glob from 'glob';
import assert from 'node:assert';

import { DataDefinition } from '@aws-amplify/amplify-gen2-codegen';
import { AmplifyStackParser } from './amplify_stack_parser.js';
import { BackendEnvironmentResolver } from './backend_environment_selector.js';
import { stateManager, pathManager } from '@aws-amplify/amplify-cli-core';

const dataSourceMappingOutputKey = 'DataSourceMappingOutput';

export class DataDefinitionFetcher {
  constructor(private backendEnvironmentResolver: BackendEnvironmentResolver, private amplifyStackClient: AmplifyStackParser) {}

  getSchema = async (): Promise<string> => {
    try {
      let apiName;
      const meta = stateManager.getMeta();
      const apis = meta?.api ?? {};
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
    const tableMappings = await Promise.all(
      backendEnvironments.map(async (backendEnvironment) => {
        if (!backendEnvironment?.stackName) {
          return [backendEnvironment.environmentName, undefined];
        }
        const amplifyStacks = await this.amplifyStackClient.getAmplifyStacks(backendEnvironment?.stackName);
        if (amplifyStacks.dataStack) {
          const tableMappingText = amplifyStacks.dataStack?.Outputs?.find((o) => o.OutputKey === dataSourceMappingOutputKey)?.OutputValue;
          if (!tableMappingText) {
            return [backendEnvironment.environmentName, undefined];
          }
          try {
            return [backendEnvironment.environmentName, JSON.parse(tableMappingText)];
          } catch (e) {
            return [backendEnvironment.environmentName, undefined];
          }
        }
        return [backendEnvironment.environmentName, undefined];
      }),
    );

    const schema = await this.getSchema();

    return {
      tableMappings: Object.fromEntries(tableMappings),
      schema,
    };
  };
}
