import path from 'node:path';
import fs from 'node:fs/promises';
import glob from 'glob';
import assert from 'node:assert';

import { DataDefinition } from '../core/migration-pipeline';
import { AdditionalAuthProvider } from '../generators/data';

import { BackendEnvironmentResolver } from './backend_environment_selector';
import { BackendDownloader } from './backend_downloader';
import { pathManager } from '@aws-amplify/amplify-cli-core';
import { fileOrDirectoryExists } from './directory_exists';
import { AppSyncClient, GetGraphqlApiCommand } from '@aws-sdk/client-appsync';

/**
 * Fetches and processes data definitions from Amplify Gen1 projects for migration to Gen2.
 *
 * This class is responsible for extracting GraphQL schemas and API configurations from
 * existing Gen1 Amplify projects to facilitate the migration process. It handles both
 * local schema files and deployed backend configurations.
 *
 * Key responsibilities:
 * - Locates and reads GraphQL schema files from Gen1 project structure
 * - Extracts API configurations from amplify-meta.json
 * - Merges multiple schema files when using schema folder structure
 * - Provides data definitions for the migration pipeline
 */
export class DataDefinitionFetcher {
  /**
   * Creates a new DataDefinitionFetcher instance.
   *
   * @param backendEnvironmentResolver - Resolves backend environment for migration
   * @param ccbFetcher - Downloads current cloud backend artifacts
   */
  constructor(private backendEnvironmentResolver: BackendEnvironmentResolver, private ccbFetcher: BackendDownloader) {}

  /**
   * Reads and parses a JSON file.
   *
   * @param filePath - Path to the JSON file to read
   * @returns Parsed JSON object
   * @throws Error if file cannot be read or parsed
   */
  private readJsonFile = async (filePath: string) => {
    const contents = await fs.readFile(filePath, { encoding: 'utf8' });
    return JSON.parse(contents);
  };

  /**
   * Extracts GraphQL schema from Gen1 API configuration.
   *
   * Supports two schema organization patterns:
   * 1. Single schema.graphql file in the API directory
   * 2. Multiple .graphql files in a schema/ subdirectory
   *
   * @param apis - API configuration object from amplify-meta.json
   * @returns Combined GraphQL schema as a string
   * @throws Error if no AppSync API found or schema files missing
   */
  getSchema = async (apis: any): Promise<string> => {
    try {
      let apiName;

      // Find the AppSync API from the available APIs
      Object.keys(apis).forEach((api) => {
        const apiObj = apis[api];
        if (apiObj.service === 'AppSync') {
          apiName = api;
        }
      });

      assert(apiName);

      // Locate the API directory in the Gen1 project structure
      const rootDir = pathManager.findProjectRoot();
      assert(rootDir);
      const apiPath = path.join(rootDir, 'amplify', 'backend', 'api', apiName);

      // Check for schema folder first (multi-file schema pattern)
      const schemaFolderPath = path.join(apiPath, 'schema');
      try {
        const stats = await fs.stat(schemaFolderPath);
        if (stats.isDirectory()) {
          // Read and merge all .graphql files from schema folder
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

      // Fallback to single schema.graphql file (single-file schema pattern)
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

  /**
   * Fetches additional authentication providers from AWS AppSync API.
   */
  private getAdditionalAuthProvidersFromConsole = async (apiId: string): Promise<AdditionalAuthProvider[]> => {
    try {
      const client = new AppSyncClient({});
      const response = await client.send(new GetGraphqlApiCommand({ apiId }));

      return (
        response.graphqlApi?.additionalAuthenticationProviders?.map((provider: any) => ({
          authenticationType: provider.authenticationType,
          ...(provider.lambdaAuthorizerConfig && { lambdaAuthorizerConfig: provider.lambdaAuthorizerConfig }),
          ...(provider.openIDConnectConfig && { openIdConnectConfig: provider.openIDConnectConfig }),
          ...(provider.userPoolConfig && { userPoolConfig: provider.userPoolConfig }),
        })) || []
      );
    } catch (error) {
      throw new Error(`Failed to fetch additional auth providers from AWS: ${error.message}`);
    }
  };

  /**
   * Fetches logging configuration from AWS AppSync API.
   */
  private getLoggingConfigFromConsole = async (apiId: string) => {
    try {
      const { AppSyncClient, GetGraphqlApiCommand } = require('@aws-sdk/client-appsync');
      const client = new AppSyncClient({});
      const response = await client.send(new GetGraphqlApiCommand({ apiId }));

      const logConfig = response.graphqlApi?.logConfig;
      if (logConfig?.fieldLogLevel && logConfig.fieldLogLevel !== 'NONE') {
        return {
          fieldLogLevel: logConfig.fieldLogLevel.toLowerCase(),
          ...(logConfig.excludeVerboseContent !== undefined && { excludeVerboseContent: logConfig.excludeVerboseContent }),
        };
      }
      return undefined;
    } catch (error) {
      console.warn('Failed to fetch logging config from AWS:', error.message);
      return undefined;
    }
  };

  /**
   * Retrieves the complete data definition for migration.
   *
   * This method orchestrates the extraction of data definitions from a Gen1 project:
   * 1. Selects the appropriate backend environment
   * 2. Downloads current cloud backend artifacts
   * 3. Reads amplify-meta.json for API configuration
   * 4. Extracts GraphQL schema if APIs exist
   * 5. Extracts additional auth providers for AppSync
   *
   * @returns DataDefinition object containing schema and table mappings, or undefined if no APIs found
   * @throws Error if amplify-meta.json is missing or schema extraction fails
   */
  getDefinition = async (): Promise<DataDefinition | undefined> => {
    // Select the backend environment to migrate from
    const backendEnvironment = await this.backendEnvironmentResolver.selectBackendEnvironment();
    if (!backendEnvironment?.deploymentArtifacts) return undefined;

    // Download the current cloud backend configuration
    const currentCloudBackendDirectory = await this.ccbFetcher.getCurrentCloudBackend(backendEnvironment.deploymentArtifacts);

    // Load the amplify-meta.json file containing backend configuration
    const amplifyMetaPath = path.join(currentCloudBackendDirectory, 'amplify-meta.json');

    if (!(await fileOrDirectoryExists(amplifyMetaPath))) {
      throw new Error('Could not find amplify-meta.json');
    }

    const amplifyMeta = (await this.readJsonFile(amplifyMetaPath)) ?? {};

    // Extract API configuration and schema if APIs exist
    if ('api' in amplifyMeta && Object.keys(amplifyMeta.api).length > 0) {
      const schema = await this.getSchema(amplifyMeta.api);

      // Extract auth config from the AppSync API output
      const appSyncApi = Object.values(amplifyMeta.api).find((api: any) => api.service === 'AppSync') as any;
      const authorizationModes = appSyncApi?.output?.authConfig;
      const apiId = appSyncApi?.output?.GraphQLAPIIdOutput;
      const additionalAuthProviders = apiId ? await this.getAdditionalAuthProvidersFromConsole(apiId) : [];

      const logging = apiId ? await this.getLoggingConfigFromConsole(apiId) : undefined;
      return {
        tableMappings: undefined, // Will be generated from schema during migration
        schema,
        authorizationModes,
        additionalAuthProviders: additionalAuthProviders.length > 0 ? additionalAuthProviders : undefined,
        logging,
      };
    }

    // No APIs found in the project
    return undefined;
  };
}
