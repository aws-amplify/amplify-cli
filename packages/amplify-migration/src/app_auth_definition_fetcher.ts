import assert from 'node:assert';
import { AuthDefinition } from '@aws-amplify/amplify-gen2-codegen';
import { CloudFormationClient, DescribeStackResourcesCommand, StackResource } from '@aws-sdk/client-cloudformation';
import { CognitoIdentityProviderClient, DescribeUserPoolCommand } from '@aws-sdk/client-cognito-identity-provider';
import { getAuthDefinition } from '@aws-amplify/amplify-gen1-codegen-auth-adapter';

export interface AppAuthDefinitionFetcher {
  getDefinition(backendEnvironmentStack: string): Promise<AuthDefinition | undefined>;
}
export class AppAuthDefinitionFetcher {
  constructor(private cognitoIdentityProviderClient: CognitoIdentityProviderClient, private cfnClient: CloudFormationClient) {}
  private static CFN_STACK_RESOURCE_TYPE = 'AWS::CloudFormation::Stack';
  private getStackResources = async (stackName: string) => {
    const resources: StackResource[] = [];
    const stackQueue = [stackName];
    while (stackQueue.length) {
      const currentStackName = stackQueue.shift();
      const { StackResources: stackResources } = await this.cfnClient.send(
        new DescribeStackResourcesCommand({
          StackName: currentStackName,
        }),
      );
      assert(stackResources);
      stackQueue.push(
        ...stackResources
          .filter((r) => r.ResourceType === AppAuthDefinitionFetcher.CFN_STACK_RESOURCE_TYPE)
          .map((r) => {
            assert(r.PhysicalResourceId, 'Resource does not have a physical resource id');
            return r.PhysicalResourceId;
          }),
      );
      resources.push(...stackResources.filter((r) => r.ResourceType !== AppAuthDefinitionFetcher.CFN_STACK_RESOURCE_TYPE));
    }
    return resources;
  };

  private getResourcesByLogicalId = (resources: StackResource[]) => {
    return resources.reduce((acc, curr) => {
      if (curr.LogicalResourceId) {
        acc[curr.LogicalResourceId] = curr;
      }
      return acc;
    }, {} as Record<string, StackResource>);
  };
  getDefinition = async (backendEnvironmentStack: string): Promise<AuthDefinition | undefined> => {
    const stackResources = await this.getStackResources(backendEnvironmentStack);
    const resourcesByLogicalId = this.getResourcesByLogicalId(stackResources);

    const { UserPool: userPool } = await this.cognitoIdentityProviderClient.send(
      new DescribeUserPoolCommand({
        UserPoolId: resourcesByLogicalId['UserPool'].PhysicalResourceId,
      }),
    );

    assert(userPool, 'User pool not found');
    return getAuthDefinition({ userPool });
  };
}
