import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
  Stack,
  StackResource,
} from '@aws-sdk/client-cloudformation';

export type AmplifyStackTypes = 'authStack' | 'dataStack' | 'storageStack' | 'rootStack';
export type AmplifyStacks = Partial<Record<AmplifyStackTypes, Stack>>;

/** Parses Amplify CloudFormation stacks to extract resource information. */
export class AmplifyStackParser {
  private static readonly CFN_STACK_RESOURCE_TYPE = 'AWS::CloudFormation::Stack';

  constructor(private readonly cfnClient: CloudFormationClient) {}

  private async getStackResources(stackName: string): Promise<StackResource[]> {
    const { StackResources: stackResources } = await this.cfnClient.send(new DescribeStackResourcesCommand({ StackName: stackName }));
    if (!stackResources) {
      throw new Error(`No stack resources found for stack ${stackName}`);
    }
    return stackResources;
  }

  public async getAllStackResources(stackName: string): Promise<StackResource[]> {
    const resources: StackResource[] = [];
    const stackQueue = [stackName];
    while (stackQueue.length) {
      const currentStackName = stackQueue.shift()!;
      const stackResources = await this.getStackResources(currentStackName);
      stackQueue.push(
        ...stackResources
          .filter((r) => r.ResourceType === AmplifyStackParser.CFN_STACK_RESOURCE_TYPE)
          .map((r) => {
            if (!r.PhysicalResourceId) {
              throw new Error('Resource does not have a physical resource id');
            }
            return r.PhysicalResourceId;
          }),
      );
      resources.push(...stackResources.filter((r) => r.ResourceType !== AmplifyStackParser.CFN_STACK_RESOURCE_TYPE));
    }
    return resources;
  }

  public getResourcesByLogicalId(resources: StackResource[]): Record<string, StackResource> {
    return resources.reduce((acc, curr) => {
      if (curr.LogicalResourceId) {
        acc[curr.LogicalResourceId] = curr;
      }
      return acc;
    }, {} as Record<string, StackResource>);
  }

  private async describeStack(stackId: string) {
    return this.cfnClient.send(new DescribeStacksCommand({ StackName: stackId }));
  }

  public async getAmplifyStacks(rootStackName: string): Promise<AmplifyStacks> {
    const rootStackResponse = await this.describeStack(rootStackName);
    const stackResources = await this.getStackResources(rootStackName);
    const stackIds = stackResources
      .filter((stack) => stack.ResourceType === 'AWS::CloudFormation::Stack')
      .reduce((prev, curr) => {
        if (curr.PhysicalResourceId) {
          if (curr.LogicalResourceId?.startsWith('api')) {
            prev.dataStack = curr.PhysicalResourceId;
          }
          if (curr.LogicalResourceId?.startsWith('auth')) {
            prev.authStack = curr.PhysicalResourceId;
          }
          if (curr.LogicalResourceId?.startsWith('storage')) {
            prev.storageStack = curr.PhysicalResourceId;
          }
        }
        return prev;
      }, {} as Record<AmplifyStackTypes, string>);

    const [dataStackResponse, authStackResponse, storageStackResponse] = await Promise.all([
      this.describeStack(stackIds.dataStack),
      this.describeStack(stackIds.authStack),
      this.describeStack(stackIds.storageStack),
    ]);

    return {
      rootStack: rootStackResponse?.Stacks?.find(({ StackId }) => StackId === stackIds.rootStack),
      dataStack: dataStackResponse?.Stacks?.find(({ StackId }) => StackId === stackIds.dataStack),
      authStack: authStackResponse?.Stacks?.find(({ StackId }) => StackId === stackIds.authStack),
      storageStack: storageStackResponse?.Stacks?.find(({ StackId }) => StackId === stackIds.storageStack),
    };
  }
}
