import assert from 'node:assert';
import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
  Stack,
  StackResource,
} from '@aws-sdk/client-cloudformation';

export type AmplifyStackTypes = 'authStack' | 'dataStack' | 'storageStack' | 'rootStack';

export type AmplifyStacks = Partial<Record<AmplifyStackTypes, Stack>>;
export class AmplifyStackParser {
  constructor(private cfnClient: CloudFormationClient) {}
  private static CFN_STACK_RESOURCE_TYPE = 'AWS::CloudFormation::Stack';
  private getStackResources = async (stackName: string): Promise<StackResource[]> => {
    const { StackResources: stackResources } = await this.cfnClient.send(
      new DescribeStackResourcesCommand({
        StackName: stackName,
      }),
    );
    assert(stackResources);
    return stackResources;
  };
  getAllStackResources = async (stackName: string): Promise<StackResource[]> => {
    const resources: StackResource[] = [];
    const stackQueue = [stackName];
    while (stackQueue.length) {
      const currentStackName = stackQueue.shift();
      assert(currentStackName);
      const stackResources = await this.getStackResources(currentStackName);
      stackQueue.push(
        ...stackResources
          .filter((r) => r.ResourceType === AmplifyStackParser.CFN_STACK_RESOURCE_TYPE)
          .map((r) => {
            assert(r.PhysicalResourceId, 'Resource does not have a physical resource id');
            return r.PhysicalResourceId;
          }),
      );
      resources.push(...stackResources.filter((r) => r.ResourceType !== AmplifyStackParser.CFN_STACK_RESOURCE_TYPE));
    }
    return resources;
  };
  getResourcesByLogicalId = (resources: StackResource[]) => {
    return resources.reduce((acc, curr) => {
      if (curr.LogicalResourceId) {
        acc[curr.LogicalResourceId] = curr;
      }
      return acc;
    }, {} as Record<string, StackResource>);
  };

  private describeStack = (stackId: string) => this.cfnClient.send(new DescribeStacksCommand({ StackName: stackId }));
  getAmplifyStacks = async (rootStackName: string): Promise<AmplifyStacks> => {
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
  };
}
