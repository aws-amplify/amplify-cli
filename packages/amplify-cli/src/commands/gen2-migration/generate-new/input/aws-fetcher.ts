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
import { DescribeStackResourcesCommand, StackResource } from '@aws-sdk/client-cloudformation';
import { GetGraphqlApiCommand, GraphqlApi } from '@aws-sdk/client-appsync';
import { DescribeTableCommand, TableDescription } from '@aws-sdk/client-dynamodb';
import { GetAppCommand } from '@aws-sdk/client-amplify';
import { AwsClients } from './aws-clients';

/**
 * MFA configuration from Cognito.
 */
export interface MfaConfig {
  readonly mfaConfig?: UserPoolMfaType;
  readonly totpConfig?: SoftwareTokenMfaConfigType;
}

/**
 * Identity pool configuration.
 */
export interface IdentityPoolInfo {
  readonly guestLogin?: boolean;
  readonly identityPoolName?: string;
}

/**
 * Encapsulates all AWS SDK calls needed during Gen1 app introspection.
 *
 * Each method makes a single SDK call and returns the raw SDK response type.
 * Results are cached where the same resource is likely to be queried multiple
 * times. Easy to mock in tests: replace this class with a stub.
 */
export class AwsFetcher {
  private readonly clients: AwsClients;
  private cachedUserPool: UserPoolType | undefined | null;
  private cachedMfaConfig: MfaConfig | undefined;
  private cachedWebClient: UserPoolClientType | undefined | null;
  private cachedUserPoolClient: UserPoolClientType | undefined | null;
  private cachedIdentityProviders: IdentityProviderType[] | undefined;
  private cachedIdentityGroups: GroupType[] | undefined;
  private cachedIdentityPool: IdentityPoolInfo | undefined | null;
  private readonly cachedFunctionConfigs = new Map<string, FunctionConfiguration>();
  private cachedStackResources: StackResource[] | undefined;
  private cachedResourcesByLogicalId: Record<string, StackResource> | undefined;

  public constructor(clients: AwsClients) {
    this.clients = clients;
  }

  // ── CloudFormation ──────────────────────────────────────────────

  /**
   * Walks the nested CloudFormation stack tree starting from the root stack,
   * collecting all leaf (non-stack) resources into a flat list.
   */
  public async fetchAllStackResources(rootStackName: string): Promise<StackResource[]> {
    if (this.cachedStackResources) return this.cachedStackResources;
    const resources: StackResource[] = [];
    const stackQueue = [rootStackName];
    while (stackQueue.length) {
      const currentStackName = stackQueue.shift()!;
      const { StackResources: stackResources } = await this.clients.cloudFormation.send(
        new DescribeStackResourcesCommand({ StackName: currentStackName }),
      );
      if (!stackResources) {
        throw new Error(`No stack resources found for stack ${currentStackName}`);
      }
      for (const r of stackResources) {
        if (r.ResourceType === 'AWS::CloudFormation::Stack') {
          if (!r.PhysicalResourceId) {
            throw new Error('Nested stack resource does not have a physical resource id');
          }
          stackQueue.push(r.PhysicalResourceId);
        } else {
          resources.push(r);
        }
      }
    }
    this.cachedStackResources = resources;
    return resources;
  }

  /**
   * Returns stack resources indexed by LogicalResourceId.
   */
  public async fetchResourcesByLogicalId(rootStackName: string): Promise<Record<string, StackResource>> {
    if (this.cachedResourcesByLogicalId) return this.cachedResourcesByLogicalId;
    const resources = await this.fetchAllStackResources(rootStackName);
    this.cachedResourcesByLogicalId = resources.reduce((acc, curr) => {
      if (curr.LogicalResourceId) {
        acc[curr.LogicalResourceId] = curr;
      }
      return acc;
    }, {} as Record<string, StackResource>);
    return this.cachedResourcesByLogicalId;
  }

  // ── Auth (Cognito) ──────────────────────────────────────────────

  /**
   * Fetches the Cognito User Pool. Returns undefined if no UserPool resource exists.
   */
  public async fetchUserPool(resources: Record<string, { PhysicalResourceId?: string }>): Promise<UserPoolType | undefined> {
    if (this.cachedUserPool !== undefined) return this.cachedUserPool ?? undefined;
    if (!resources['UserPool']) {
      this.cachedUserPool = null;
      return undefined;
    }
    const { UserPool } = await this.clients.cognitoIdentityProvider.send(
      new DescribeUserPoolCommand({ UserPoolId: resources['UserPool'].PhysicalResourceId }),
    );
    this.cachedUserPool = UserPool ?? null;
    return this.cachedUserPool ?? undefined;
  }

  /**
   * Fetches MFA configuration for the user pool.
   */
  public async fetchMfaConfig(resources: Record<string, { PhysicalResourceId?: string }>): Promise<MfaConfig | undefined> {
    if (this.cachedMfaConfig) return this.cachedMfaConfig;
    if (!resources['UserPool']) return undefined;
    const result = await this.clients.cognitoIdentityProvider.send(
      new GetUserPoolMfaConfigCommand({ UserPoolId: resources['UserPool'].PhysicalResourceId }),
    );
    this.cachedMfaConfig = {
      mfaConfig: result.MfaConfiguration,
      totpConfig: result.SoftwareTokenMfaConfiguration,
    };
    return this.cachedMfaConfig;
  }

