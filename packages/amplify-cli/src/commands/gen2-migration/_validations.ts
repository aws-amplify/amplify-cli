import { AmplifyDriftDetector } from '../drift';
import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { CloudFormationClient, DescribeChangeSetOutput, DescribeStackResourcesCommand } from '@aws-sdk/client-cloudformation';
import { STATEFUL_RESOURCES } from './stateful-resources';

export class AmplifyGen2MigrationValidations {
  constructor(private readonly context: $TSContext) {}

  public async validateDrift(): Promise<void> {
    return new AmplifyDriftDetector(this.context).detect();
  }

  public async validateWorkingDirectory(): Promise<void> {
    printer.warn('Not implemented');
  }

  public async validateDeploymentStatus(): Promise<void> {
    printer.warn('Not implemented');
  }

  public async validateDeploymentVersion(): Promise<void> {
    printer.warn('Not implemented');
  }

  public async validateIsolatedEnvironment(): Promise<void> {
    printer.warn('Not implemented');
  }

  // eslint-disable-next-line spellcheck/spell-checker
  public async validateStatefulResources(changeSet: DescribeChangeSetOutput): Promise<void> {
    if (!changeSet.Changes) return;

    const statefulRemoves: string[] = [];
    for (const change of changeSet.Changes) {
      if (change.Type === 'Resource' && change.ResourceChange?.Action === 'Remove' && change.ResourceChange?.ResourceType) {
        if (change.ResourceChange.ResourceType === 'AWS::CloudFormation::Stack' && change.ResourceChange.PhysicalResourceId) {
          const nestedResources = await this.getStatefulResources(change.ResourceChange.PhysicalResourceId);
          if (nestedResources.length > 0) {
            statefulRemoves.push(
              `${change.ResourceChange.LogicalResourceId} (${change.ResourceChange.ResourceType}) containing: ${nestedResources.join(
                ', ',
              )}`,
            );
          }
        } else if (STATEFUL_RESOURCES.has(change.ResourceChange.ResourceType)) {
          statefulRemoves.push(`${change.ResourceChange.LogicalResourceId} (${change.ResourceChange.ResourceType})`);
        }
      }
    }

    if (statefulRemoves.length > 0) {
      throw new AmplifyError('DestructiveMigrationError', {
        message: `Stateful resources scheduled for deletion: ${statefulRemoves.join(', ')}.`,
        resolution: 'Review the migration plan and ensure data is backed up before proceeding.',
      });
    }
  }

  public async validateIngressTraffic(): Promise<void> {
    printer.warn('Not implemented');
  }

  private async getStatefulResources(stackName: string): Promise<string[]> {
    const statefulResources: string[] = [];
    const cfn = new CloudFormationClient({});
    const { StackResources } = await cfn.send(new DescribeStackResourcesCommand({ StackName: stackName }));

    for (const resource of StackResources ?? []) {
      if (resource.ResourceType === 'AWS::CloudFormation::Stack' && resource.PhysicalResourceId) {
        const nested = await this.getStatefulResources(resource.PhysicalResourceId);
        statefulResources.push(...nested);
      } else if (resource.ResourceType && STATEFUL_RESOURCES.has(resource.ResourceType)) {
        statefulResources.push(`${resource.LogicalResourceId} (${resource.ResourceType})`);
      }
    }
    return statefulResources;
  }
}
