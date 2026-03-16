import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { Stream } from 'node:stream';
import unzipper from 'unzipper';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { $TSMeta, $TSTeamProviderInfo, AmplifyError, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { AwsClients } from '../../aws-clients';
import { AwsFetcher } from './aws-fetcher';

export interface Gen1CreateOptions {
  readonly appId: string;
  readonly region: string;
  readonly envName: string;
  readonly clients: AwsClients;
}

interface Gen1AppProps extends Gen1CreateOptions {
  readonly ccbDir: string;
  readonly rootStackName: string;
  readonly deploymentBucketName: string;
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
  public readonly region: string;
  public readonly envName: string;
  public readonly clients: AwsClients;
  public readonly aws: AwsFetcher;
  public readonly ccbDir: string;
  public readonly rootStackName: string;
  public readonly deploymentBucketName: string;

  // eslint-disable-next-line @typescript-eslint/naming-convention -- private backing field for meta()
  private readonly _meta: $TSMeta;

  private constructor(props: Gen1AppProps) {
    this.appId = props.appId;
    this.region = props.region;
    this.envName = props.envName;
    this.clients = props.clients;
    this.aws = new AwsFetcher(props.clients);
    this.ccbDir = props.ccbDir;
    this.rootStackName = props.rootStackName;
    this.deploymentBucketName = props.deploymentBucketName;
    this._meta = JSONUtilities.readJson<$TSMeta>(path.join(props.ccbDir, 'amplify-meta.json'), { throwIfNotExist: true }) as $TSMeta;
  }

  public static async create(props: Gen1CreateOptions): Promise<Gen1App> {
    const tpiPath = path.join('amplify', 'team-provider-info.json');
    const tpi = JSONUtilities.readJson<$TSTeamProviderInfo>(tpiPath, { throwIfNotExist: true }) as $TSTeamProviderInfo;
    const envConfig = tpi[props.envName]?.awscloudformation;
    if (!envConfig?.StackName || !envConfig?.DeploymentBucketName) {
      throw new AmplifyError('MigrationError', {
        message: `Missing StackName or DeploymentBucketName for environment '${props.envName}' in team-provider-info.json`,
      });
    }
    const ccbDir = await Gen1App.downloadCloudBackend(props.clients.s3, envConfig.DeploymentBucketName);
    return new Gen1App({ ...props, ccbDir, rootStackName: envConfig.StackName, deploymentBucketName: envConfig.DeploymentBucketName });
  }

  /** Returns the category block from amplify-meta.json, or undefined if empty/absent. */
  public meta(category: string): Record<string, unknown> | undefined {
    const block = (this._meta as Record<string, unknown>)[category];
    if (block && typeof block === 'object' && Object.keys(block as object).length > 0) {
      return block as Record<string, unknown>;
    }
    return undefined;
  }

  /** Returns a resource output value from amplify-meta.json. */
  public metaOutput(category: string, resourceName: string, outputKey: string): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped amplify-meta.json
    const value = (this._meta as any)[category]?.[resourceName]?.output?.[outputKey];
    if (value === undefined) {
      throw new AmplifyError('MigrationError', {
        message: `Missing output '${outputKey}' for resource '${resourceName}' in category '${category}'`,
      });
    }
    return value;
  }

  /** Returns the name of the single resource in a category matching a service type. */
  public singleResourceName(category: string, service: string): string {
    const categoryBlock = this.meta(category);
    if (!categoryBlock) {
      throw new AmplifyError('MigrationError', { message: `Category '${category}' not found in amplify-meta.json` });
    }
    const names = Object.keys(categoryBlock).filter((name) => (categoryBlock[name] as Record<string, unknown>).service === service);
    if (names.length !== 1) {
      throw new AmplifyError('MigrationError', {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped Gen1 cli-inputs.json
  public cliInputs(category: string, resourceName: string): any {
    return this.json(path.join(category, resourceName, 'cli-inputs.json'));
  }

  private static async downloadCloudBackend(s3Client: S3Client, bucket: string): Promise<string> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'amplify-ccb-'));
    const zipKey = '#current-cloud-backend.zip';
    const zipPath = path.join(tmpDir, zipKey);

    const response = await s3Client.send(new GetObjectCommand({ Key: zipKey, Bucket: bucket }));
    if (!response.Body) {
      throw new AmplifyError('MigrationError', { message: 'S3 GetObject response body is empty' });
    }
    await fs.writeFile(zipPath, response.Body as Stream);

    const directory = await unzipper.Open.file(zipPath);
    const ccbDir = path.join(tmpDir, 'current-cloud-backend');
    await directory.extract({ path: ccbDir });
    return ccbDir;
  }
}
