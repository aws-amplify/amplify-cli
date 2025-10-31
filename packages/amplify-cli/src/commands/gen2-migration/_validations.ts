import { AmplifyDriftDetector } from '../drift';
import { $TSContext, AmplifyError, stateManager } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { DescribeChangeSetOutput, CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
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

    const statefulRemoves = changeSet.Changes.filter(
      (change) =>
        change.Type === 'Resource' &&
        change.ResourceChange?.Action === 'Remove' &&
        change.ResourceChange?.ResourceType &&
        STATEFUL_RESOURCES.has(change.ResourceChange.ResourceType),
    );

    if (statefulRemoves.length > 0) {
      const resources = statefulRemoves
        .map((c) => `${c.ResourceChange?.LogicalResourceId ?? 'Unknown'} (${c.ResourceChange?.ResourceType})`)
        .join(', ');
      throw new AmplifyError('DestructiveMigrationError', {
        message: `Stateful resources scheduled for deletion: ${resources}.`,
        resolution: 'Review the migration plan and ensure data is backed up before proceeding.',
      });
    }
  }

  public async validateIngressTraffic(): Promise<void> {
    printer.warn('Not implemented');
  }
}
