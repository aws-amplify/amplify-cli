import path from 'node:path';
import fs from 'node:fs/promises';
import { BackendEnvironment, GetBackendEnvironmentCommand } from '@aws-sdk/client-amplify';
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
 * Facade for all Gen1 app state — both local files and AWS resources.
 *
 * Provides generic, category-agnostic access to the Gen1 project:
 * amplify-meta.json, cloud backend files, backend environment, and
 * CloudFormation stack resources. Category-specific logic (GraphQL
 * schemas, auth triggers, REST API configs, function categories)
 * lives in the respective generators.
 *
 * AWS SDK calls are delegated to {@link AwsFetcher}. Every generator
 * receives this facade. Easy to mock: stub only the methods your
 * test needs.
 */
export class Gen1App {
  /** The Amplify app ID. */
  public readonly appId: string;

  /** The AWS region. */
  public readonly region: string;

  /** The backend environment name. */
  public readonly envName: string;

  /**
   * AWS SDK clients — exposed for generators that need direct access
   * to service clients not yet wrapped by {@link AwsFetcher}.
   */
  public readonly clients: AwsClients;

  /** AWS SDK fetcher for all remote resource introspection. */
  public readonly aws: AwsFetcher;

  private readonly backendDownloader: BackendDownloader;
  private cachedBackendEnv: BackendEnvironment | undefined;
  private cachedCcbDir: string | undefined;
  private cachedMeta: $TSMeta | undefined;
  private cachedProjectRoot: string | undefined;

  public constructor(opts: Gen1AppOptions) {
    this.appId = opts.appId;
    this.region = opts.region;
    this.envName = opts.envName;
    this.clients = opts.clients;
    this.backendDownloader = new BackendDownloader(opts.clients.s3);
    this.aws = new AwsFetcher(opts.clients);
  }

  // ── Project root ─────────────────────────────────────────────────

  /**
   * Returns the Amplify project root directory.
   * Throws if the project root cannot be found.
   */
  public findProjectRoot(): string {
    if (this.cachedProjectRoot) return this.cachedProjectRoot;
    const rootDir = pathManager.findProjectRoot();
    if (!rootDir) {
      throw new Error('Could not find Amplify project root');
    }
    this.cachedProjectRoot = rootDir;
    return rootDir;
  }

  // ── Backend environment ──────────────────────────────────────────

  /** Resolves and caches the backend environment. */
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

  /** Returns the root stack name from the backend environment. */
  public async fetchRootStackName(): Promise<string> {
    const env = await this.fetchBackendEnvironment();
    if (!env.stackName) {
      throw new Error('Backend environment has no stack name');
    }
    return env.stackName;
  }

  // ── Current cloud backend (local files from S3) ──────────────────

  /** Downloads and caches the current cloud backend zip from S3. */
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

  /** Reads and caches amplify-meta.json from the cloud backend. */
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

  /** Returns the category block from amplify-meta.json, or undefined. */
  public async fetchMetaCategory(category: string): Promise<Record<string, unknown> | undefined> {
    const meta = await this.fetchMeta();
    const block = (meta as Record<string, unknown>)[category];
    if (block && typeof block === 'object' && Object.keys(block as object).length > 0) {
      return block as Record<string, unknown>;
    }
    return undefined;
  }

  // ── CloudFormation stack resources ───────────────────────────────

  /** Fetches and caches all leaf stack resources from the root stack. */
  public async fetchAllStackResources(): Promise<StackResource[]> {
    const stackName = await this.fetchRootStackName();
    return this.aws.fetchAllStackResources(stackName);
  }

  /** Returns stack resources indexed by LogicalResourceId. */
  public async fetchResourcesByLogicalId(): Promise<Record<string, StackResource>> {
    const stackName = await this.fetchRootStackName();
    return this.aws.fetchResourcesByLogicalId(stackName);
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

  /** Checks if a path exists in the cloud backend directory. */
  public async cloudBackendPathExists(relativePath: string): Promise<boolean> {
    const ccbDir = await this.fetchCloudBackendDir();
    return fileOrDirectoryExists(path.join(ccbDir, relativePath));
  }
}
