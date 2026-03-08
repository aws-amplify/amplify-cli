import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert';
import { BackendEnvironment, GetBackendEnvironmentCommand } from '@aws-sdk/client-amplify';
import {
  CognitoIdentityProviderClient,
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
import { DescribeIdentityPoolCommand, GetIdentityPoolRolesCommand } from '@aws-sdk/client-cognito-identity';
import { GetFunctionCommand, GetPolicyCommand, FunctionConfiguration } from '@aws-sdk/client-lambda';
import { DescribeRuleCommand } from '@aws-sdk/client-cloudwatch-events';
import {
  GetBucketNotificationConfigurationCommand,
  GetBucketAccelerateConfigurationCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import { StackResource } from '@aws-sdk/client-cloudformation';
import { $TSMeta, JSONUtilities, stateManager } from '@aws-amplify/amplify-cli-core';
import { AwsClients } from './aws-clients';
import { AmplifyStackParser } from '../../generate/codegen-head/amplify_stack_parser';
import { BackendDownloader } from '../../generate/codegen-head/backend_downloader';
import { fileOrDirectoryExists } from '../../generate/codegen-head/directory_exists';

/**
 * Lazy-loading, caching facade for all Gen1 app state.
 *
 * Every generator receives this facade. Each `fetch*` method calls AWS
 * on first invocation and caches the result. Synchronous properties are
 * initialized from local files in the constructor.
 *
 * Returns raw SDK types or parsed file contents directly — no custom
 * intermediate interfaces. Easy to mock: stub only the methods your
 * test needs.
 */
export class Gen1App {
  public readonly appId: string;
  public readonly region: string;
  public readonly envName: string;

  private readonly clients: AwsClients;
  private readonly stackParser: AmplifyStackParser;
  private readonly ccbFetcher: BackendDownloader;

  // Cached values
  private backendEnv: BackendEnvironment | undefined;
  private ccbDir: string | undefined;
  private amplifyMeta: $TSMeta | undefined;
  private stackResources: StackResource[] | undefined;
  private resourcesByLogicalId: Record<string, StackResource> | undefined;

  constructor(opts: {
    readonly appId: string;
    readonly region: string;
    readonly envName: string;
    readonly clients: AwsClients;
  }) {
    this.appId = opts.appId;
    this.region = opts.region;
    this.envName = opts.envName;
    this.clients = opts.clients;
    this.stackParser = new AmplifyStackParser(opts.clients.cloudFormation);
    this.ccbFetcher = new BackendDownloader(opts.clients.s3);
  }

  // ── Backend environment ──────────────────────────────────────────

  /** Resolves and caches the backend environment. */
  async fetchBackendEnvironment(): Promise<BackendEnvironment> {
    if (this.backendEnv) return this.backendEnv;
    const { backendEnvironment } = await this.clients.amplify.send(
      new GetBackendEnvironmentCommand({
        appId: this.appId,
        environmentName: this.envName,
      }),
    );
    assert(backendEnvironment, 'No backend environment found');
    this.backendEnv = backendEnvironment;
    return backendEnvironment;
  }

  // ── Current cloud backend ────────────────────────────────────────

  /** Downloads and caches the current cloud backend zip from S3. */
  async fetchCloudBackendDir(): Promise<string> {
    if (this.ccbDir) return this.ccbDir;
    const env = await this.fetchBackendEnvironment();
    this.ccbDir = await this.ccbFetcher.getCurrentCloudBackend(env.deploymentArtifacts!);
    return this.ccbDir;
  }

  // ── amplify-meta.json ────────────────────────────────────────────

  /** Reads and caches amplify-meta.json from the cloud backend. */
  async fetchMeta(): Promise<$TSMeta> {
    if (this.amplifyMeta) return this.amplifyMeta;
    const ccbDir = await this.fetchCloudBackendDir();
    const metaPath = path.join(ccbDir, 'amplify-meta.json');
    if (!(await fileOrDirectoryExists(metaPath))) {
      throw new Error('Could not find amplify-meta.json');
    }
    this.amplifyMeta = JSONUtilities.readJson<$TSMeta>(metaPath, { throwIfNotExist: true })!;
    return this.amplifyMeta;
  }

  /** Returns the category block from amplify-meta.json, or undefined. */
  async fetchMetaCategory(category: string): Promise<Record<string, unknown> | undefined> {
    const meta = await this.fetchMeta();
    const block = (meta as Record<string, unknown>)[category];
    if (block && typeof block === 'object' && Object.keys(block as object).length > 0) {
      return block as Record<string, unknown>;
    }
    return undefined;
  }

  // ── CloudFormation stack resources ───────────────────────────────

  /** Fetches and caches all stack resources from the root stack. */
  async fetchAllStackResources(): Promise<StackResource[]> {
    if (this.stackResources) return this.stackResources;
    const env = await this.fetchBackendEnvironment();
    assert(env.stackName, 'Backend environment has no stack name');
    this.stackResources = await this.stackParser.getAllStackResources(env.stackName);
    return this.stackResources;
  }

  /** Returns stack resources indexed by LogicalResourceId. */
  async fetchResourcesByLogicalId(): Promise<Record<string, StackResource>> {
    if (this.resourcesByLogicalId) return this.resourcesByLogicalId;
    const resources = await this.fetchAllStackResources();
    this.resourcesByLogicalId = this.stackParser.getResourcesByLogicalId(resources);
    return this.resourcesByLogicalId;
  }

  // ── Auth (Cognito) ──────────────────────────────────────────────

  private userPoolCache: UserPoolType | undefined | null;

  /** Fetches the Cognito User Pool. Returns undefined if no UserPool resource exists. */
  async fetchUserPool(): Promise<UserPoolType | undefined> {
    if (this.userPoolCache !== undefined) return this.userPoolCache ?? undefined;
    const resources = await this.fetchResourcesByLogicalId();
    if (!resources['UserPool']) {
      this.userPoolCache = null;
      return undefined;
    }
    const { UserPool } = await this.clients.cognitoIdentityProvider.send(
      new DescribeUserPoolCommand({
        UserPoolId: resources['UserPool'].PhysicalResourceId,
      }),
    );
    this.userPoolCache = UserPool ?? null;
    return this.userPoolCache ?? undefined;
  }

  private mfaConfigCache: { mfaConfig?: UserPoolMfaType; totpConfig?: SoftwareTokenMfaConfigType } | undefined;

  /** Fetches MFA configuration for the user pool. */
  async fetchMfaConfig(): Promise<{ mfaConfig?: UserPoolMfaType; totpConfig?: SoftwareTokenMfaConfigType } | undefined> {
    if (this.mfaConfigCache) return this.mfaConfigCache;
    const resources = await this.fetchResourcesByLogicalId();
    if (!resources['UserPool']) return undefined;
    const result = await this.clients.cognitoIdentityProvider.send(
      new GetUserPoolMfaConfigCommand({
        UserPoolId: resources['UserPool'].PhysicalResourceId,
      }),
    );
    this.mfaConfigCache = {
      mfaConfig: result.MfaConfiguration,
      totpConfig: result.SoftwareTokenMfaConfiguration,
    };
    return this.mfaConfigCache;
  }

  private webClientCache: UserPoolClientType | undefined | null;

  /** Fetches the web user pool client. */
  async fetchWebClient(): Promise<User
serPoolClientWeb'].PhysicalResourceId,
      }),
    );
    this.webClientCache = UserPoolClient ?? null;
    return this.webClientCache ?? undefined;
  }

  private userPoolClientCache: UserPoolClientType | undefined | null;

  /** Fetches the non-web user pool client. */
  async fetchUserPoolClient(): Promise<UserPoolClientType | undefined> {
    if (this.userPoolClientCache !== undefined) return this.userPoolClientCache ?? undefined;
    const resources = await this.fetchResourcesByLogicalId();
    if (!resources['UserPool'] || !resources['UserPoolClient']) {
      this.userPoolClientCache = null;
      return undefined;
    }
    const { UserPoolClient } = await this.clients.cognitoIdentityProvider.send(
      new DescribeUserPoolClientCommand({
        UserPoolId: resources['UserPool'].PhysicalResourceId,
        ClientId: resources['UserPoolClient'].PhysicalResourceId,
      }),
    );
    this.userPoolClientCache = UserPoolClient ?? null;
    return this.userPoolClientCache ?? undefined;
  }

  private identityProvidersCache: IdentityProviderType[] | undefined;

  /** Fetches identity provider summaries for the user pool. */
  async fetchIdentityProviders(): Promise<IdentityProviderType[]> {
    if (this.identityProvidersCache) return this.identityProvidersCache;
    const resources = await this.fetchResourcesByLogicalId();
    if (!resources['UserPool']) {
      this.identityProvidersCache = [];
      return [];
    }
    const userPoolId = resources['UserPool'].PhysicalResourceId;
    const { Providers } = await this.clients.cognitoIdentityProvider.send(
      new ListIdentityProvidersCommand({ UserPoolId: userPoolId }),
    );
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
    this.identityProvidersCache = details;
    return details;
  }

  private identityGroupsCache: GroupType[] | undefined;

  /** Fetches user pool groups. */
  async fetchIdentityGroups(): Promise<GroupType[]> {
    if (this.identityGroupsCache) return this.identityGroupsCache;
    const resources = await this.fetchResourcesByLogicalId();
    if (!resources['UserPool']) {
      this.identityGroupsCache = [];
      return [];
    }
    const { Groups } = await this.clients.cognitoIdentityProvider.send(
      new ListGroupsCommand({ UserPoolId: resources['UserPool'].PhysicalResourceId }),
    );
    this.identityGroupsCache = Groups ?? [];
    return this.identityGroupsCache;
  }

  private identityPoolCache: { guestLogin?: boolean; identityPoolName?: string } | undefined;

  /** Fetches identity pool configuration (guest login, pool name). */
  async fetchIdentityPool(): Promise<{ guestLogin?: boolean; identityPoolName?: string } | undefined> {
    if (this.identityPoolCache) return this.identityPoolCache;
    const resources = await this.fetchResourcesByLogicalId();
    if (!resources['IdentityPool']) return undefined;
    const result = await this.clients.cognitoIdentity.send(
      new DescribeIdentityPoolCommand({
        IdentityPoolId: resources['IdentityPool'].PhysicalResourceId,
      }),
    );
    this.identityPoolCache = {
      guestLogin: result.AllowUnauthenticatedIdentities,
      identityPoolName: result.IdentityPoolName,
    };
    return this.identityPoolCache;
  }

  // ── Auth trigger connections ─────────────────────────────────────

  /** Reads auth trigger connections from the cloud backend. */
  async fetchAuthTriggerConnections(): Promise<Partial<Record<keyof LambdaConfigType, string>> | undefined> {
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
          const triggers = typeof cliInputs.cognitoConfig.triggers === 'string'
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

  private functionConfigsCache: Map<string, FunctionConfiguration> = new Map();

  /** Fetches a Lambda function configuration by its deployed name. */
  async fetchFunctionConfig(deployedName: string): Promise<FunctionConfiguration | undefined> {
    if (this.functionConfigsCache.has(deployedName)) return this.functionConfigsCache.get(deployedName);
    try {
      const result = await this.clients.lambda.send(
        new GetFunctionCommand({ FunctionName: deployedName }),
      );
      const config = result.Configuration ?? undefined;
      if (config) this.functionConfigsCache.set(deployedName, config);
      return config;
    } catch {
      return undefined;
    }
  }

  /** Fetches the CloudWatch schedule expression for a Lambda function. */
  async fetchFunctionSchedule(deployedName: string): Promise<string | undefined> {
    try {
      const policyResponse = await this.clients.lambda.send(
        new GetPolicyCommand({ FunctionName: deployedName }),
      );
      const policy = JSON.parse(policyResponse.Policy ?? '{}');
      const ruleName = policy.Statement?.find(
        (s: { Condition?: { ArnLike?: { 'AWS:SourceArn'?: string } } }) =>
          s.Condition?.ArnLike?.['AWS:SourceArn']?.includes('rule/'),
      )?.Condition.ArnLike['AWS:SourceArn'].split('/').pop();

      if (!ruleName) return undefined;

      const ruleResponse = await this.clients.cloudWatchEvents.send(
        new DescribeRuleCommand({ Name: ruleName }),
      );
      return ruleResponse.ScheduleExpression;
    } catch {
      return undefined;
    }
  }

  // ── Storage (S3) ────────────────────────────────────────────────

  /** Fetches S3 bucket notification configuration. */
  async fetchBucketNotifications(bucketName: string) {
    return this.clients.s3.send(
      new GetBucketNotificationConfigurationCommand({ Bucket: bucketName }),
    );
  }

  /** Fetches S3 bucket accelerate configuration. */
  async fetchBucketAccelerate(bucketName: string) {
    const { Status } = await this.clients.s3.send(
      new GetBucketAccelerateConfigurationCommand({ Bucket: bucketName }),
    );
    return Status;
  }

  /** Fetches S3 bucket versioning configuration. */
  async fetchBucketVersioning(bucketName: string) {
    const { Status } = await this.clients.s3.send(
      new GetBucketVersioningCommand({ Bucket: bucketName }),
    );
    return Status;
  }

  /** Fetches S3 bucket encryption configuration. */
  async fetchBucketEncryption(bucketName: string) {
    const { ServerSideEncryptionConfiguration } = await this.clients.s3.send(
      new GetBucketEncryptionCommand({ Bucket: bucketName }),
    );
    return ServerSideEncryptionConfiguration;
  }

  // ── Cloud backend file reading ──────────────────────────────────

  /** Reads a JSON file from the cloud backend directory. */
  async readCloudBackendJson<T>(relativePath: string): Promise<T | undefined> {
    const ccbDir = await this.fetchCloudBackendDir();
    const filePath = path.join(ccbDir, relativePath);
    if (!(await fileOrDirectoryExists(filePath))) return undefined;
    const contents = await fs.readFile(filePath, { encoding: 'utf8' });
    return JSON.parse(contents) as T;
  }

  /** Reads a text file from the cloud backend directory. */
  async readCloudBackendFile(relativePath: string): Promise<string | undefined> {
    const ccbDir = await this.fetchCloudBackendDir();
    const filePath = path.join(ccbDir, relativePath);
    if (!(await fileOrDirectoryExists(filePath))) return undefined;
    return fs.readFile(filePath, { encoding: 'utf8' });
  }

  /** Checks if a path exists in the cloud backend directory. */
  async cloudBackendPathExists(relativePath: string): Promise<boolean> {
    const ccbDir = await this.fetchCloudBackendDir();
    return fileOrDirectoryExists(path.join(ccbDir, relativePath));
  }

  // ── Utility accessors ───────────────────────────────────────────

  /** Returns the root stack name from the backend environment. */
  async fetchRootStackName(): Promise<string> {
    const env = await this.fetchBackendEnvironment();
    assert(env.stackName, 'Backend environment has no stack name');
    return env.stackName;
  }

  /** Returns the AmplifyStackParser for advanced stack queries. */
  get amplifyStackParser(): AmplifyStackParser {
    return this.stackParser;
  }

  /** Returns the raw AWS clients for advanced use cases. */
  get awsClients(): AwsClients {
    return this.clients;
  }

  /** Returns the BackendDownloader for custom resource access. */
  get backendDownloader(): BackendDownloader {
    return this.ccbFetcher;
  }
}
