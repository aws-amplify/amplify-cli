import {
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
  GetTemplateCommand,
  Stack,
  StackResource,
} from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { AwsClients } from '../aws-clients';
import { CFNTemplate } from '../cfn-template';

/**
 * Lazy-loading, caching facade over a CloudFormation stack hierarchy.
 * Instantiate once per root stack (Gen1 or Gen2). All reads go through here.
 * Cache entries are evicted on rejection to allow retries.
 */
export class StackFacade {
  private readonly templateCache = new Map<string, Promise<CFNTemplate>>();
  private readonly descriptionCache = new Map<string, Promise<Stack>>();
  private readonly resourcesCache = new Map<string, Promise<StackResource[]>>();
  private nestedStacksPromise: Promise<StackResource[]> | undefined;

  constructor(private readonly clients: AwsClients, public readonly rootStackName: string) {}

  /**
   * Lists nested stacks under the root stack. Cached on first call.
   */
  public async fetchNestedStacks(): Promise<StackResource[]> {
    if (this.nestedStacksPromise === undefined) {
      this.nestedStacksPromise = this.doFetchNestedStacks().catch((error) => {
        this.nestedStacksPromise = undefined;
        throw error;
      });
    }
    return this.nestedStacksPromise;
  }

  /**
   * Fetches and parses the CloudFormation template for a stack. Cached per stackId.
   */
  public async fetchTemplate(stackId: string): Promise<CFNTemplate> {
    return this.cachedFetch(this.templateCache, stackId, async () => {
      const response = await this.clients.cloudFormation.send(new GetTemplateCommand({ StackName: stackId, TemplateStage: 'Original' }));
      if (!response.TemplateBody) {
        throw new AmplifyError('InvalidStackError', { message: `Stack '${stackId}' returned an empty template` });
      }
      return JSON.parse(response.TemplateBody) as CFNTemplate;
    });
  }

  /**
   * Describes a stack (parameters, outputs, status). Cached per stackId.
   */
  public async fetchStackDescription(stackId: string): Promise<Stack> {
    return this.cachedFetch(this.descriptionCache, stackId, async () => {
      const response = await this.clients.cloudFormation.send(new DescribeStacksCommand({ StackName: stackId }));
      const stack = response.Stacks?.[0];
      if (!stack) {
        throw new AmplifyError('StackNotFoundError', { message: `Stack '${stackId}' not found` });
      }
      return stack;
    });
  }

  /**
   * Lists resources in a stack. Cached per stackId.
   */
  public async fetchStackResources(stackId: string): Promise<StackResource[]> {
    return this.cachedFetch(this.resourcesCache, stackId, async () => {
      const response = await this.clients.cloudFormation.send(new DescribeStackResourcesCommand({ StackName: stackId }));
      return response.StackResources ?? [];
    });
  }

  private async cachedFetch<T>(cache: Map<string, Promise<T>>, key: string, fetcher: () => Promise<T>): Promise<T> {
    const existing = cache.get(key);
    if (existing !== undefined) return existing;

    const promise = fetcher().catch((error) => {
      cache.delete(key);
      throw error;
    });
    cache.set(key, promise);
    return promise;
  }

  // Uses DescribeStackResources (max 100 resources, no pagination) for test mock compatibility.
  // Amplify projects are unlikely to exceed this limit. If pagination is needed in the future,
  // switch to ListStackResources (paginated) and update the test mock accordingly.
  private async doFetchNestedStacks(): Promise<StackResource[]> {
    const response = await this.clients.cloudFormation.send(new DescribeStackResourcesCommand({ StackName: this.rootStackName }));
    return (response.StackResources ?? []).filter((r) => r.ResourceType === 'AWS::CloudFormation::Stack');
  }
}
