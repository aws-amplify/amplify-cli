import {
  DescribeStacksCommand,
  GetTemplateCommand,
  paginateListStackResources,
  Stack,
  StackResourceSummary,
} from '@aws-sdk/client-cloudformation';
import { DescribeUserPoolCommand, ListIdentityProvidersCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { AwsClients } from '../_common/aws-clients';
import { CFNTemplate } from '../_common/cfn-template';

/** Non-null name + type pair for a Cognito identity provider. */
interface IdpConfig {
  readonly providerName: string;
  readonly providerType: string;
}

/** A UserPool's domain and identity-provider summaries. */
export interface SocialAuthConfig {
  readonly userPoolId: string;
  readonly domain: string;
  readonly providers: IdpConfig[];
}

/**
 * Read-only facade over a CloudFormation stack hierarchy.
 * Instantiate once per root stack (Gen1 or Gen2).
 */
export class StackFacade {
  constructor(private readonly clients: AwsClients, public readonly rootStackName: string) {}

  /**
   * Lists nested stacks under the root stack.
   */
  public async fetchNestedStacks(): Promise<StackResourceSummary[]> {
    const results: StackResourceSummary[] = [];
    const paginator = paginateListStackResources({ client: this.clients.cloudFormation }, { StackName: this.rootStackName });
    for await (const page of paginator) {
      for (const resource of page.StackResourceSummaries ?? []) {
        if (resource.ResourceType === 'AWS::CloudFormation::Stack') {
          results.push(resource);
        }
      }
    }
    return results;
  }

  /**
   * Fetches and parses the CloudFormation template for a stack.
   */
  public async fetchTemplate(stackId: string): Promise<CFNTemplate> {
    const response = await this.clients.cloudFormation.send(new GetTemplateCommand({ StackName: stackId, TemplateStage: 'Original' }));
    if (!response.TemplateBody) {
      throw new AmplifyError('InvalidStackError', { message: `Stack '${stackId}' returned an empty template` });
    }
    return JSON.parse(response.TemplateBody) as CFNTemplate;
  }

  /**
   * Describes a stack (parameters, outputs, status).
   */
  public async fetchStack(stackId: string): Promise<Stack> {
    const response = await this.clients.cloudFormation.send(new DescribeStacksCommand({ StackName: stackId }));
    const stack = response.Stacks?.[0];
    if (!stack) {
      throw new AmplifyError('StackNotFoundError', { message: `Stack '${stackId}' not found` });
    }
    return stack;
  }

  /**
   * Lists resources in a stack.
   */
  public async fetchStackResources(stackId: string): Promise<StackResourceSummary[]> {
    const results: StackResourceSummary[] = [];
    const paginator = paginateListStackResources({ client: this.clients.cloudFormation }, { StackName: stackId });
    for await (const page of paginator) {
      results.push(...(page.StackResourceSummaries ?? []));
    }
    return results;
  }

  /**
   * Returns the physical UserPool ID in a stack, or undefined if the stack has
   * no UserPool.
   */
  public async fetchUserPoolId(stackId: string): Promise<string | undefined> {
    const resources = await this.fetchStackResources(stackId);
    const pools = resources.filter((r) => r.ResourceType === 'AWS::Cognito::UserPool');
    if (pools.length > 1) {
      const physicalIds = pools.map((p) => p.PhysicalResourceId ?? '<unknown>').join(', ');
      throw new AmplifyError('MigrationError', {
        message: `Expected exactly one UserPool in stack '${stackId}', found ${pools.length}: ${physicalIds}`,
      });
    }
    return pools[0]?.PhysicalResourceId;
  }

  /**
   * Returns the social auth config (domain + IDP summaries) for the
   * given UserPool, or undefined if the pool has no domain or no IDPs.
   */
  public async fetchSocialAuthConfig(userPoolId: string): Promise<SocialAuthConfig | undefined> {
    const pool = await this.clients.cognitoIdentityProvider.send(new DescribeUserPoolCommand({ UserPoolId: userPoolId }));
    const domain = pool?.UserPool?.Domain;
    if (!domain) return undefined;

    const list = await this.clients.cognitoIdentityProvider.send(new ListIdentityProvidersCommand({ UserPoolId: userPoolId }));
    const providers: IdpConfig[] = [];
    for (const p of list?.Providers ?? []) {
      if (!p.ProviderName) continue;
      providers.push({ providerName: p.ProviderName, providerType: p.ProviderType ?? p.ProviderName });
    }
    if (providers.length === 0) return undefined;

    return { userPoolId, domain, providers };
  }
}
