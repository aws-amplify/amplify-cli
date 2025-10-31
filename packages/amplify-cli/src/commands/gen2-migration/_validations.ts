import { AmplifyDriftDetector } from '../drift';
import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { DescribeChangeSetOutput } from '@aws-sdk/client-cloudformation';
import { STATEFUL_RESOURCES } from './stateful-resources';
import execa from 'execa';

export class AmplifyGen2MigrationValidations {
  constructor(private readonly context: $TSContext) {}

  public async validateDrift(): Promise<void> {
    return new AmplifyDriftDetector(this.context).detect();
  }

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
