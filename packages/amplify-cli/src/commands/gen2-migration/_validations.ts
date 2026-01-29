import { AmplifyDriftDetector } from '../drift';
import { $TSContext, AmplifyError, stateManager } from '@aws-amplify/amplify-cli-core';
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
import { Logger } from '../gen2-migration';
import chalk from 'chalk';
import { printer } from '@aws-amplify/amplify-prompts';
import { extractCategory } from './categories';

export class AmplifyGen2MigrationValidations {
  private limiter = new Bottleneck({
    maxConcurrent: 3,
    minTime: 50,
  });

  constructor(
    private readonly logger: Logger,
    private readonly rootStackName: string,
    private readonly envName,
    private readonly context: $TSContext,
  ) {}

  public async validateDrift(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = await new AmplifyDriftDetector(this.context, this.logger).detect({ format: 'tree' });
    if (code !== 0) {
      throw new AmplifyError('MigrationError', {
        message: 'Drift detected',
        resolution: 'Inspect the output above and resolve the drift',
      });
    }
    this.logger.info(chalk.green('No drift detected ✔ '));
  }

  public async validateWorkingDirectory(): Promise<void> {
    this.logger.info('Inspecting local directory state for uncommitted changes');

    const { stdout: statusOutput } = await execa('git', ['status', '--porcelain']);
    if (statusOutput.trim()) {
      throw new AmplifyError('MigrationError', {
        message: 'Working directory has uncommitted changes',
        resolution: 'Commit or stash your changes before proceeding with migration.',
      });
    }

    this.logger.info(chalk.green('Local working directory is clean ✔'));
  }

  public async validateDeploymentStatus(): Promise<void> {
    this.logger.info(`Inspecting root stack '${this.rootStackName}' status`);
    const cfnClient = new CloudFormationClient({});
    const response = await cfnClient.send(new DescribeStacksCommand({ StackName: this.rootStackName }));

    if (!response.Stacks || response.Stacks.length === 0) {
      throw new AmplifyError('StackNotFoundError', {
        message: `Stack ${this.rootStackName} not found in CloudFormation`,
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

    this.logger.info(chalk.green(`Root stack '${this.rootStackName}' status is ${stackStatus} ✔`));
  }

  public async validateDeploymentVersion(): Promise<void> {
    this.logger.warn('Not implemented');
  }

  public async validateIsolatedEnvironment(): Promise<void> {
    this.logger.warn('Not implemented');
  }

  // eslint-disable-next-line spellcheck/spell-checker
  public async validateStatefulResources(changeSet: DescribeChangeSetOutput, excludeDeploymentBucket = false): Promise<void> {
    if (!changeSet.Changes) return;

    const deploymentBucketName = excludeDeploymentBucket
      ? stateManager.getTeamProviderInfo()[this.envName].awscloudformation.DeploymentBucketName
      : undefined;

    this.logger.info('Scanning for stateful resources...');

    const statefulRemoves: Array<{ category: string; resourceType: string; physicalId: string }> = [];
    for (const change of changeSet.Changes) {
      if (change.Type === 'Resource' && change.ResourceChange?.Action === 'Remove' && change.ResourceChange?.ResourceType) {
        // Skip deployment bucket only when explicitly requested (e.g., during decommission)
        if (
          deploymentBucketName &&
          change.ResourceChange.ResourceType === 'AWS::S3::Bucket' &&
          change.ResourceChange.PhysicalResourceId === deploymentBucketName
        ) {
          continue;
        }

        if (change.ResourceChange.ResourceType === 'AWS::CloudFormation::Stack' && change.ResourceChange.PhysicalResourceId) {
          const category = extractCategory(change.ResourceChange.LogicalResourceId || '');
          this.logger.info(`Scanning '${category}'...`);
          const nestedResources = await this.getStatefulResources(
            change.ResourceChange.PhysicalResourceId,
            change.ResourceChange.LogicalResourceId,
          );
          statefulRemoves.push(...nestedResources);
        } else if (STATEFUL_RESOURCES.has(change.ResourceChange.ResourceType)) {
          const category = extractCategory(change.ResourceChange.LogicalResourceId || '');
          const physicalId = change.ResourceChange.PhysicalResourceId || 'N/A';
          this.logger.info(`Scanning '${category}' category: found stateful resource "${physicalId}"`);
          statefulRemoves.push({
            category,
            resourceType: change.ResourceChange.ResourceType,
            physicalId,
          });
        }
      }
    }

    if (statefulRemoves.length > 0) {
      const table = new CLITable({
        head: ['Category', 'Resource Type', 'Physical ID'],
        style: { head: ['red'] },
      });

      statefulRemoves.forEach((resource) => {
        table.push([resource.category, resource.resourceType, resource.physicalId]);
      });

      this.logger.info('Stateful resources scheduled for deletion');
      printer.blankLine();
      printer.info(table.toString());
      printer.blankLine();

      throw new AmplifyError('DestructiveMigrationError', {
        message: 'Decommission will delete stateful resources.',
        resolution: 'Review the resources above and ensure data is backed up before proceeding.',
      });
    }
  }

  public async validateIngressTraffic(): Promise<void> {
    this.logger.warn('Not implemented');
  }

  public async validateLockStatus(): Promise<void> {
    const cfnClient = new CloudFormationClient({});
    this.logger.info(`Inspecting stack policy for ${this.rootStackName}`);
    const { StackPolicyBody } = await cfnClient.send(new GetStackPolicyCommand({ StackName: this.rootStackName }));

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

    this.logger.info(chalk.green(`Stack ${this.rootStackName} is locked ✔`));
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
    const parentCategory = parentLogicalId ? extractCategory(parentLogicalId) : undefined;

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
          const category = parentCategory || extractCategory(resource.LogicalResourceId || '');
          const physicalId = resource.PhysicalResourceId || 'N/A';
          this.logger.info(`Scanning '${category}' category: found stateful resource "${physicalId}"`);
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
          const category = extractCategory(task.logicalId || '');
          return this.getStatefulResources(task.physicalId, category !== 'other' ? task.logicalId : parentLogicalId);
        }),
      ),
    );

    nestedResults.forEach((nested) => statefulResources.push(...nested));
    return statefulResources;
  }
}
