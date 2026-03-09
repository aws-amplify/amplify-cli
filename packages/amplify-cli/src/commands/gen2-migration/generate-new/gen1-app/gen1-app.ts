import path from 'node:path';
import fs from 'node:fs/promises';
import glob from 'glob';
import { BackendEnvironment, GetBackendEnvironmentCommand } from '@aws-sdk/client-amplify';
import { LambdaConfigType } from '@aws-sdk/client-cognito-identity-provider';
import { StackResource } from '@aws-sdk/client-cloudformation';
import { $TSMeta, JSONUtilities, pathManager } from '@aws-amplify/amplify-cli-core';
import { AwsClients } from './aws-clients';
import { AwsFetcher } from './aws-fetcher';
import { BackendDownloader } from './backend-downloader';
import { fileOrDirectoryExists } from './file-exists';

/**
 * Constructor options for Gen1App.
 */
interface Gen1AppOptions {
  readonly appId: string;
  readonly region: string;
  readonly envName: string;
  readonly clients: AwsClients;
}

/**
 * A single path entry in a REST API configuration.
 */
export interface RestApiPath {
  readonly path: string;
  readonly methods: string[];
  readonly authType?: string;
  readonly lambdaFunction?: string;
  readonly userPoolGroups?: string[];
  readonly permissions?: {
    readonly hasAuth?: boolean;
    readonly groups?: Record<string, string[]>;
  };
}

/**
 * CORS configuration for a REST API.
 */
export interface CorsConfiguration {
  readonly allowCredentials?: boolean;
  readonly allowHeaders?: string[];
  readonly allowMethods?: string[];
  readonly allowOrigins?: string[];
  readonly exposeHeaders?: string[];
  readonly maxAge?: number;
}

/**
 * Complete definition of a REST API extracted from Gen1 cli-inputs.json.
 */
export interface RestApiDefinition {
  readonly apiName: string;
  readonly functionName: string;
  readonly paths: RestApiPath[];
  readonly authType?: string;
  readonly corsConfiguration?: CorsConfiguration;
  readonly uniqueFunctions?: string[];
}

/**
 * Facade for all Gen1 app state — both local files and AWS resources.
 *
 * Local state (amplify-meta.json, cloud backend files) is read and cached
 * by this class directly. AWS SDK calls are delegated to {@link AwsFetcher}.
 *
 * Every generator receives this facade. Easy to mock: stub `fetcher` for
 * AWS calls, or override local-reading methods for file-based state.
 */
export class Gen1App {
  public readonly appId: string;
  public readonly region: string;
  public readonly envName: string;
  public readonly clients: AwsClients;
  public readonly backendDownloader: BackendDownloader;
  /**
   * AWS SDK fetcher for all remote resource introspection.
   */
  public readonly aws: AwsFetcher;

  private cachedBackendEnv: BackendEnvironment | undefined;
  private cachedCcbDir: string | undefined;
  private cachedMeta: $TSMeta | undefined;

  public constructor(opts: Gen1AppOptions) {
    this.appId = opts.appId;
    this.region = opts.region;
    this.envName = opts.envName;
    this.clients = opts.clients;
    this.backendDownloader = new BackendDownloader(opts.clients.s3);
    this.aws = new AwsFetcher(opts.clients);
  }

  // ── Backend environment ──────────────────────────────────────────

  /**
   * Resolves and caches the backend environment.
   */
  public async fetchBackendEnvironment(): Promise<BackendEnvironment> {
    if (this.cachedBackendEnv) return this.cachedBackendEnv;
    const { backendEnvironment } = await this.clients.amplify.send(
      new GetBackendEnvironmentCommand({ appId: this.appId, environmentName: this.envName }),
    );
    if (!backendEnvironment) {
      throw new Error(`No backend environment found for app ${this.appId}, env ${this.envName}`);
    }
    this.cachedBackendEnv = backendEnvironment;
    return backendEnvironment;
  }

  /**
   * Returns the root stack name from the backend environment.
   */
  public async fetchRootStackName(): Promise<string> {
    const env = await this.fetchBackendEnvironment();
    if (!env.stackName) {
      throw new Error('Backend environment has no stack name');
    }
    return env.stackName;
  }

  // ── Current cloud backend (local files from S3) ──────────────────

  /**
   * Downloads and caches the current cloud backend zip from S3.
   */
  public async fetchCloudBackendDir(): Promise<string> {
    if (this.cachedCcbDir) return this.cachedCcbDir;
    const env = await this.fetchBackendEnvironment();
    if (!env.deploymentArtifacts) {
      throw new Error('Backend environment has no deployment artifacts');
    }
    this.cachedCcbDir = await this.backendDownloader.getCurrentCloudBackend(env.deploymentArtifacts);
    return this.cachedCcbDir;
  }

