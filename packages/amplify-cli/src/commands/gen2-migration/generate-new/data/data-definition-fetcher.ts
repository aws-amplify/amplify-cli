// Data definition fetcher - extracts data definitions from Gen1 projects
// Duplicated from generate/codegen-head/data_definition_fetcher.ts for generate-new/ self-containment
import path from 'node:path';
import fs from 'node:fs/promises';
import glob from 'glob';
import assert from 'node:assert';

import { DataDefinition, AdditionalAuthProvider } from './render-data';
import { pathManager } from '@aws-amplify/amplify-cli-core';

interface Gen1AuthConfig {
  defaultAuthentication?: Gen1AuthMode;
  additionalAuthenticationProviders?: Gen1AuthMode[];
}

interface Gen1AuthMode {
  authenticationType: 'API_KEY' | 'AWS_IAM' | 'AMAZON_COGNITO_USER_POOLS' | 'OPENID_CONNECT' | 'AWS_LAMBDA';
  apiKeyConfig?: {
    apiKeyExpirationDays?: number;
    apiKeyExpirationDate?: string;
    description?: string;
  };
  userPoolConfig?: {
    userPoolId?: string;
  };
  openIDConnectConfig?: {
    name?: string;
    issuerUrl?: string;
    clientId?: string;
    authTTL?: number;
    iatTTL?: number;
  };
  lambdaAuthorizerConfig?: {
    lambdaFunction?: string;
    ttlSeconds?: number;
  };
}

interface Gen1PathConfig {
  methods?: string[];
  permissions?: {
    setting?: 'private' | 'protected' | 'open';
    auth?: string[];
    groups?: Record<string, string[]>;
  };
  lambdaFunction?: string;
  restrictAccess?: boolean;
  groupAccess?: string[];
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

/** Processed REST API definition ready for Gen2 migration */
export interface RestApiDefinition {
  apiName: string;
  functionName: string;
  paths: RestApiPath[];
  authType?: string;
  corsConfiguration?: CorsConfiguration;
  uniqueFunctions?: string[];
}

/** Individual path configuration within a REST API */
export interface RestApiPath {
  path: string;
  methods: string[];
  authType?: string;
  lambdaFunction?: string;
  userPoolGroups?: string[];
  permissions?: {
    hasAuth?: boolean;
    groups?: Record<string, string[]>;
  };
}

/** Standard CORS configuration for web APIs */
export interface CorsConfiguration {
  allowCredentials?: boolean;
  allowHeaders?: string[];
  allowMethods?: string[];
  allowOrigins?: string[];
  exposeHeaders?: string[];
  maxAge?: number;
}

import { BackendEnvironmentResolver } from './backend-environment-selector';
import { BackendDownloader } from '../gen1-app/backend-downloader';
import { fileOrDirectoryExists } from '../gen1-app/file-exists';
import { AppSyncClient, GetGraphqlApiCommand } from '@aws-sdk/client-appsync';

/**
 * Fetches and processes data definitions from Amplify Gen1 projects for migration to Gen2.
 */
export class DataDefinitionFetcher {
  public constructor(
    private readonly backendEnvironmentResolver: BackendEnvironmentResolver,
    private readonly ccbFetcher: BackendDownloader,
  ) {}

  private readJsonFile = async (filePath: string) => {
    const contents = await fs.readFile(filePath, { encoding: 'utf8' });
    return JSON.parse(contents);
  };

