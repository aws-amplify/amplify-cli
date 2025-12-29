import path from 'node:path';
import fs from 'node:fs/promises';
import glob from 'glob';
import assert from 'node:assert';

import { DataDefinition } from '../core/migration-pipeline';
import { AdditionalAuthProvider } from '../generators/data';
import { pathManager } from '@aws-amplify/amplify-cli-core';

interface Gen1PathConfig {
  methods?: string[];
  permissions?: {
    setting?: 'private' | 'protected' | 'open';
    auth?: string[];
  };
  lambdaFunction?: string;
}

interface Gen1CliInputs {
  paths?: Record<string, Gen1PathConfig>;
  corsConfiguration?: CorsConfiguration;
  restrictAccess?: boolean;
  authType?: string;
}

interface Gen1ApiObject {
  service: string;
  dependsOn?: Array<{
    category: string;
    resourceName: string;
  }>;
}

export interface RestApiDefinition {
  apiName: string;
  functionName: string;
  paths: RestApiPath[];
  authType?: string;
  corsConfiguration?: CorsConfiguration;
}

export interface RestApiPath {
  path: string;
  methods: string[];
  authType?: string;
  lambdaFunction?: string;
}

export interface CorsConfiguration {
  allowCredentials?: boolean;
  allowHeaders?: string[];
  allowMethods?: string[];
  allowOrigins?: string[];
  exposeHeaders?: string[];
  maxAge?: number;
}

import { BackendEnvironmentResolver } from './backend_environment_selector';
import { BackendDownloader } from './backend_downloader';
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
   * Extracts REST API configurations from Gen1 API configuration.
   */
  getRestApis = async (apis: Record<string, Gen1ApiObject>): Promise<RestApiDefinition[]> => {
    const restApis: RestApiDefinition[] = [];
    const rootDir = pathManager.findProjectRoot();
    assert(rootDir);

    for (const apiName of Object.keys(apis)) {
      const apiObj = apis[apiName];
      if (apiObj.service === 'API Gateway') {
        // Read CLI inputs for detailed configuration
        const cliInputsPath = path.join(rootDir, 'amplify', 'backend', 'api', apiName, 'cli-inputs.json');
        let paths: RestApiPath[] = [{ path: '/{proxy+}', methods: ['ANY'] }];
        let authType = 'NONE';
        let corsConfiguration;

        try {
          const cliInputs: Gen1CliInputs = JSON.parse(await fs.readFile(cliInputsPath, 'utf8'));

          // Extract paths and methods with correct function mapping
          if (cliInputs.paths) {
            paths = Object.entries(cliInputs.paths).map(([pathName, pathConfig]) => {
              // Parse permission setting correctly: private/protected/open
              const pathAuthType = pathConfig.permissions?.setting || 'open';

              return {
                path: pathName,
                methods: this.extractMethodsFromPath(pathConfig),
                authType: pathAuthType,
                // Extract the actual Lambda function name for this specific path
                lambdaFunction: pathConfig.lambdaFunction,
              };
            });
          }

          // Extract CORS configuration
          if (cliInputs.corsConfiguration) {
            corsConfiguration = cliInputs.corsConfiguration;
          }

          // Extract global auth type
          if (cliInputs.restrictAccess) {
            authType = cliInputs.authType || 'AWS_IAM';
          }
        } catch (error) {
          // Fall back to basic configuration if cli-inputs.json not found
        }

        // Keep all paths together in a single REST API definition
        // The synthesizer will handle routing to different Lambda functions
        const defaultFunctionName = apiObj.dependsOn?.find((dep) => dep.category === 'function')?.resourceName;

        restApis.push({
          apiName,
          functionName: defaultFunctionName || 'defaultFunction',
          paths,
          authType: authType !== 'NONE' ? authType : undefined,
          corsConfiguration,
        });
      }
    }

    return restApis;
  };

  private extractMethodsFromPath(pathConfig: Gen1PathConfig): string[] {
    // Use explicitly configured methods if available
    if (pathConfig.methods && pathConfig.methods.length > 0) {
      return pathConfig.methods;
    }

    // Map auth permissions to HTTP methods if no explicit methods
    if (pathConfig.permissions?.auth && pathConfig.permissions.auth.length > 0) {
      const methods: string[] = [];
      pathConfig.permissions.auth.forEach((permission) => {
        switch (permission) {
          case 'read':
            methods.push('GET');
            break;
          case 'create':
            methods.push('POST');
            break;
          case 'update':
            methods.push('PUT');
            break;
          case 'delete':
            methods.push('DELETE');
            break;
        }
      });
      return methods.length > 0 ? methods : ['GET'];
    }

    // Default to GET only if no configuration found
    return ['GET'];
  }

  /**
   * Extracts GraphQL schema from Gen1 project structure.
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
      const client = new AppSyncClient({});
      const response = await client.send(new GetGraphqlApiCommand({ apiId }));

      const logConfig = response.graphqlApi?.logConfig;
      if (logConfig?.fieldLogLevel && logConfig.fieldLogLevel !== 'NONE') {
        // Map AWS AppSync log levels to Gen2 DataLogLevel enum values
        const fieldLogLevel = logConfig.fieldLogLevel.toLowerCase() as 'none' | 'all' | 'info' | 'debug' | 'error';
        return {
          fieldLogLevel,
          ...(logConfig.excludeVerboseContent !== undefined && { excludeVerboseContent: logConfig.excludeVerboseContent }),
        };
      }
      return undefined;
    } catch (error) {
      throw new Error(`Failed to fetch logging config from AWS: ${error.message}`);
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
      const restApis = await this.getRestApis(amplifyMeta.api);

      // Check for GraphQL APIs
      const hasGraphQL = Object.values(amplifyMeta.api).some((api: any) => api.service === 'AppSync');

      if (hasGraphQL) {
        const schema = await this.getSchema(amplifyMeta.api);
        const appSyncApi = Object.values(amplifyMeta.api).find((api: any) => api.service === 'AppSync') as any;
        const authorizationModes = appSyncApi?.output?.authConfig;
        const apiId = appSyncApi?.output?.GraphQLAPIIdOutput;
        const additionalAuthProviders = apiId ? await this.getAdditionalAuthProvidersFromConsole(apiId) : [];
        const logging = apiId ? await this.getLoggingConfigFromConsole(apiId) : undefined;

        return {
          tableMappings: undefined,
          schema,
          authorizationModes,
          additionalAuthProviders: additionalAuthProviders.length > 0 ? additionalAuthProviders : undefined,
          logging,
          restApis: restApis.length > 0 ? restApis : undefined,
        };
      }

      // Only REST APIs, no GraphQL
      if (restApis.length > 0) {
        return {
          tableMappings: undefined,
          restApis,
        };
      }
    }

    // No APIs found in the project
    return undefined;
  };
}
