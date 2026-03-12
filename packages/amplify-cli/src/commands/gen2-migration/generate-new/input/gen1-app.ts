import path from 'node:path';
import fs from 'node:fs/promises';
import { BackendEnvironment, GetBackendEnvironmentCommand } from '@aws-sdk/client-amplify';
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
 * Provides generic, category-agnostic access to the Gen1 project:
 * amplify-meta.json, cloud backend files, backend environment, and
 * CloudFormation stack resources. Category-specific logic (GraphQL
 * schemas, auth triggers, REST API configs, function categories)
 * lives in the respective generators.
 *
 * Constructed via the static {@link Gen1App.create} factory, which
 * resolves the backend environment and downloads the cloud backend
 * from S3. After construction, all local state is available
 * synchronously. AWS SDK calls are delegated to {@link AwsFetcher}.
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

  /** The resolved backend environment from the Amplify API. */
  public readonly backendEnvironment: BackendEnvironment;

  /** Absolute path to the downloaded cloud backend directory. */
  public readonly ccbDir: string;

  /** The root CloudFormation stack name. */
  public readonly rootStackName: string;

  private readonly amplifyMeta: $TSMeta;

  private constructor(opts: Gen1AppOptions, backendEnvironment: BackendEnvironment, ccbDir: string, amplifyMeta: $TSMeta) {
    this.appId = opts.appId;
    this.region = opts.region;
    this.envName = opts.envName;
    this.clients = opts.clients;
    this.aws = new AwsFetcher(opts.clients);
    this.backendEnvironment = backendEnvironment;
    this.ccbDir = ccbDir;
    this.amplifyMeta = amplifyMeta;
    if (!backendEnvironment.stackName) {
      throw new Error('Backend environment has no stack name');
    }
    this.rootStackName = backendEnvironment.stackName;
  }

  /**
   * Creates a Gen1App by resolving the backend environment, downloading
   * the cloud backend from S3, and reading amplify-meta.json.
   */
  public static async create(opts: Gen1AppOptions): Promise<Gen1App> {
    const { backendEnvironment } = await opts.clients.amplify.send(
      new GetBackendEnvironmentCommand({ appId: opts.appId, environmentName: opts.envName }),
    );
    if (!backendEnvironment) {
      throw new Error(`No backend environment found for app ${opts.appId}, env ${opts.envName}`);
    }
    if (!backendEnvironment.deploymentArtifacts) {
      throw new Error('Backend environment has no deployment artifacts');
    }

    const downloader = new BackendDownloader(opts.clients.s3);
    const ccbDir = await downloader.getCurrentCloudBackend(backendEnvironment.deploymentArtifacts);

    const metaPath = path.join(ccbDir, 'amplify-meta.json');
    if (!(await fileOrDirectoryExists(metaPath))) {
      throw new Error('Could not find amplify-meta.json');
    }
    const amplifyMeta = JSONUtilities.readJson<$TSMeta>(metaPath, { throwIfNotExist: true });
    if (!amplifyMeta) {
      throw new Error('Failed to parse amplify-meta.json');
    }

    return new Gen1App(opts, backendEnvironment, ccbDir, amplifyMeta);
  }

  // ── amplify-meta.json ────────────────────────────────────────────

  /** Returns the category block from amplify-meta.json, or undefined if empty/absent. */
  public meta(category: string): Record<string, unknown> | undefined {
    const block = (this.amplifyMeta as Record<string, unknown>)[category];
    if (block && typeof block === 'object' && Object.keys(block as object).length > 0) {
      return block as Record<string, unknown>;
    }
    return undefined;
  }

  /** Returns a resource output value from amplify-meta.json. */
  public metaOutput(category: string, resourceName: string, outputKey: string): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped amplify-meta.json
    return (this.amplifyMeta as any)[category]![resourceName]!.output![outputKey]!;
  }

  // ── Cloud backend file reading ──────────────────────────────────

  /** Reads a JSON CloudFormation template from the cloud backend. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped CloudFormation templates
  public template(relativePath: string): any {
    const filePath = path.join(this.ccbDir, relativePath);
    const result = JSONUtilities.readJson<unknown>(filePath, { throwIfNotExist: true });
    if (!result) {
      throw new Error(`Failed to parse template: ${relativePath}`);
    }
    return result;
  }

  /** Reads cli-inputs.json for a resource in the cloud backend. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped Gen1 cli-inputs.json
  public cliInputsForResource(category: string, resourceName: string): any {
    return this.template(path.join(category, resourceName, 'cli-inputs.json'));
  }

  /** Reads a text file from the cloud backend directory. */
  public async readFile(relativePath: string): Promise<string> {
    const filePath = path.join(this.ccbDir, relativePath);
    if (!(await fileOrDirectoryExists(filePath))) {
      throw new Error(`Cloud backend file not found: ${relativePath}`);
    }
    return fs.readFile(filePath, { encoding: 'utf8' });
  }

  /** Checks if a path exists in the cloud backend directory. */
  public async pathExists(relativePath: string): Promise<boolean> {
    return fileOrDirectoryExists(path.join(this.ccbDir, relativePath));
  }

  // ── CloudFormation stack resources ───────────────────────────────

  /** Fetches all leaf stack resources from the root stack. */
  public async fetchAllStackResources(): Promise<StackResource[]> {
    return this.aws.fetchAllStackResources(this.rootStackName);
  }

  /** Returns stack resources indexed by LogicalResourceId. */
  public async fetchResourcesByLogicalId(): Promise<Record<string, StackResource>> {
    return this.aws.fetchResourcesByLogicalId(this.rootStackName);
  }
}