  /**
   * Extracts REST API configurations from Gen1 API configuration.
   */
  public getRestApis = async (apis: Record<string, Gen1ApiObject>): Promise<RestApiDefinition[]> => {
    const restApis: RestApiDefinition[] = [];
    const rootDir = pathManager.findProjectRoot();
    assert(rootDir);

    for (const apiName of Object.keys(apis)) {
      const apiObj = apis[apiName];
      if (apiObj.service === 'API Gateway') {
        const cliInputsPath = path.join(rootDir, 'amplify', 'backend', 'api', apiName, 'cli-inputs.json');
        let paths: RestApiPath[] = [{ path: '/{proxy+}', methods: ['ANY'] }];
        let authType = 'NONE';
        let corsConfiguration;

        const cliInputs: Gen1CliInputs = JSON.parse(await fs.readFile(cliInputsPath, 'utf8'));

        if (cliInputs.paths) {
          paths = Object.entries(cliInputs.paths).map(([pathName, pathConfig]) => {
            const pathAuthType = pathConfig.permissions?.setting || 'open';

            let userPoolGroups: string[] | undefined;
            if (pathConfig.permissions?.groups) {
              userPoolGroups = Object.keys(pathConfig.permissions.groups);
            }

            const permissions: { hasAuth?: boolean; groups?: Record<string, string[]> } = {};

            if (pathConfig.permissions?.auth && pathConfig.permissions.auth.length > 0) {
              permissions.hasAuth = true;
            }

            if (pathConfig.permissions?.groups && Object.keys(pathConfig.permissions.groups).length > 0) {
              permissions.groups = pathConfig.permissions.groups;
            }

            return {
              path: pathName,
              methods: this.extractMethodsFromPath(pathConfig),
              authType: pathAuthType,
              lambdaFunction: pathConfig.lambdaFunction,
              userPoolGroups,
              ...(Object.keys(permissions).length > 0 && { permissions }),
            };
          });
        }

        if (cliInputs.corsConfiguration) {
          corsConfiguration = cliInputs.corsConfiguration;
        }

        const hasPathAuth = Object.values(cliInputs.paths || {}).some(
          (p) => p.permissions?.setting === 'private' || p.permissions?.setting === 'protected',
        );

        if (cliInputs.restrictAccess || hasPathAuth) {
          authType = cliInputs.authType || 'AWS_IAM';
        }

        const defaultFunctionName = apiObj.dependsOn?.find((dep) => dep.category === 'function')?.resourceName;

        const uniqueFunctions = new Set<string>();
        if (defaultFunctionName) {
          uniqueFunctions.add(defaultFunctionName);
        }
        paths.forEach((p) => {
          if (p.lambdaFunction) {
            uniqueFunctions.add(p.lambdaFunction);
          }
        });

        restApis.push({
          apiName,
          functionName: defaultFunctionName || 'defaultFunction',
          paths,
          authType: authType !== 'NONE' ? authType : undefined,
          corsConfiguration,
          uniqueFunctions: Array.from(uniqueFunctions),
        });
      }
    }

    return restApis;
  };

  private extractMethodsFromPath(pathConfig: Gen1PathConfig): string[] {
    if (pathConfig.methods && pathConfig.methods.length > 0) {
      return pathConfig.methods;
    }

    if (pathConfig.permissions?.auth && pathConfig.permissions.auth.length > 0) {
      return this.mapPermissionsToMethods(pathConfig.permissions.auth);
    }

    if (pathConfig.permissions?.groups) {
      const allPermissions = new Set<string>();
      Object.values(pathConfig.permissions.groups).forEach((permissions) => {
        permissions.forEach((permission) => allPermissions.add(permission));
      });
      return this.mapPermissionsToMethods(Array.from(allPermissions));
    }

    return ['GET'];
  }

  private mapPermissionsToMethods(permissions: string[]): string[] {
    const methods: string[] = [];
    permissions.forEach((permission) => {
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

  /**
   * Extracts GraphQL schema from Gen1 project structure.
   */
  public getSchema = async (apis: any): Promise<string> => {
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
      } catch (error) {
        // Directory doesn't exist, continue to check for schema.graphql
      }

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

  private getLoggingConfigFromConsole = async (apiId: string) => {
    try {
      const client = new AppSyncClient({});
      const response = await client.send(new GetGraphqlApiCommand({ apiId }));

      const logConfig = response.graphqlApi?.logConfig;
      if (logConfig?.fieldLogLevel && logConfig.fieldLogLevel !== 'NONE') {
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
   */
  public getDefinition = async (): Promise<DataDefinition | undefined> => {
    const backendEnvironment = await this.backendEnvironmentResolver.selectBackendEnvironment();
    if (!backendEnvironment?.deploymentArtifacts) return undefined;

    const currentCloudBackendDirectory = await this.ccbFetcher.getCurrentCloudBackend(backendEnvironment.deploymentArtifacts);

    const amplifyMetaPath = path.join(currentCloudBackendDirectory, 'amplify-meta.json');

    if (!(await fileOrDirectoryExists(amplifyMetaPath))) {
      throw new Error('Could not find amplify-meta.json');
    }

    const amplifyMeta = (await this.readJsonFile(amplifyMetaPath)) ?? {};

    if ('api' in amplifyMeta && Object.keys(amplifyMeta.api).length > 0) {
      const restApis = await this.getRestApis(amplifyMeta.api);

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

      if (restApis.length > 0) {
        return {
          tableMappings: undefined,
          restApis,
        };
      }
    }

    return undefined;
  };
}
