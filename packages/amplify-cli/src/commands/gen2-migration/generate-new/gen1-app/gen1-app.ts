import path from 'node:path';
import fs from 'node:fs/promises';
import { BackendEnvironment, GetBackendEnvironmentCommand } from '@aws-sdk/client-amplify';
import { LambdaConfigType } from '@aws-sdk/client-cognito-identity-provider';
import { StackResource } from '@aws-sdk/client-cloudformation';
import { $TSMeta, JSONUtilities } from '@aws-amplify/amplify-cli-core';
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
}
