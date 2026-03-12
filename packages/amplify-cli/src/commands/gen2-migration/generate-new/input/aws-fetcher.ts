import {
  DescribeUserPoolCommand,
  DescribeUserPoolClientCommand,
  DescribeIdentityProviderCommand,
  GetUserPoolMfaConfigCommand,
  GetUserPoolMfaConfigResponse,
  UserPoolType,
  UserPoolClientType,
  GroupType,
  IdentityProviderType,
  paginateListIdentityProviders,
  paginateListGroups,
} from '@aws-sdk/client-cognito-identity-provider';
import { DescribeIdentityPoolCommand, GetIdentityPoolRolesCommand, IdentityPool } from '@aws-sdk/client-cognito-identity';
import { GetFunctionCommand, GetPolicyCommand, FunctionConfiguration } from '@aws-sdk/client-lambda';
import { DescribeRuleCommand } from '@aws-sdk/client-cloudwatch-events';
import {
  GetBucketNotificationConfigurationCommand,
  GetBucketAccelerateConfigurationCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import { GetGraphqlApiCommand, GraphqlApi } from '@aws-sdk/client-appsync';
import { DescribeTableCommand, TableDescription } from '@aws-sdk/client-dynamodb';
import { GetAppCommand } from '@aws-sdk/client-amplify';
import { GetResourcesCommand } from '@aws-sdk/client-api-gateway';
import { AwsClients } from './aws-clients';

/**
 * Encapsulates all AWS SDK calls needed during Gen1 app introspection.
 *
 * Each method accepts a concrete identifier (user pool ID, function name,
 * bucket name, etc.) rather than a generic resources map. Identifiers are
 * extracted from amplify-meta.json output by the caller.
 */
export class AwsFetcher {
  private readonly clients: AwsClients;

  public constructor(clients: AwsClients) {
    this.clients = clients;
  }

  // ── Auth (Cognito) ──────────────────────────────────────────────

  public async fetchUserPool(userPoolId: string): Promise<UserPoolType> {
    const { UserPool } = await this.clients.cognitoIdentityProvider.send(new DescribeUserPoolCommand({ UserPoolId: userPoolId }));
    if (!UserPool) {
      throw new Error(`User pool '${userPoolId}' not found`);
    }
    return UserPool;
  }

  public async fetchMfaConfig(userPoolId: string): Promise<GetUserPoolMfaConfigResponse> {
    return this.clients.cognitoIdentityProvider.send(new GetUserPoolMfaConfigCommand({ UserPoolId: userPoolId }));
  }

  public async fetchUserPoolClient(userPoolId: string, clientId: string): Promise<UserPoolClientType | undefined> {
    const { UserPoolClient } = await this.clients.cognitoIdentityProvider.send(
      new DescribeUserPoolClientCommand({ UserPoolId: userPoolId, ClientId: clientId }),
    );
    return UserPoolClient;
  }

  public async fetchIdentityProviders(userPoolId: string): Promise<IdentityProviderType[]> {
    const paginator = paginateListIdentityProviders({ client: this.clients.cognitoIdentityProvider }, { UserPoolId: userPoolId });
    const details: IdentityProviderType[] = [];
    for await (const page of paginator) {
      for (const provider of page.Providers ?? []) {
        const { IdentityProvider } = await this.clients.cognitoIdentityProvider.send(
          new DescribeIdentityProviderCommand({ UserPoolId: userPoolId, ProviderName: provider.ProviderName }),
        );
        if (IdentityProvider) details.push(IdentityProvider);
      }
    }
    return details;
  }

  public async fetchIdentityGroups(userPoolId: string): Promise<GroupType[]> {
    const paginator = paginateListGroups({ client: this.clients.cognitoIdentityProvider }, { UserPoolId: userPoolId });
    const groups: GroupType[] = [];
    for await (const page of paginator) {
      groups.push(...(page.Groups ?? []));
    }
    return groups;
  }

  public async fetchIdentityPool(identityPoolId: string): Promise<IdentityPool> {
    return this.clients.cognitoIdentity.send(new DescribeIdentityPoolCommand({ IdentityPoolId: identityPoolId }));
  }

  public async fetchIdentityPoolRoles(identityPoolId: string): Promise<{ authenticated?: string; unauthenticated?: string } | undefined> {
    const { Roles } = await this.clients.cognitoIdentity.send(new GetIdentityPoolRolesCommand({ IdentityPoolId: identityPoolId }));
    if (!Roles) return undefined;
    return { authenticated: Roles.authenticated, unauthenticated: Roles.unauthenticated };
  }

  public async fetchGroupsByUserPoolId(userPoolId: string): Promise<Record<string, string> | undefined> {
    const paginator = paginateListGroups({ client: this.clients.cognitoIdentityProvider }, { UserPoolId: userPoolId });
    const result: Record<string, string> = {};
    for await (const page of paginator) {
      for (const { GroupName, RoleArn } of page.Groups ?? []) {
        if (GroupName && RoleArn) result[GroupName] = RoleArn;
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }

  // ── Functions (Lambda) ──────────────────────────────────────────

  public async fetchFunctionConfig(deployedName: string): Promise<FunctionConfiguration | undefined> {
    const result = await this.clients.lambda.send(new GetFunctionCommand({ FunctionName: deployedName }));
    return result.Configuration;
  }

  public async fetchFunctionSchedule(deployedName: string): Promise<string | undefined> {
    let ruleName: string | undefined;
    try {
      const policyResponse = await this.clients.lambda.send(new GetPolicyCommand({ FunctionName: deployedName }));
      if (!policyResponse?.Policy) return undefined;
      const policy = JSON.parse(policyResponse.Policy);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ruleName = policy.Statement?.find((s: any) => s.Condition?.ArnLike?.['AWS:SourceArn']?.includes('rule/'))
        ?.Condition.ArnLike['AWS:SourceArn'].split('/')
        .pop();
    } catch (e: unknown) {
      // ResourceNotFoundException means the function has no resource policy (no schedule).
      // Any other error (permissions, network) should propagate.
      if (e instanceof Error && e.name === 'ResourceNotFoundException') {
        return undefined;
      }
      throw e;
    }
    if (!ruleName) return undefined;
    const ruleResponse = await this.clients.cloudWatchEvents.send(new DescribeRuleCommand({ Name: ruleName }));
    return ruleResponse.ScheduleExpression;
  }

  // ── Storage (S3) ────────────────────────────────────────────────

  public async fetchBucketNotifications(bucketName: string) {
    return this.clients.s3.send(new GetBucketNotificationConfigurationCommand({ Bucket: bucketName }));
  }

  public async fetchBucketAccelerate(bucketName: string) {
    const { Status } = await this.clients.s3.send(new GetBucketAccelerateConfigurationCommand({ Bucket: bucketName }));
    return Status;
  }

  public async fetchBucketVersioning(bucketName: string) {
    const { Status } = await this.clients.s3.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
    return Status;
  }

  public async fetchBucketEncryption(bucketName: string) {
    const { ServerSideEncryptionConfiguration } = await this.clients.s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
    return ServerSideEncryptionConfiguration;
  }

  // ── AppSync (GraphQL) ──────────────────────────────────────────

  public async fetchGraphqlApi(apiId: string): Promise<GraphqlApi | undefined> {
    const { graphqlApi } = await this.clients.appSync.send(new GetGraphqlApiCommand({ apiId }));
    return graphqlApi;
  }

  // ── DynamoDB ───────────────────────────────────────────────────

  public async fetchTableDescription(tableName: string): Promise<TableDescription | undefined> {
    const { Table } = await this.clients.dynamoDB.send(new DescribeTableCommand({ TableName: tableName }));
    return Table;
  }

  // ── Amplify App ────────────────────────────────────────────────

  public async fetchAppBuildSpec(appId: string): Promise<string | undefined> {
    const { app } = await this.clients.amplify.send(new GetAppCommand({ appId }));
    return app?.buildSpec;
  }

  // ── API Gateway ────────────────────────────────────────────────

  public async fetchRestApiRootResourceId(restApiId: string): Promise<string> {
    const { items } = await this.clients.apiGateway.send(new GetResourcesCommand({ restApiId }));
    const root = items?.find((r) => r.path === '/');
    if (!root?.id) {
      throw new Error(`Root resource not found for REST API '${restApiId}'`);
    }
    return root.id;
  }
}
