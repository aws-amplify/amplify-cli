import { AmplifyDriftDetector } from '../drift';
import { $TSContext, AmplifyError, stateManager } from '@aws-amplify/amplify-cli-core';
import { printer, AmplifySpinner } from '@aws-amplify/amplify-prompts';
import {
  DescribeChangeSetOutput,
  CloudFormationClient,
  DescribeStacksCommand,
  ListStackResourcesCommand,
  GetStackPolicyCommand,
} from '@aws-sdk/client-cloudformation';
import { STATEFUL_RESOURCES } from './stateful-resources';
import CLITable from 'cli-table3';
import Bottleneck from 'bottleneck';
import execa from 'execa';

export class AmplifyGen2MigrationValidations {
  private spinner?: AmplifySpinner;
  private limiter = new Bottleneck({
    maxConcurrent: 3,
    minTime: 50,
  });

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
    // Note: UPDATE_ROLLBACK_COMPLETE isn't an expected state - only being added in the edge case of resuming migration from a failed state
    const validStatuses = ['UPDATE_COMPLETE', 'CREATE_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE'];

    if (!validStatuses.includes(stackStatus)) {
      throw new AmplifyError('StackStateError', {
        message: `Root stack status is ${stackStatus}, expected UPDATE_COMPLETE or CREATE_COMPLETE`,
        resolution: 'Complete the deployment before proceeding.',
      });
    }

    printer.success(`Deployment status validated: ${stackStatus}`);
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

    this.spinner = new AmplifySpinner();
    this.spinner.start('Scanning for stateful resources...');

    const statefulRemoves: Array<{ category: string; resourceType: string; physicalId: string }> = [];
    for (const change of changeSet.Changes) {
      if (change.Type === 'Resource' && change.ResourceChange?.Action === 'Remove' && change.ResourceChange?.ResourceType) {
        if (change.ResourceChange.ResourceType === 'AWS::CloudFormation::Stack' && change.ResourceChange.PhysicalResourceId) {
          const category = this.extractCategory(change.ResourceChange.LogicalResourceId || '');
          this.spinner.start(`Scanning '${category}'...`);
          const nestedResources = await this.getStatefulResources(
            change.ResourceChange.PhysicalResourceId,
            change.ResourceChange.LogicalResourceId,
          );
          statefulRemoves.push(...nestedResources);
        } else if (STATEFUL_RESOURCES.has(change.ResourceChange.ResourceType)) {
          const category = this.extractCategory(change.ResourceChange.LogicalResourceId || '');
          const physicalId = change.ResourceChange.PhysicalResourceId || 'N/A';
          this.spinner.start(`Scanning '${category}' category: found stateful resource "${physicalId}"`);
          statefulRemoves.push({
            category,
            resourceType: change.ResourceChange.ResourceType,
            physicalId,
          });
        }
      }
    }

    this.spinner.stop();
    this.spinner = undefined;

