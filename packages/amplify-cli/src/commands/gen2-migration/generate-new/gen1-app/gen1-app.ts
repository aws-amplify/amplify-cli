import path from 'node:path';
import fs from 'node:fs/promises';
import { BackendEnvironment, GetBackendEnvironmentCommand } from '@aws-sdk/client-amplify';
import {
  DescribeUserPoolCommand,
  DescribeUserPoolClientCommand,
  ListIdentityProvidersCommand,
  ListGroupsCommand,
  DescribeIdentityProviderCommand,
  GetUserPoolMfaConfigCommand,
  UserPoolType,
  UserPoolClientType,
  GroupType,
  IdentityProviderType,
  UserPoolMfaType,
  SoftwareTokenMfaConfigType,
  LambdaConfigType,
} from '@aws-sdk/client-cognito-identity-provider';
import { DescribeIdentityPoolCommand } from '@aws-sdk/client-cognito-identity';
import { GetFunctionCommand, GetPolicyCommand, FunctionConfiguration } from '@aws-sdk/client-lambda';
import { DescribeRuleCommand } from '@aws-sdk/client-cloudwatch-events';
import {
  GetBucketNotificationConfigurationCommand,
  GetBucketAccelerateConfigurationCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import { StackResource } from '@aws-sdk/client-cloudformation';
import { $TSMeta, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { AwsClients } from './aws-clients';
import { AmplifyStackParser } from './amplify-stack-parser';
import { BackendDownloader } from './backend-downloader';
import { fileOrDirectoryExists } from './file-exists';

/** Constructor options for Gen1App. */
interface Gen1AppOptions {
  readonly appId: string;
  readonly region: string;
  readonly envName: string;
  readonly clients: AwsClients;
}

/** MFA configuration from Cognito. */
interface MfaConfig {
  readonly mfaConfig?: UserPoolMfaType;
  readonly totpConfig?: SoftwareTokenMfaConfigType;
}

/** Identity pool configuration. */
interface IdentityPoolInfo {
  readonly guestLogin?: boolean;
  readonly identityPoolName?: string;
}

/**
 * Lazy-loading, caching facade for all Gen1 app state.
 *
 * Every generator receives this facade. Each `fetch*` method calls AWS
 * on first invocation and caches the result. Returns raw SDK types
 * directly — no custom intermediate interfaces.
 */
export class Gen1App {
  public readonly appId: string;
  public readonly region: string;
  public readonly envName: string;
  public readonly clients: AwsClients;
  public readonly stackParser: AmplifyStackParser;
  public readonly backendDownloader: BackendDownloader;

  private cachedBackendEnv: BackendEnvironment | undefined;
  private cachedCcbDir: string | undefined;
  private cachedMeta: $TSMeta | undefined;
  private cachedStackResources: StackResource[] | undefined;
  private cachedResourcesByLogicalId: Record<string, StackResource> | undefined;
  private cachedUserPool: UserPoolType | undefined | null;
  private cachedMfaConfig: MfaConfig | undefined;
  private cachedWebClient: UserPoolClientType | undefined | null;
  private cachedUserPoolClient: UserPoolClientType | undefined | null;
  private cachedIdentityProviders: IdentityProviderType[] | undefined;
  private cachedIdentityGroups: GroupType[] | undefined;
  private cachedIdentityPool: IdentityPoolInfo | undefined | null;
  private readonly cachedFunctionConfigs = new Map<string, FunctionConfiguration>();

  public constructor(opts: Gen1AppOptions) {
    this.appId = opts.appId;
    this.region = opts.region;
    this.envName = opts.envName;
    this.clients = opts.clients;
    this.stackParser = new AmplifyStackParser(opts.clients.cloudFormation);
    this.backendDownloader = new BackendDownloader(opts.clients.s3);
  }

  // ── Backend environment ──────────────────────────────────────────

  /** Resolves and caches the backend environment. */
  public async fetchBackendEnvironment(): Promise<BackendEnvironment> {
    if (this.cachedBackendEnv) return this.cachedBackendEnv;
    const { backendEnvironment } = await this.clients.amplify.send(
      new GetBackendEnvironmentCommand({
        appId: this.appId,
        environmentName: this.envName,
      }),
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

  // ── Current cloud backend ────────────────────────────────────────

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

  /** Fetches and caches all stack resources from the root stack. */
  public async fetchAllStackResources(): Promise<StackResource[]> {
    if (this.cachedStackResources) return this.cachedStackResources;
    const stackName = await this.fetchRootStackName();
    this.cachedStackResources = await this.stackParser.getAllStackResources(stackName);
    return this.cachedStackResources;
  }

  /** Returns stack resources indexed by LogicalResourceId. */
  public async fetchResourcesByLogicalId(): Promise<Record<string, StackResource>> {
    if (this.cachedResourcesByLogicalId) return this.cachedResourcesByLogicalId;
    const resources = await this.fetchAllStackResources();
    this.cachedResourcesByLogicalId = this.stackParser.getResourcesByLogicalId(resources);
    return this.cachedResourcesByLogicalId;
  }

  // ── Auth (Cognito) ──────────────────────────────────────────────

  /** Fetches the Cognito User Pool. Returns undefined if no UserPool resource exists. */
  public async fetchUserPool(): Promise<UserPoolType | undefined> {
    if (this.cachedUserPool !== undefined) return this.cachedUserPool ?? undefined;
    const resources = await this.fetchResourcesByLogicalId();
    if (!resources['UserPool']) {
      this.cachedUserPool = null;
      return undefined;
    }
    const { UserPool } = await this.clients.cognitoIdentityProvider.send(
      new DescribeUserPoolCommand({
        UserPoolId: resources['UserPool'].PhysicalResourceId,
      }),
    );
    this.cachedUserPool = UserPool ?? null;
    return this.cachedUserPool ?? undefined;
  }

  /** Fetches MFA configuration for the user pool. */
  public async fetchMfaConfig(): Promise<MfaConfig | undefined> {
    if (this.cachedMfaConfig) return this.cachedMfaConfig;
    const resources = await this.fetchResourcesByLogicalId();
    if (!resources['UserPool']) return undefined;
    const result = await this.clients.cognitoIdentityProvider.send(
      new GetUserPoolMfaConfigCommand({
        UserPoolId: resources['UserPool'].PhysicalResourceId,
      }),
    );
    this.cachedMfaConfig = {
      mfaConfig: result.MfaConfiguration,
      totpConfig: result.SoftwareTokenMfaConfiguration,
    };
    return this.cachedMfaConfig;
  }

  /** Fetches the web user pool client. */
  public async fetchWebClient(): Promise<UserPoolClientType | undefined> {
    if (this.cachedWebClient !== undefined) return this.cachedWebClient ?? undefined;
    const resources = await this.fetchResourcesByLogicalId();
    if (!resources['UserPool'] || !resources['UserPoolClientWeb']) {
      this.cachedWebClient = null;
      return undefined;
    }
    const { UserPoolClient } = await this.clients.cognitoIdentityProvider.send(
      new DescribeUserPoolClientCommand({
        UserPoolId: resources['UserPool'].PhysicalResourceId,
        ClientId: resources['UserPoolClientWeb'].PhysicalResourceId,
      }),
    );
    this.cachedWebClient = UserPoolClient ?? null;
    return this.cachedWebClient ?? undefined;
  }

  /** Fetches the non-web user pool client. */
  public async fetchUserPoolClient(): Promise<UserPoolClientType | undefined> {
    if (this.cachedUserPoolClient !== undefined) return this.cachedUserPoolClient ?? undefined;
    const resources = await this.fetchResourcesByLogicalId();
    if (!resources['UserPool'] || !resources['UserPoolClient']) {
      this.cachedUserPoolClient = null;
      return undefined;
    }
    const { UserPoolClient } = await this.clients.cognitoIdentityProvider.send(
      new DescribeUserPoolClientCommand({
        UserPoolId: resources['UserPool'].PhysicalResourceId,
        ClientId: resources['UserPoolClient'].PhysicalResourceId,
      }),
    );
    this.cachedUserPoolClient = UserPoolClient ?? null;
    return this.cachedUserPoolClient ?? undefined;
  }

  /** Fetches identity provider details for the user pool. */
  public async fetchIdentityProviders(): Promise<IdentityProviderType[]> {
    if (this.cachedIdentityProviders) return this.cachedIdentityProviders;
    const resources = await this.fetchResourcesByLogicalId();
    if (!resources['UserPool']) {
      this.cachedIdentityProviders = [];
      return [];
    }
    const userPoolId = resources['UserPool'].PhysicalResourceId;
    const { Providers } = await this.clients.cognitoIdentityProvider.send(new ListIdentityProvidersCommand({ UserPoolId: userPoolId }));
    const details: IdentityProviderType[] = [];
    for (const provider of Providers ?? []) {
      const { IdentityProvider } = await this.clients.cognitoIdentityProvider.send(
        new DescribeIdentityProviderCommand({
          UserPoolId: userPoolId,
          ProviderName: provider.ProviderName,
        }),
      );
      if (IdentityProvider) details.push(IdentityProvider);
    }
    this.cachedIdentityProviders = details;
    return details;
  }

  /** Fetches user pool groups. */
  public async fetchIdentityGroups(): Promise<GroupType[]> {
    if (this.cachedIdentityGroups) return this.cachedIdentityGroups;
    const resources = await this.fetchResourcesByLogicalId();
    if (!resources['UserPool']) {
      this.cachedIdentityGroups = [];
      return [];
    }
    const { Groups } = await this.clients.cognitoIdentityProvider.send(
      new ListGroupsCommand({ UserPoolId: resources['UserPool'].PhysicalResourceId }),
    );
    this.cachedIdentityGroups = Groups ?? [];
    return this.cachedIdentityGroups;
  }

  /** Fetches identity pool configuration (guest login, pool name). */
  public async fetchIdentityPool(): Promise<IdentityPoolInfo | undefined> {
    if (this.cachedIdentityPool !== undefined) return this.cachedIdentityPool ?? undefined;
    const resources = await this.fetchResourcesByLogicalId();
    if (!resources['IdentityPool']) {
      this.cachedIdentityPool = null;
      return undefined;
    }
    const result = await this.clients.cognitoIdentity.send(
      new DescribeIdentityPoolCommand({
        IdentityPoolId: resources['IdentityPool'].PhysicalResourceId,
      }),
    );
    this.cachedIdentityPool = {
      guestLogin: result.AllowUnauthenticatedIdentities,
      identityPoolName: result.IdentityPoolName,
    };
    return this.cachedIdentityPool;
  }

  // ── Auth trigger connections ─────────────────────────────────────

  /** Reads auth trigger connections from the cloud backend. */
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

  // ── Functions (Lambda) ──────────────────────────────────────────

  /** Fetches a Lambda function configuration by its deployed name. */
  public async fetchFunctionConfig(deployedName: string): Promise<FunctionConfiguration | undefined> {
    if (this.cachedFunctionConfigs.has(deployedName)) return this.cachedFunctionConfigs.get(deployedName);
    try {
      const result = await this.clients.lambda.send(new GetFunctionCommand({ FunctionName: deployedName }));
      const config = result.Configuration ?? undefined;
      if (config) this.cachedFunctionConfigs.set(deployedName, config);
      return config;
    } catch {
      return undefined;
    }
  }

  /** Fetches the CloudWatch schedule expression for a Lambda function. */
  public async fetchFunctionSchedule(deployedName: string): Promise<string | undefined> {
    try {
      const policyResponse = await this.clients.lambda.send(new GetPolicyCommand({ FunctionName: deployedName }));
      const policy = JSON.parse(policyResponse.Policy ?? '{}');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ruleName = policy.Statement?.find((s: any) => s.Condition?.ArnLike?.['AWS:SourceArn']?.includes('rule/'))
        ?.Condition.ArnLike['AWS:SourceArn'].split('/')
        .pop();

      if (!ruleName) return undefined;

      const ruleResponse = await this.clients.cloudWatchEvents.send(new DescribeRuleCommand({ Name: ruleName }));
      return ruleResponse.ScheduleExpression;
    } catch {
      return undefined;
    }
  }

  // ── Storage (S3) ────────────────────────────────────────────────

  /** Fetches S3 bucket notification configuration. */
  public async fetchBucketNotifications(bucketName: string) {
    return this.clients.s3.send(new GetBucketNotificationConfigurationCommand({ Bucket: bucketName }));
  }

  /** Fetches S3 bucket accelerate status. */
  public async fetchBucketAccelerate(bucketName: string) {
    const { Status } = await this.clients.s3.send(new GetBucketAccelerateConfigurationCommand({ Bucket: bucketName }));
    return Status;
  }

  /** Fetches S3 bucket versioning status. */
  public async fetchBucketVersioning(bucketName: string) {
    const { Status } = await this.clients.s3.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
    return Status;
  }

  /** Fetches S3 bucket encryption configuration. */
  public async fetchBucketEncryption(bucketName: string) {
    const { ServerSideEncryptionConfiguration } = await this.clients.s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
    return ServerSideEncryptionConfiguration;
  }

  // ── Cloud backend file reading ──────────────────────────────────

  /** Reads a JSON file from the cloud backend directory. */
  public async readCloudBackendJson<T>(relativePath: string): Promise<T | undefined> {
    const ccbDir = await this.fetchCloudBackendDir();
    const filePath = path.join(ccbDir, relativePath);
    if (!(await fileOrDirectoryExists(filePath))) return undefined;
    const contents = await fs.readFile(filePath, { encoding: 'utf8' });
    return JSON.parse(contents) as T;
  }

  /** Reads a text file from the cloud backend directory. */
  public async readCloudBackendFile(relativePath: string): Promise<string | undefined> {
    const ccbDir = await this.fetchCloudBackendDir();
    const filePath = path.join(ccbDir, relativePath);
    if (!(await fileOrDirectoryExists(filePath))) return undefined;
    return fs.readFile(filePath, { encoding: 'utf8' });
  }

  /** Checks if a path exists in the cloud backend directory. */
  public async cloudBackendPathExists(relativePath: string): Promise<boolean> {
    const ccbDir = await this.fetchCloudBackendDir();
    return fileOrDirectoryExists(path.join(ccbDir, relativePath));
  }
}