  // ── amplify-meta.json ────────────────────────────────────────────

  /**
   * Reads and caches amplify-meta.json from the cloud backend.
   */
  public async fetchMeta(): Promise<$TSMeta> {
    if (this.cachedMeta) return this.cachedMeta;
    const ccbDir = await this.fetchCloudBackendDir();
    const metaPath = path.join(ccbDir, 'amplify-meta.json');
    if (!(await fileOrDirectoryExists(metaPath))) {
      throw new Error('Could not find amplify-meta.json');
    }
    const meta = JSONUtilities.readJson<$TSMeta>(metaPath, { throwIfNotExist: true });
    if (!meta) {
      throw new Error('Failed to parse amplify-meta.json');
    }
    this.cachedMeta = meta;
    return meta;
  }

  /**
   * Returns the category block from amplify-meta.json, or undefined.
   */
  public async fetchMetaCategory(category: string): Promise<Record<string, unknown> | undefined> {
    const meta = await this.fetchMeta();
    const block = (meta as Record<string, unknown>)[category];
    if (block && typeof block === 'object' && Object.keys(block as object).length > 0) {
      return block as Record<string, unknown>;
    }
    return undefined;
  }

  // ── Local project files ─────────────────────────────────────────

  /**
   * Reads the GraphQL schema from the local Gen1 project.
   * Supports both single schema.graphql and multi-file schema/ directory.
   */
  public async fetchGraphQLSchema(apiName: string): Promise<string> {
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
    try {
      return await fs.readFile(path.join(apiPath, 'schema.graphql'), 'utf8');
    } catch {
      throw new Error(`No GraphQL schema found for API '${apiName}' in ${apiPath}`);
    }
  }

  // ── CloudFormation stack resources ───────────────────────────────

  /**
   * Fetches and caches all leaf stack resources from the root stack.
   */
  public async fetchAllStackResources(): Promise<StackResource[]> {
    const stackName = await this.fetchRootStackName();
    return this.aws.fetchAllStackResources(stackName);
  }

  /**
   * Returns stack resources indexed by LogicalResourceId.
   */
  public async fetchResourcesByLogicalId(): Promise<Record<string, StackResource>> {
    const stackName = await this.fetchRootStackName();
    return this.aws.fetchResourcesByLogicalId(stackName);
  }

  // ── Auth trigger connections (local file reading) ────────────────

  /**
   * Reads auth trigger connections from the cloud backend cli-inputs.json.
   */
  public async fetchAuthTriggerConnections(): Promise<Partial<Record<keyof LambdaConfigType, string>> | undefined> {
    const ccbDir = await this.fetchCloudBackendDir();
    const meta = await this.fetchMeta();
    const authCategory = meta.auth;
    if (!authCategory) return undefined;

    for (const resourceName of Object.keys(authCategory)) {
      const triggerFilePath = path.join(ccbDir, 'auth', resourceName, 'cli-inputs.json');
      if (await fileOrDirectoryExists(triggerFilePath)) {
        const contents = await fs.readFile(triggerFilePath, { encoding: 'utf8' });
        const cliInputs = JSON.parse(contents);
        if (cliInputs?.cognitoConfig?.triggers) {
          const triggers =
            typeof cliInputs.cognitoConfig.triggers === 'string'
              ? JSON.parse(cliInputs.cognitoConfig.triggers)
              : cliInputs.cognitoConfig.triggers;
          const connections: Partial<Record<keyof LambdaConfigType, string>> = {};
          for (const [triggerName, functionNames] of Object.entries(triggers)) {
            const fns = functionNames as string[];
            if (fns.length > 0) {
              connections[triggerName as keyof LambdaConfigType] = fns[0];
            }
          }
          return Object.keys(connections).length > 0 ? connections : undefined;
        }
      }
    }
    return undefined;
  }

  // ── Cloud backend file reading ──────────────────────────────────

  /**
   * Reads a JSON file from the cloud backend directory.
   */
  public async readCloudBackendJson<T>(relativePath: string): Promise<T | undefined> {
    const ccbDir = await this.fetchCloudBackendDir();
    const filePath = path.join(ccbDir, relativePath);
    if (!(await fileOrDirectoryExists(filePath))) return undefined;
    const contents = await fs.readFile(filePath, { encoding: 'utf8' });
    return JSON.parse(contents) as T;
  }

  /**
   * Reads a text file from the cloud backend directory.
   */
  public async readCloudBackendFile(relativePath: string): Promise<string | undefined> {
    const ccbDir = await this.fetchCloudBackendDir();
    const filePath = path.join(ccbDir, relativePath);
    if (!(await fileOrDirectoryExists(filePath))) return undefined;
    return fs.readFile(filePath, { encoding: 'utf8' });
  }