  /**
   * Fetches the web user pool client.
   */
  public async fetchWebClient(resources: Record<string, { PhysicalResourceId?: string }>): Promise<UserPoolClientType | undefined> {
    if (this.cachedWebClient !== undefined) return this.cachedWebClient ?? undefined;
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

  /**
   * Fetches the non-web user pool client.
   */
  public async fetchUserPoolClient(resources: Record<string, { PhysicalResourceId?: string }>): Promise<UserPoolClientType | undefined> {
    if (this.cachedUserPoolClient !== undefined) return this.cachedUserPoolClient ?? undefined;
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

  /**
   * Fetches identity provider details for the user pool.
   */
  public async fetchIdentityProviders(resources: Record<string, { PhysicalResourceId?: string }>): Promise<IdentityProviderType[]> {
    if (this.cachedIdentityProviders) return this.cachedIdentityProviders;
    if (!resources['UserPool']) {
      this.cachedIdentityProviders = [];
      return [];
    }
    const userPoolId = resources['UserPool'].PhysicalResourceId;
    const { Providers } = await this.clients.cognitoIdentityProvider.send(new ListIdentityProvidersCommand({ UserPoolId: userPoolId }));
    const details: IdentityProviderType[] = [];
    for (const provider of Providers ?? []) {
      const { IdentityProvider } = await this.clients.cognitoIdentityProvider.send(
        new DescribeIdentityProviderCommand({ UserPoolId: userPoolId, ProviderName: provider.ProviderName }),
      );
      if (IdentityProvider) details.push(IdentityProvider);
    }
    this.cachedIdentityProviders = details;
    return details;
  }

  /**
   * Fetches user pool groups.
   */
  public async fetchIdentityGroups(resources: Record<string, { PhysicalResourceId?: string }>): Promise<GroupType[]> {
    if (this.cachedIdentityGroups) return this.cachedIdentityGroups;
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

  /**
   * Fetches identity pool configuration.
   */
  public async fetchIdentityPool(resources: Record<string, { PhysicalResourceId?: string }>): Promise<IdentityPoolInfo | undefined> {
    if (this.cachedIdentityPool !== undefined) return this.cachedIdentityPool ?? undefined;
    if (!resources['IdentityPool']) {
      this.cachedIdentityPool = null;
      return undefined;
    }
    const result = await this.clients.cognitoIdentity.send(
      new DescribeIdentityPoolCommand({ IdentityPoolId: resources['IdentityPool'].PhysicalResourceId }),
    );
    this.cachedIdentityPool = {
      guestLogin: result.AllowUnauthenticatedIdentities,
      identityPoolName: result.IdentityPoolName,
    };
    return this.cachedIdentityPool;
  }

  // ── Functions (Lambda) ──────────────────────────────────────────

  /**
   * Fetches a Lambda function configuration by its deployed name.
   */
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

  /**
   * Fetches the CloudWatch schedule expression for a Lambda function.
   */
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

  /**
   * Fetches S3 bucket notification configuration.
   */
  public async fetchBucketNotifications(bucketName: string) {
    return this.clients.s3.send(new GetBucketNotificationConfigurationCommand({ Bucket: bucketName }));
  }

  /**
   * Fetches S3 bucket accelerate status.
   */
  public async fetchBucketAccelerate(bucketName: string) {
    const { Status } = await this.clients.s3.send(new GetBucketAccelerateConfigurationCommand({ Bucket: bucketName }));
    return Status;
  }

  /**
   * Fetches S3 bucket versioning status.
   */
  public async fetchBucketVersioning(bucketName: string) {
    const { Status } = await this.clients.s3.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
    return Status;
  }

  /**
   * Fetches S3 bucket encryption configuration.
   */
  public async fetchBucketEncryption(bucketName: string) {
    const { ServerSideEncryptionConfiguration } = await this.clients.s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
    return ServerSideEncryptionConfiguration;
  }

  // ── AppSync (GraphQL) ──────────────────────────────────────────

  /**
   * Fetches an AppSync GraphQL API by ID.
   */
  public async fetchGraphqlApi(apiId: string): Promise<GraphqlApi | undefined> {
    const { graphqlApi } = await this.clients.appSync.send(new GetGraphqlApiCommand({ apiId }));
    return graphqlApi;
  }

  // ── Cognito Identity (roles) ───────────────────────────────────

  /**
   * Fetches the IAM roles associated with an identity pool.
   */
  public async fetchIdentityPoolRoles(identityPoolId: string): Promise<{ authenticated?: string; unauthenticated?: string } | undefined> {
    const { Roles } = await this.clients.cognitoIdentity.send(new GetIdentityPoolRolesCommand({ IdentityPoolId: identityPoolId }));
    if (!Roles) return undefined;
    return { authenticated: Roles.authenticated, unauthenticated: Roles.unauthenticated };
  }

  // ── DynamoDB ───────────────────────────────────────────────────

  /**
   * Fetches a DynamoDB table description by name.
   */
  public async fetchTableDescription(tableName: string): Promise<TableDescription | undefined> {
    const { Table } = await this.clients.dynamoDB.send(new DescribeTableCommand({ TableName: tableName }));
    return Table;
  }

  /**
   * Fetches user pool groups by user pool ID, returning a name→ARN map.
   */
  public async fetchGroupsByUserPoolId(userPoolId: string): Promise<Record<string, string> | undefined> {
    const { Groups } = await this.clients.cognitoIdentityProvider.send(new ListGroupsCommand({ UserPoolId: userPoolId }));
    if (!Groups || Groups.length === 0) return undefined;
    return Groups.reduce((acc: Record<string, string>, { GroupName, RoleArn }) => {
      if (GroupName && RoleArn) {
        acc[GroupName] = RoleArn;
      }
      return acc;
    }, {});
  }

  // ── Amplify App ────────────────────────────────────────────────

  /**
   * Fetches the buildspec for an Amplify app.
   */
  public async fetchAppBuildSpec(appId: string): Promise<string | undefined> {
    const { app } = await this.clients.amplify.send(new GetAppCommand({ appId }));
    return app?.buildSpec;
  }
}
