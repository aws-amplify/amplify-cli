import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { Stream } from 'node:stream';
import unzipper from 'unzipper';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { $TSAny, $TSContext, $TSMeta, AmplifyError, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { AwsClients } from './aws-clients';
import { AwsFetcher } from './aws-fetcher';
import { stateManager, pathManager } from '@aws-amplify/amplify-cli-core';
import { App, GetAppCommand } from '@aws-sdk/client-amplify';
import { DEFAULT_STATEFUL_RESOURCES } from './resource-types';

interface Gen1AppProps {
  readonly ccbDir: string;
  readonly clients: AwsClients;
  readonly app: App;
  readonly envName: string;
  readonly additionalStatefulResourceTypes?: string[];
}

/**
 * All category:service pairs the migration tool supports.
 * Adding a new pair here forces every exhaustive switch on ResourceKey
 * to handle it — the compiler will error on any switch that misses a case.
 */
export const KNOWN_RESOURCE_KEYS = [
  'auth:Cognito',
  'auth:Cognito-UserPool-Groups',
  'storage:S3',
  'storage:DynamoDB',
  'api:AppSync',
  'api:API Gateway',
  'analytics:Kinesis',
  'function:Lambda',
  'geo:Map',
  'geo:PlaceIndex',
  'geo:GeofenceCollection',
  'custom:customCDK',
] as const;

export enum KNOWN_FEATURES {
  OVERRIDES = 'overrides',
  CUSTOM_FUNCTION_POLICIES = 'custom-policies',
  CONFLICT_RESOLUTION = 'conflict-resolution',
}

/**
 * Union of all known category:service pairs, plus 'unsupported' for
 * resources the tool has no migration logic for.
 */
export type ResourceKey = (typeof KNOWN_RESOURCE_KEYS)[number] | 'UNKNOWN';

/**
 * A resource discovered from amplify-meta.json.
 */
export interface DiscoveredResource {
  readonly category: string;
  readonly resourceName: string;
  readonly service: string;
  readonly key: ResourceKey;
}

/**
 * Facade for all Gen1 app state — both local files and AWS resources.
 *
 * Provides generic, category-agnostic access to the Gen1 project.
 * Category-specific logic lives in the respective generators.
 *
 * Constructed via {@link Gen1App.create}, which reads
 * team-provider-info.json, downloads the cloud backend from S3,
 * and reads amplify-meta.json. After construction, all local state
 * is available synchronously. AWS SDK calls are delegated to
 * {@link AwsFetcher}.
 */
export class Gen1App {
  public readonly appId: string;
  public readonly appName: string;
  public readonly region: string;
  public readonly envName: string;
  public readonly clients: AwsClients;
  public readonly aws: AwsFetcher;
  public readonly ccbDir: string;
  public readonly rootStackName: string;
  public readonly deploymentBucket: string;
  public readonly statefulResourceTypes: string[];

  // eslint-disable-next-line @typescript-eslint/naming-convention -- private backing field for meta()
  private readonly _meta: $TSMeta;

  private constructor(props: Gen1AppProps) {
    this.appId = props.app.appId!;
    this.appName = props.app.name!;
    this.envName = props.envName;
    this.clients = props.clients;
    this.ccbDir = props.ccbDir;
    this.aws = new AwsFetcher(this.clients);
    this._meta = JSONUtilities.readJson<$TSMeta>(path.join(this.ccbDir, 'amplify-meta.json'), { throwIfNotExist: true }) as $TSMeta;
    this.rootStackName = this._meta.providers.awscloudformation.StackName;
    this.deploymentBucket = this._meta.providers.awscloudformation.DeploymentBucketName;
    this.region = this._meta.providers.awscloudformation.Region;
    this.statefulResourceTypes = [...Array.from(DEFAULT_STATEFUL_RESOURCES)];
    if (props.additionalStatefulResourceTypes) {
      this.statefulResourceTypes.push(...props.additionalStatefulResourceTypes);
    }
  }

  public static async create(context: $TSContext, additionalStatefulResourceTypesPath?: string): Promise<Gen1App> {
    const clients = await AwsClients.create(context);

    const tpiRelPath = `./${path.relative(process.cwd(), pathManager.getTeamProviderInfoFilePath())}`;
    if (!stateManager.teamProviderInfoExists()) {
      throw new AmplifyError('TeamProviderInfoNotFoundError', {
        message: `Unable to find '${tpiRelPath}' - Are you sure you're on the right branch?`,
        resolution: 'Checkout to the Gen1 branch and rerun the command',
      });
    }
    const tpi = stateManager.getTeamProviderInfo();

    // assuming all environment are deployed within the same app - can it be different?
    const appId = (Object.values(tpi)[0] as $TSAny).awscloudformation.AmplifyAppId;
    const app = await clients.amplify.send(new GetAppCommand({ appId }));

    const envName = await Gen1App.currentEnvName(app.app!);
    const envInfo = tpi[envName];
    if (!envInfo) {
      throw new AmplifyError('TpiEnvironmentNotFoundError', {
        message: `Environment ${envName} does not exist in ${tpiRelPath}`,
        resolution: `Checkout to the branch corresponding to environment ${envName} and rerun the command`,
      });
    }

    const cfnProvider = envInfo.awscloudformation;
    if (!cfnProvider?.StackName || !cfnProvider?.DeploymentBucketName) {
      throw new AmplifyError('InvalidTpiEnvironmentError', {
        message: `Missing StackName or DeploymentBucketName for environment '${envName}' in '${tpiRelPath}'`,
      });
    }

    const additionalStatefulResourceTypes = additionalStatefulResourceTypesPath
      ? JSON.parse(await fs.readFile(additionalStatefulResourceTypesPath, { encoding: 'utf-8' }))
      : undefined;

    if (additionalStatefulResourceTypes && !Array.isArray(additionalStatefulResourceTypes)) {
      throw new AmplifyError('InputValidationError', {
        message: `Invalid file structure: ${additionalStatefulResourceTypesPath}. Must be a JSON array.`,
      });
    }

    const ccbDir = await Gen1App.downloadCloudBackend(clients.s3, cfnProvider.DeploymentBucketName);
    return new Gen1App({ ccbDir, clients, envName, app: app.app!, additionalStatefulResourceTypes });
  }

  /**
   * Returns the category block from amplify-meta.json, or undefined if empty/absent.
   */
  public categoryMeta(category: string): Record<string, unknown> | undefined {
    const block = (this._meta as Record<string, unknown>)[category];
    if (block && typeof block === 'object' && Object.keys(block as object).length > 0) {
      return block as Record<string, unknown>;
    }
    return undefined;
  }

  /**
   * Returns the meta entry for a specific discovered resource.
   * Throws if the category or resource is not found.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public resourceMeta(resource: DiscoveredResource): Record<string, any> {
    const category = this.categoryMeta(resource.category);
    if (!category) {
      throw new AmplifyError('CategoryMetaNotFoundError', {
        message: `Category '${resource.category}' not found in amplify-meta.json`,
      });
    }
    const entry = category[resource.resourceName];
    if (!entry || typeof entry !== 'object') {
      throw new AmplifyError('ResourceMetaNotFoundError', {
        message: `Resource '${resource.resourceName}' not found in '${resource.category}' category in amplify-meta.json`,
      });
    }
    return entry as Record<string, any>;
  }

  /**
   * Iterates all categories in amplify-meta.json and returns a flat list of discovered resources.
   * Skips internal categories (providers, hosting) that are not user-facing Amplify features.
   */
  public discover(): DiscoveredResource[] {
    const meta = this._meta as Record<string, unknown>;
    const skip = new Set(['providers', 'hosting']);
    const resources: DiscoveredResource[] = [];

    for (const [category, block] of Object.entries(meta)) {
      if (skip.has(category) || !block || typeof block !== 'object') continue;
      for (const [resourceName, resourceMeta] of Object.entries(block as Record<string, unknown>)) {
        if (!resourceMeta || typeof resourceMeta !== 'object') {
          throw new AmplifyError('ResourceMetaNotFoundError', { message: `Unable to find meta entry for resource ${resourceName}` });
        }
        const service = (resourceMeta as Record<string, unknown>).service as string | undefined;
        if (!service) {
          throw new AmplifyError('ResourceMetaNotFoundError', {
            message: `Resource '${resourceName}' in category '${category}' is missing the 'service' field in amplify-meta.json`,
          });
        }
        const rawKey = `${category}:${service}`;
        const key: ResourceKey = (KNOWN_RESOURCE_KEYS as readonly string[]).includes(rawKey) ? (rawKey as ResourceKey) : 'UNKNOWN';
        resources.push({ category, resourceName, service, key });
      }
    }

    return resources;
  }

  /**
   * Returns a resource output value from amplify-meta.json.
   */
  public resourceMetaOutput(resource: DiscoveredResource, outputKey: string): string {
    const value = this.tryResourceMetaOutput(resource, outputKey);
    if (value === undefined) {
      throw new AmplifyError('ResourceMetaOutputNotFoundError', {
        message: `Missing output '${outputKey}' for resource '${resource.resourceName}' in category '${resource.category}'`,
      });
    }
    return value;
  }

  /**
   * Returns a resource output value from amplify-meta.json, or undefined if absent.
   * Use for optional outputs that may not exist in all Gen1 configurations.
   */
  public tryResourceMetaOutput(resource: DiscoveredResource, outputKey: string): string | undefined {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped amplify-meta.json
    return (this._meta as any)[resource.category]?.[resource.resourceName]?.output?.[outputKey];
  }

  /**
   * Returns the name of the single resource in a category matching a service type.
   */
  public singleResourceName(category: string, service: string): string {
    const categoryBlock = this.categoryMeta(category);
    if (!categoryBlock) {
      throw new AmplifyError('CategoryMetaNotFoundError', { message: `Category '${category}' not found in amplify-meta.json` });
    }
    const names = Object.keys(categoryBlock).filter((name) => (categoryBlock[name] as Record<string, unknown>).service === service);
    if (names.length !== 1) {
      throw new AmplifyError('ResourceMetaNotFoundError', {
        message: `Expected exactly one '${service}' resource in '${category}', found ${names.length}: ${names.join(', ')}`,
      });
    }
    return names[0];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped CloudFormation templates and config files
  public json(relativePath: string): any {
    return JSONUtilities.readJson(path.join(this.ccbDir, relativePath), { throwIfNotExist: true });
  }

  public file(relativePath: string): string {
    return readFileSync(path.join(this.ccbDir, relativePath), 'utf8');
  }

  /**
   * Returns true if a file exists in the cloud backend directory.
   */
  public fileExists(relativePath: string): boolean {
    try {
      readFileSync(path.join(this.ccbDir, relativePath));
      return true;
    } catch {
      // File does not exist — expected for optional feature files.
      return false;
    }
  }

  public ensureCliInputs(category: string, resourceName: string) {
    const relativePath = path.join(category, resourceName, 'cli-inputs.json');
    const fullPath = path.join(this.ccbDir, relativePath);
    try {
      JSONUtilities.readJson(fullPath, { throwIfNotExist: true });
    } catch {
      throw new AmplifyError('CliInputsFileNotFoundError', {
        message: `Unable to find ${relativePath}. Your app was created with an old Gen1 CLI version (<=v6) that did not produce this file.`,
        resolution:
          'You must first migrate to the latest Gen1 CLI version by following https://docs.amplify.aws/gen1/javascript/tools/cli/migration/override/',
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped Gen1 cli-inputs.json
  public cliInputs(category: string, resourceName: string): any {
    const relativePath = path.join(category, resourceName, 'cli-inputs.json');
    const fullPath = path.join(this.ccbDir, relativePath);
    return JSONUtilities.readJson(fullPath, { throwIfNotExist: true });
  }

  private static async currentEnvName(app: App): Promise<string> {
    const migratingEnvName = (app.environmentVariables ?? {})['GEN2_MIGRATION_ENVIRONMENT_NAME'];
    const localEnvName = stateManager.getCurrentEnvName();

    if (!localEnvName && !migratingEnvName) {
      throw new AmplifyError('EnvironmentNotInitializedError', {
        message: `No environment configured for app '${app.name}'`,
        resolution: 'Run "amplify pull" to configure an environment.',
      });
    }

    if (migratingEnvName && localEnvName && migratingEnvName !== localEnvName) {
      throw new AmplifyError('TpiEnvironmentMismatchError', {
        message: `Environment mismatch: Your local env (${localEnvName}) does 
      not match the environment you marked for migration (${migratingEnvName})`,
      });
    }

    return localEnvName ?? migratingEnvName;
  }

  private static async downloadCloudBackend(s3Client: S3Client, bucket: string): Promise<string> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'amplify-ccb-'));
    const zipKey = '#current-cloud-backend.zip';
    const zipPath = path.join(tmpDir, zipKey);

    const response = await s3Client.send(new GetObjectCommand({ Key: zipKey, Bucket: bucket }));
    if (!response.Body) {
      throw new AmplifyError('S3ObjectNotFoundError', { message: 'S3 GetObject response body is empty' });
    }
    await fs.writeFile(zipPath, response.Body as Stream);

    const directory = await unzipper.Open.file(zipPath);
    const ccbDir = path.join(tmpDir, 'current-cloud-backend');
    await directory.extract({ path: ccbDir });
    return ccbDir;
  }
}
