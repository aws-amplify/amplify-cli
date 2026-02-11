import { AmplifyMigrationStep } from './_step';
import { AmplifyMigrationOperation } from './_operation';
import { CloudFormationClient, ListStacksCommand, StackStatus } from '@aws-sdk/client-cloudformation';
import { deleteHoldingStack, HOLDING_STACK_SUFFIX } from './refactor/holding-stack';

export class AmplifyMigrationCleanupStep extends AmplifyMigrationStep {
  public async executeImplications(): Promise<string[]> {
    return ['Delete temporary holding stacks created during migration'];
  }

  public async rollbackImplications(): Promise<string[]> {
    return ['Cleanup cannot be rolled back - holding stacks will be permanently deleted'];
  }

  public async executeValidate(): Promise<void> {
    // No specific validation needed - cleanup is safe to run anytime
  }

  public async rollbackValidate(): Promise<void> {
    throw new Error('Cleanup cannot be rolled back');
  }

  public async execute(): Promise<AmplifyMigrationOperation[]> {
    const cfnClient = new CloudFormationClient({ region: this.region });
    const holdingStacks = await this.findHoldingStacks(cfnClient);

    if (holdingStacks.length === 0) {
      return [
        {
          describe: async () => ['No holding stacks found to clean up'],
          execute: async () => {
            this.logger.info('No holding stacks found to clean up');
          },
        },
      ];
    }

    return holdingStacks.map((stackName) => ({
      describe: async () => [`Delete holding stack: ${stackName}`],
      execute: async () => {
        this.logger.info(`Deleting holding stack: ${stackName}`);
        await deleteHoldingStack(cfnClient, stackName);
        this.logger.info(`Deleted holding stack: ${stackName}`);
      },
    }));
  }

  public async rollback(): Promise<AmplifyMigrationOperation[]> {
    throw new Error('Cleanup cannot be rolled back');
  }

  private async findHoldingStacks(cfnClient: CloudFormationClient): Promise<string[]> {
    const holdingStacks: string[] = [];
    let nextToken: string | undefined;

    do {
      const response = await cfnClient.send(
        new ListStacksCommand({
          NextToken: nextToken,
          StackStatusFilter: [StackStatus.CREATE_COMPLETE, StackStatus.UPDATE_COMPLETE, StackStatus.ROLLBACK_COMPLETE],
        }),
      );

      for (const stack of response.StackSummaries ?? []) {
        if (stack.StackName?.endsWith(HOLDING_STACK_SUFFIX)) {
          holdingStacks.push(stack.StackName);
        }
      }

      nextToken = response.NextToken;
    } while (nextToken);

    return holdingStacks;
  }
}
