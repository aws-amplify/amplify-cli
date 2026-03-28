import { AmplifyMigrationStep } from './_step';
import { AmplifyMigrationOperation, ValidationResult } from './_operation';
import { Plan } from './_plan';
import { AmplifyGen2MigrationValidations } from './_validations';
import {
  CloudFormationClient,
  CreateChangeSetCommand,
  DescribeChangeSetCommand,
  DeleteChangeSetCommand,
  DescribeChangeSetOutput,
  paginateListStacks,
  StackStatus,
  waitUntilChangeSetCreateComplete,
} from '@aws-sdk/client-cloudformation';
import { removeEnvFromCloud } from '../../extensions/amplify-helpers/remove-env-from-cloud';
import { invokeDeleteEnvParamsFromService } from '../../extensions/amplify-helpers/invoke-delete-env-params';
import { Cfn, HOLDING_STACK_NAME_SUFFIX } from './refactor/cfn';

export class AmplifyMigrationDecommissionStep extends AmplifyMigrationStep {
  public async forward(): Promise<Plan> {
    const cfnClient = new CloudFormationClient({ region: this.gen1App.region });
    const cfn = new Cfn(cfnClient, this.logger);
    const holdingStacks = await this.findHoldingStacks(cfnClient);

    const operations: AmplifyMigrationOperation[] = [];

    operations.push({
      describe: async () => [],
      validate: () => ({ description: 'Stateful resources', run: () => this.validateStatefulResources() }),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      execute: async () => {},
    });

    for (const stackName of holdingStacks) {
      operations.push({
        validate: () => undefined,
        describe: async () => [`Delete holding stack: ${stackName}`],
        execute: async () => {
          this.logger.info(`Deleting holding stack: ${stackName}`);
          await cfn.deleteStack(stackName);
          this.logger.info(`Deleted holding stack: ${stackName}`);
        },
      });
    }

    operations.push({
      validate: () => undefined,
      describe: async () => ['Delete the Gen1 environment'],
      execute: async () => {
        this.logger.info(`Starting decommission of environment: ${this.gen1App.envName}`);
        this.logger.info('Preparing to delete Gen1 resources...');
        this.logger.info('Deleting Gen1 resources from the cloud. This will take a few minutes.');
        await removeEnvFromCloud(this.context, this.gen1App.envName, true);
        this.logger.info('Cleaning up SSM parameters...');
        await invokeDeleteEnvParamsFromService(this.context, this.gen1App.envName);
        this.logger.info('Successfully decommissioned Gen1 environment from the cloud');
        this.logger.info(`Environment '${this.gen1App.envName}' has been completely removed from AWS`);
      },
    });

    return new Plan({
      operations,
      logger: this.logger,
      title: 'Execute',
      implications: [
        'The Gen1 CloudFormation stack and all its resources will be permanently deleted',
        'This operation cannot be rolled back',
      ],
    });
  }

  public async rollback(): Promise<Plan> {
    throw new Error('Not Implemented');
  }

  private async validateStatefulResources(): Promise<ValidationResult> {
    try {
      const changeSet = await this.createChangeSet();
      const validations = new AmplifyGen2MigrationValidations(this.logger, this.gen1App.rootStackName, this.gen1App.envName, this.context);
      // eslint-disable-next-line spellcheck/spell-checker
      await validations.validateStatefulResources(changeSet, true);
      return { valid: true };
    } catch (e) {
      return { valid: false, report: e.message };
    }
  }

  private async findHoldingStacks(cfnClient: CloudFormationClient): Promise<string[]> {
    const holdingStacks: string[] = [];
    const paginator = paginateListStacks(
      { client: cfnClient },
      {
        StackStatusFilter: [
          StackStatus.CREATE_COMPLETE,
          StackStatus.UPDATE_COMPLETE,
          StackStatus.ROLLBACK_COMPLETE,
          StackStatus.REVIEW_IN_PROGRESS,
        ],
      },
    );
    for await (const page of paginator) {
      for (const stack of page.StackSummaries ?? []) {
        if (stack.StackName?.endsWith(HOLDING_STACK_NAME_SUFFIX) && stack.StackName.includes(this.gen1App.appId)) {
          holdingStacks.push(stack.StackName);
        }
      }
    }
    return holdingStacks;
  }

  private async createChangeSet(): Promise<DescribeChangeSetOutput> {
    const cfn = new CloudFormationClient({});
    const changeSetName = `decommission-${Date.now()}`;

    await cfn.send(
      new CreateChangeSetCommand({
        StackName: this.gen1App.rootStackName,
        ChangeSetName: changeSetName,
        TemplateBody: JSON.stringify({
          Resources: {
            DummyResource: {
              Type: 'AWS::CloudFormation::WaitConditionHandle',
            },
          },
        }),
      }),
    );

    this.logger.info('Analyzing environment resources...');
    await waitUntilChangeSetCreateComplete(
      { client: cfn, maxWaitTime: 120 },
      { StackName: this.gen1App.rootStackName, ChangeSetName: changeSetName },
    );

    const allChanges = [];
    let nextToken: string | undefined;
    let changeSet!: DescribeChangeSetOutput;
    do {
      changeSet = await cfn.send(
        new DescribeChangeSetCommand({
          StackName: this.gen1App.rootStackName,
          ChangeSetName: changeSetName,
          NextToken: nextToken,
        }),
      );
      allChanges.push(...(changeSet.Changes ?? []));
      nextToken = changeSet.NextToken;
    } while (nextToken);

    changeSet.Changes = allChanges;

    await cfn.send(
      new DeleteChangeSetCommand({
        StackName: this.gen1App.rootStackName,
        ChangeSetName: changeSetName,
      }),
    );

    this.logger.info(`Reviewing environment resources`);
    return changeSet;
  }
}
