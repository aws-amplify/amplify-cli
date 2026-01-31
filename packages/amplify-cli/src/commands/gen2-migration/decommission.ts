import { AmplifyMigrationOperation, AmplifyMigrationStep } from './_step';
import { AmplifyGen2MigrationValidations } from './_validations';
import {
  CloudFormationClient,
  CreateChangeSetCommand,
  DescribeChangeSetCommand,
  DeleteChangeSetCommand,
  DescribeChangeSetOutput,
  waitUntilChangeSetCreateComplete,
} from '@aws-sdk/client-cloudformation';
import { removeEnvFromCloud } from '../../extensions/amplify-helpers/remove-env-from-cloud';
import { invokeDeleteEnvParamsFromService } from '../../extensions/amplify-helpers/invoke-delete-env-params';

export class AmplifyMigrationDecommissionStep extends AmplifyMigrationStep {
  public async validate(): Promise<void> {
    const changeSet = await this.createChangeSet();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validations = new AmplifyGen2MigrationValidations(this.logger, this.rootStackName, this.currentEnvName, this.context);
    // eslint-disable-next-line spellcheck/spell-checker
    await validations.validateStatefulResources(changeSet, true);
  }

  public async execute(): Promise<AmplifyMigrationOperation[]> {
    return [
      {
        describe: async () => {
          return ['Delete the Gen1 environment'];
        },
        execute: async () => {
          this.logger.info(`Starting decommission of environment: ${this.currentEnvName}`);

          this.logger.info('Preparing to delete Gen1 resources...');

          this.logger.info('Deleting Gen1 resources from the cloud. This will take a few minutes.');
          await removeEnvFromCloud(this.context, this.currentEnvName, true);

          this.logger.info('Cleaning up SSM parameters...');
          await invokeDeleteEnvParamsFromService(this.context, this.currentEnvName);

          this.logger.info('Successfully decommissioned Gen1 environment from the cloud');
          this.logger.info(`Environment '${this.currentEnvName}' has been completely removed from AWS`);
        },
      },
    ];
  }

  public async rollback(): Promise<AmplifyMigrationOperation[]> {
    throw new Error('Not Implemented');
  }

  private async createChangeSet(): Promise<DescribeChangeSetOutput> {
    const cfn = new CloudFormationClient({});
    const changeSetName = `decommission-${Date.now()}`;

    await cfn.send(
      new CreateChangeSetCommand({
        StackName: this.rootStackName,
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
      { StackName: this.rootStackName, ChangeSetName: changeSetName },
    );

    const allChanges = [];
    let nextToken: string | undefined;
    let changeSet!: DescribeChangeSetOutput;
    do {
      changeSet = await cfn.send(
        new DescribeChangeSetCommand({
          StackName: this.rootStackName,
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
        StackName: this.rootStackName,
        ChangeSetName: changeSetName,
      }),
    );

    this.logger.info(`Reviewing environment resources`);
    return changeSet;
  }
}