    if (statefulRemoves.length > 0) {
      const table = new CLITable({
        head: ['Category', 'Resource Type', 'Physical ID'],
        style: { head: ['red'] },
      });

      statefulRemoves.forEach((resource) => {
        table.push([resource.category, resource.resourceType, resource.physicalId]);
      });

      printer.error('\nStateful resources scheduled for deletion:\n');
      printer.info(table.toString());

      throw new AmplifyError('DestructiveMigrationError', {
        message: 'Decommission will delete stateful resources.',
        resolution: 'Review the resources above and ensure data is backed up before proceeding.',
      });
    }
  }

  public async validateIngressTraffic(): Promise<void> {
    printer.warn('Not implemented');
  }

  public async validateLockStatus(): Promise<void> {
    const amplifyMeta = stateManager.getMeta();
    const stackName = amplifyMeta?.providers?.awscloudformation?.StackName;

    if (!stackName) {
      throw new AmplifyError('StackNotFoundError', {
        message: 'Root stack not found',
        resolution: 'Ensure the project is initialized and deployed.',
      });
    }

    const cfnClient = new CloudFormationClient({});
    const { StackPolicyBody } = await cfnClient.send(new GetStackPolicyCommand({ StackName: stackName }));

    if (!StackPolicyBody) {
      throw new AmplifyError('MigrationError', {
        message: 'Stack is not locked',
        resolution: 'Run the lock command before proceeding with migration.',
      });
    }

    const currentPolicy = JSON.parse(StackPolicyBody);
    const expectedPolicy = {
      Statement: [
        {
          Effect: 'Deny',
          Action: 'Update:*',
          Principal: '*',
          Resource: '*',
        },
      ],
    };

    if (JSON.stringify(currentPolicy) !== JSON.stringify(expectedPolicy)) {
      throw new AmplifyError('MigrationError', {
        message: 'Stack policy does not match expected lock policy',
        resolution: 'Run the lock command to set the correct stack policy.',
      });
    }

    printer.success('Stack lock status validated');
  }

  private async getStatefulResources(
    stackName: string,
    parentLogicalId?: string,
  ): Promise<Array<{ category: string; resourceType: string; physicalId: string }>> {
    const statefulResources: Array<{ category: string; resourceType: string; physicalId: string }> = [];
    const cfn = new CloudFormationClient({
      maxAttempts: 5,
      retryMode: 'adaptive',
    });
    const parentCategory = parentLogicalId ? this.extractCategory(parentLogicalId) : undefined;

    let nextToken: string | undefined;
    const nestedStackTasks: Array<{ physicalId: string; logicalId: string | undefined }> = [];

    do {
      const response = await cfn.send(new ListStackResourcesCommand({ StackName: stackName, NextToken: nextToken }));
      nextToken = response.NextToken;

      for (const resource of response.StackResourceSummaries ?? []) {
        if (resource.ResourceType === 'AWS::CloudFormation::Stack' && resource.PhysicalResourceId) {
          nestedStackTasks.push({
            physicalId: resource.PhysicalResourceId,
            logicalId: resource.LogicalResourceId,
          });
        } else if (resource.ResourceType && STATEFUL_RESOURCES.has(resource.ResourceType)) {
          const category = parentCategory || this.extractCategory(resource.LogicalResourceId || '');
          const physicalId = resource.PhysicalResourceId || 'N/A';
          if (this.spinner) {
            this.spinner.start(`Scanning '${category}' category: found stateful resource "${physicalId}"`);
          }
          statefulResources.push({
            category,
            resourceType: resource.ResourceType,
            physicalId,
          });
        }
      }
    } while (nextToken);

    const nestedResults = await Promise.all(
      nestedStackTasks.map((task) =>
        this.limiter.schedule(() => {
          const category = this.extractCategory(task.logicalId || '');
          return this.getStatefulResources(task.physicalId, category !== 'other' ? task.logicalId : parentLogicalId);
        }),
      ),
    );

    nestedResults.forEach((nested) => statefulResources.push(...nested));
    return statefulResources;
  }

  private extractCategory(logicalId: string): string {
    const idLower = logicalId.toLowerCase();
    if (idLower.includes('auth')) return 'Auth';
    if (idLower.includes('storage')) return 'Storage';
    if (idLower.includes('function')) return 'Function';
    if (idLower.includes('api')) return 'Api';
    if (idLower.includes('analytics')) return 'Analytics';
    if (idLower.includes('hosting')) return 'Hosting';
    if (idLower.includes('notifications')) return 'Notifications';
    if (idLower.includes('interactions')) return 'Interactions';
    if (idLower.includes('predictions')) return 'Predictions';
    if (idLower.includes('deployment') || idLower.includes('infrastructure')) return 'Core Infrastructure';
    if (idLower.includes('geo')) return 'Geo';
    if (idLower.includes('custom')) return 'Custom';
    return 'other';
  }
}
