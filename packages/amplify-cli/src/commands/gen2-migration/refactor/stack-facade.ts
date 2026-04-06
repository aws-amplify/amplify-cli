import {
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
  GetTemplateCommand,
  Stack,
  StackResource,
} from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { AwsClients } from '../_infra/aws-clients';
import { CFNTemplate } from '../_infra/cfn-template';

/**
 * Read-only facade over a CloudFormation stack hierarchy.
 * Instantiate once per root stack (Gen1 or Gen2).
 */
export class StackFacade {
  constructor(private readonly clients: AwsClients, public readonly rootStackName: string) {}

  /**
   * Lists nested stacks under the root stack.
   */
  public async fetchNestedStacks(): Promise<StackResource[]> {
    const response = await this.clients.cloudFormation.send(new DescribeStackResourcesCommand({ StackName: this.rootStackName }));
    return (response.StackResources ?? []).filter((r) => r.ResourceType === 'AWS::CloudFormation::Stack');
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
  public async fetchStackResources(stackId: string): Promise<StackResource[]> {
    const response = await this.clients.cloudFormation.send(new DescribeStackResourcesCommand({ StackName: stackId }));
    return response.StackResources ?? [];
  }
}
