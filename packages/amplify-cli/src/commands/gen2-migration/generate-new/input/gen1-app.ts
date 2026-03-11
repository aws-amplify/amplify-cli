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
  /**
   * The Amplify app ID.
   */
  public readonly appId: string;

  /**
   * The AWS region.
   */
  public readonly region: string;

  /**
   * The backend environment name.
   */
  public readonly envName: string;

  /**
   * AWS SDK clients — exposed because generators need direct access
   * to service clients not yet wrapped by {@link AwsFetcher}.
   */
  public readonly clients: AwsClients;

  private readonly backendDownloader: BackendDownloader;

  /**
   * AWS SDK fetcher for all remote resource introspection.
   */
  public readonly aws: AwsFetcher;

  private cachedBackendEnv: BackendEnvironment | undefined;
  private cachedCcbDir: string | undefined;
  private cachedMeta: $TSMeta | undefined;
  private cachedFunctionCategoryMap: ReadonlyMap<string, string> | undefined;
  private cachedFunctionNames: ReadonlySet<string> | undefined;

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

  // ── Function metadata ──────────────────────────────────────────

  /**
   * Returns a map of function resource names to their effective category
   * (auth, storage, or function), derived from dependsOn relationships
   * in amplify-meta.json.
   *
   * A function's category is determined by which other category depends
   * on it (auth triggers → 'auth', storage triggers → 'storage') or
   * which category it depends on (function depends on storage → 'storage').
   * Functions with no cross-category dependencies default to 'function'.
   */
  public async fetchFunctionCategoryMap(): Promise<ReadonlyMap<string, string>> {
    if (this.cachedFunctionCategoryMap) return this.cachedFunctionCategoryMap;

    const meta = await this.fetchMeta();
    const categoryMap = new Map<string, string>();
    const auth = meta.auth as Record<string, Record<string, unknown>> | undefined;
    const storage = meta.storage as Record<string, Record<string, unknown>> | undefined;
    const functions = meta.function as Record<string, Record<string, unknown>> | undefined;

    // Auth triggers (auth depends on function)
    if (auth) {
      for (const authResource of Object.values(auth)) {
        if (authResource.dependsOn) {
          for (const dep of authResource.dependsOn as Array<{ category: string; resourceName: string }>) {
            if (dep.category === 'function') {
              categoryMap.set(dep.resourceName, 'auth');
            }
          }
        }
      }
    }

    // Storage triggers (storage depends on function)
    if (storage) {
      for (const storageResource of Object.values(storage)) {
        if (storageResource.dependsOn) {
          for (const dep of storageResource.dependsOn as Array<{ category: string; resourceName: string }>) {
            if (dep.category === 'function') {
              categoryMap.set(dep.resourceName, 'storage');
            }
          }
        }
      }
    }

    // DynamoDB stream triggers (function depends on storage)
    if (functions) {
      for (const [funcName, funcResource] of Object.entries(functions)) {
        if (funcResource.dependsOn) {
          for (const dep of funcResource.dependsOn as Array<{ category: string; resourceName: string }>) {
            if (dep.category === 'storage') {
              categoryMap.set(funcName, 'storage');
            }
          }
        }
      }
    }

    this.cachedFunctionCategoryMap = categoryMap;
    return categoryMap;
  }

  /**
   * Returns the set of all function resource names from amplify-meta.json.
   */
  public async fetchFunctionNames(): Promise<ReadonlySet<string>> {
    if (this.cachedFunctionNames) return this.cachedFunctionNames;

    const meta = await this.fetchMeta();
    this.cachedFunctionNames = new Set(Object.keys((meta.function as object) ?? {}));
    return this.cachedFunctionNames;
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
          for (const [triggerName] of Object.entries(triggers)) {
            // Normalize trigger name casing: Gen1 uses "PreSignup" but Cognito uses "PreSignUp"
            const cognitoTriggerName = triggerName === 'PreSignup' ? 'PreSignUp' : triggerName;
            // Function name follows Gen1 convention: {authResourceName}{triggerName}
            const functionName = `${resourceName}${triggerName}`;
            connections[cognitoTriggerName as keyof LambdaConfigType] = path.join('amplify', 'backend', 'function', functionName, 'src');
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
   * Throws if the file does not exist or cannot be parsed.
   */
  public async readCloudBackendJson<T>(relativePath: string): Promise<T> {
    const ccbDir = await this.fetchCloudBackendDir();
    const filePath = path.join(ccbDir, relativePath);
    const result = JSONUtilities.readJson<T>(filePath, { throwIfNotExist: true });
    if (!result) {
      throw new Error(`Failed to parse cloud backend file: ${relativePath}`);
    }
    return result;
  }

  /**
   * Reads a text file from the cloud backend directory.
   * Throws if the file does not exist.
   */
  public async readCloudBackendFile(relativePath: string): Promise<string> {
    const ccbDir = await this.fetchCloudBackendDir();
    const filePath = path.join(ccbDir, relativePath);
    if (!(await fileOrDirectoryExists(filePath))) {
      throw new Error(`Cloud backend file not found: ${relativePath}`);
    }
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
      const cliInputs = JSON.parse(await fs.readFile(cliInputsPath, 'utf8')) as RestApiCliInputs;

      const paths = cliInputs.paths ? parseRestApiPaths(cliInputs.paths) : [{ path: '/{proxy+}', methods: ['ANY'] }];

      const hasPathAuth = Object.values(cliInputs.paths || {}).some(
        (p) => p.permissions?.setting === 'private' || p.permissions?.setting === 'protected',
      );
      const authType = cliInputs.restrictAccess || hasPathAuth ? cliInputs.authType || 'AWS_IAM' : undefined;

      const dependsOn = (apiObj.dependsOn ?? []) as Array<{ category: string; resourceName: string }>;
      const defaultFunctionName = dependsOn.find((dep) => dep.category === 'function')?.resourceName;

      restApis.push({
        apiName,
        functionName: defaultFunctionName || 'defaultFunction',
        paths,
        authType,
        corsConfiguration: cliInputs.corsConfiguration,
        uniqueFunctions: collectUniqueFunctions(paths, defaultFunctionName),
      });
    }

    return restApis;
  }
}

interface RestApiCliInputs {
  readonly paths?: Record<string, RestApiPathConfig>;
  readonly corsConfiguration?: CorsConfiguration;
  readonly restrictAccess?: boolean;
  readonly authType?: string;
}

interface RestApiPathConfig {
  readonly methods?: string[];
  readonly permissions?: {
    readonly setting?: 'private' | 'protected' | 'open';
    readonly auth?: string[];
    readonly groups?: Record<string, string[]>;
  };
  readonly lambdaFunction?: string;
  readonly restrictAccess?: boolean;
  readonly groupAccess?: string[];
}

function parseRestApiPaths(paths: Record<string, RestApiPathConfig>): RestApiPath[] {
  return Object.entries(paths).map(([pathName, pathConfig]) => {
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
  });
}

function collectUniqueFunctions(paths: readonly RestApiPath[], defaultFunctionName?: string): string[] {
  const uniqueFunctions = new Set<string>();
  if (defaultFunctionName) {
    uniqueFunctions.add(defaultFunctionName);
  }
  for (const p of paths) {
    if (p.lambdaFunction) {
      uniqueFunctions.add(p.lambdaFunction);
    }
  }
  return Array.from(uniqueFunctions);
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
