import { AmplifyDriftDetector } from '../../drift';
import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { DescribeStacksCommand, GetStackPolicyCommand } from '@aws-sdk/client-cloudformation';
import execa from 'execa';
import { SpinningLogger } from './spinning-logger';
import chalk from 'chalk';
import { Gen1App } from './gen1-app';

export class AmplifyGen2MigrationValidations {
  public constructor(private readonly logger: SpinningLogger, private readonly gen1App: Gen1App, private readonly context: $TSContext) {}

  public async validateDrift(): Promise<void> {
    const result = await new AmplifyDriftDetector(this.context, this.logger).detect();
    if (result.code !== 0) {
      throw new AmplifyError('DriftDetectedError', {
        message: result.report?.trim() ?? 'Drift detected',
        resolution: 'Inspect the drift report above and resolve the drift',
      });
    }
  }

  public async validateWorkingDirectory(): Promise<void> {
    this.logger.debug('Inspecting local directory state for uncommitted changes');

    const { stdout: statusOutput } = await execa('git', ['status', '--porcelain']);
    if (statusOutput.trim()) {
      throw new AmplifyError('UncommittedChangesError', {
        message: 'Working directory has uncommitted changes',
        resolution: 'Commit or stash your changes before proceeding with migration.',
      });
    }
  }

  public async validateDeploymentStatus(): Promise<void> {
    this.logger.debug(`Inspecting root stack '${this.gen1App.rootStackName}' status`);
    const response = await this.gen1App.clients.cloudFormation.send(new DescribeStacksCommand({ StackName: this.gen1App.rootStackName }));

    if (!response.Stacks || response.Stacks.length === 0) {
      throw new AmplifyError('StackNotFoundError', {
        message: `Stack ${this.gen1App.rootStackName} not found in CloudFormation`,
        resolution: 'Ensure the project is deployed.',
      });
    }

    const stackStatus = response.Stacks[0].StackStatus;
    // Note: UPDATE_ROLLBACK_COMPLETE isn't an expected state - only being
    // added in the edge case of resuming migration from a failed state
    const validStatuses = ['UPDATE_COMPLETE', 'CREATE_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE'];

    if (!validStatuses.includes(stackStatus!)) {
      throw new AmplifyError('StackStateError', {
        message: `Root stack status is ${stackStatus}, expected UPDATE_COMPLETE or CREATE_COMPLETE`,
        resolution: 'Complete the deployment before proceeding.',
      });
    }
  }

  public async validateLockStatus(): Promise<void> {
    this.logger.debug(`Inspecting stack policy for ${this.gen1App.rootStackName}`);
    const { StackPolicyBody } = await this.gen1App.clients.cloudFormation.send(
      new GetStackPolicyCommand({ StackName: this.gen1App.rootStackName }),
    );

    if (!StackPolicyBody) {
      throw new AmplifyError('StackPolicyError', {
        message: 'Stack is not locked',
        resolution: 'Run the lock command before proceeding with migration.',
      });
    }

    const currentPolicy = JSON.parse(StackPolicyBody);
    const hasLockStatement = currentPolicy.Statement.some(
      (s: Record<string, string>) => s.Effect === 'Deny' && s.Action === 'Update:*' && s.Principal === '*' && s.Resource === '*',
    );

    if (!hasLockStatement) {
      throw new AmplifyError('StackPolicyError', {
        message: 'Stack policy does not match expected lock policy',
        resolution: 'Run the lock command to set the correct stack policy.',
      });
    }

    this.logger.debug(chalk.green(`Stack ${this.gen1App.rootStackName} is locked ✔`));
  }
}