  /**
   * Checks if a path exists in the cloud backend directory.
   */
  public async cloudBackendPathExists(relativePath: string): Promise<boolean> {
    const ccbDir = await this.fetchCloudBackendDir();
    return fileOrDirectoryExists(path.join(ccbDir, relativePath));
  }

  // ── REST API configuration (local file reading) ─────────────────

  /**
   * Reads REST API configurations from the local Gen1 project's
   * cli-inputs.json files for all API Gateway entries in the given
   * api category block.
   */
  public async fetchRestApiConfigs(apiCategory: Record<string, unknown>): Promise<RestApiDefinition[]> {
    const rootDir = pathManager.findProjectRoot();
    if (!rootDir) {
      throw new Error('Could not find Amplify project root');
    }

    const restApis: RestApiDefinition[] = [];

    for (const apiName of Object.keys(apiCategory)) {
      const apiObj = apiCategory[apiName] as Record<string, unknown>;
      if (apiObj.service !== 'API Gateway') continue;

      const cliInputsPath = path.join(rootDir, 'amplify', 'backend', 'api', apiName, 'cli-inputs.json');
      const cliInputs = JSON.parse(await fs.readFile(cliInputsPath, 'utf8')) as {
        paths?: Record<
          string,
          {
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
        >;
        corsConfiguration?: CorsConfiguration;
        restrictAccess?: boolean;
        authType?: string;
      };

      const paths = cliInputs.paths
        ? Object.entries(cliInputs.paths).map(([pathName, pathConfig]) => {
            const pathAuthType = pathConfig.permissions?.setting || 'open';

            const userPoolGroups = pathConfig.permissions?.groups ? Object.keys(pathConfig.permissions.groups) : undefined;

            const permissions: { hasAuth?: boolean; groups?: Record<string, string[]> } = {};
            if (pathConfig.permissions?.auth && pathConfig.permissions.auth.length > 0) {
              permissions.hasAuth = true;
            }
            if (pathConfig.permissions?.groups && Object.keys(pathConfig.permissions.groups).length > 0) {
              permissions.groups = pathConfig.permissions.groups;
            }

            return {
              path: pathName,
              methods: extractMethodsFromPath(pathConfig),
              authType: pathAuthType,
              lambdaFunction: pathConfig.lambdaFunction,
              userPoolGroups,
              ...(Object.keys(permissions).length > 0 && { permissions }),
            };
          })
        : [{ path: '/{proxy+}', methods: ['ANY'], lambdaFunction: undefined as string | undefined }];

      const hasPathAuth = Object.values(cliInputs.paths || {}).some(
        (p) => p.permissions?.setting === 'private' || p.permissions?.setting === 'protected',
      );

      const authType = cliInputs.restrictAccess || hasPathAuth ? cliInputs.authType || 'AWS_IAM' : undefined;

      const dependsOn = (apiObj.dependsOn ?? []) as Array<{ category: string; resourceName: string }>;
      const defaultFunctionName = dependsOn.find((dep) => dep.category === 'function')?.resourceName;

      const uniqueFunctions = new Set<string>();
      if (defaultFunctionName) {
        uniqueFunctions.add(defaultFunctionName);
      }
      for (const p of paths) {
        if (p.lambdaFunction) {
          uniqueFunctions.add(p.lambdaFunction);
        }
      }

      restApis.push({
        apiName,
        functionName: defaultFunctionName || 'defaultFunction',
        paths,
        authType,
        corsConfiguration: cliInputs.corsConfiguration,
        uniqueFunctions: Array.from(uniqueFunctions),
      });
    }

    return restApis;
  }
}

function extractMethodsFromPath(pathConfig: {
  methods?: string[];
  permissions?: { auth?: string[]; groups?: Record<string, string[]> };
}): string[] {
  if (pathConfig.methods && pathConfig.methods.length > 0) {
    return pathConfig.methods;
  }

  if (pathConfig.permissions?.auth && pathConfig.permissions.auth.length > 0) {
    return mapPermissionsToMethods(pathConfig.permissions.auth);
  }

  if (pathConfig.permissions?.groups) {
    const allPermissions = new Set<string>();
    for (const permissions of Object.values(pathConfig.permissions.groups)) {
      for (const permission of permissions) {
        allPermissions.add(permission);
      }
    }
    return mapPermissionsToMethods(Array.from(allPermissions));
  }

  return ['GET'];
}

function mapPermissionsToMethods(permissions: string[]): string[] {
  const methodMap: Record<string, string> = {
    read: 'GET',
    create: 'POST',
    update: 'PUT',
    delete: 'DELETE',
  };

  const methods = permissions.map((p) => methodMap[p]).filter((m): m is string => m !== undefined);

  return methods.length > 0 ? methods : ['GET'];
}
