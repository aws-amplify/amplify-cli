import { AmplifyDriftDetector } from '../drift';
import { $TSContext, AmplifyError, stateManager } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import {
  DescribeChangeSetOutput,
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import { STATEFUL_RESOURCES } from './stateful-resources';
import execa from 'execa';

export class AmplifyGen2MigrationValidations {
  constructor(private readonly context: $TSContext) {}

  // public async validateDrift(): Promise<void> {
  //   return new AmplifyDriftDetector(this.context).detect();
  // }

  public async validateWorkingDirectory(): Promise<void> {
    const { stdout: statusOutput } = await execa('git', ['status', '--porcelain']);
    if (statusOutput.trim()) {
      throw new AmplifyError('MigrationError', {
        message: 'Working directory has uncommitted changes',
        resolution: 'Commit or stash your changes before proceeding with migration.',
      });
    }

    try {
      const { stdout: unpushedOutput } = await execa('git', ['log', '@{u}..', '--oneline']);
      if (unpushedOutput.trim()) {
        throw new AmplifyError('MigrationError', {
          message: 'Local branch has unpushed commits',
          resolution: 'Push your commits before proceeding with migration.',
        });
      }
    } catch (err: any) {
      if (err instanceof AmplifyError) throw err;
      if (!err.message?.includes('no upstream') && !err.stderr?.includes('no upstream')) {
        throw err;
      }
    }
  }

  public async validateDeploymentStatus(): Promise<void> {
    const amplifyMeta = stateManager.getMeta();
    const stackName = amplifyMeta?.providers?.awscloudformation?.StackName;

    if (!stackName) {
      throw new AmplifyError('StackNotFoundError', {
        message: 'Root stack not found',
        resolution: 'Ensure the project is initialized and deployed.',
      });
    }

    const cfnClient = new CloudFormationClient({});
    const response = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName }));

    if (!response.Stacks || response.Stacks.length === 0) {
      throw new AmplifyError('StackNotFoundError', {
        message: `Stack ${stackName} not found in CloudFormation`,
        resolution: 'Ensure the project is deployed.',
      });
    }

    const stackStatus = response.Stacks[0].StackStatus;
    const validStatuses = ['UPDATE_COMPLETE', 'CREATE_COMPLETE'];

    if (!validStatuses.includes(stackStatus)) {
      throw new AmplifyError('StackStateError', {
        message: `Root stack status is ${stackStatus}, expected ${validStatuses.join(' or ')}`,
        resolution: 'Complete the deployment before proceeding.',
      });
    }
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
