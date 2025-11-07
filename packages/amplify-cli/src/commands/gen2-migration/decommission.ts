import { AmplifyMigrationStep } from './_step';
import { printer, AmplifySpinner } from '@aws-amplify/amplify-prompts';
import { AmplifyGen2MigrationValidations } from './_validations';
import {
  CloudFormationClient,
  CreateChangeSetCommand,
  DescribeChangeSetCommand,
  DeleteChangeSetCommand,
  DescribeChangeSetOutput,
  waitUntilChangeSetCreateComplete,
} from '@aws-sdk/client-cloudformation';
import { stateManager } from '@aws-amplify/amplify-cli-core';

export class AmplifyMigrationDecommissionStep extends AmplifyMigrationStep {
  readonly command = 'decommission';
  readonly describe = 'Decommission Gen1 resources after migration';

  public async validate(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validations = new AmplifyGen2MigrationValidations({} as any);
    // eslint-disable-next-line spellcheck/spell-checker
    await validations.validateStatefulResources(await this.createChangeSet());
  }

  public async execute(): Promise<void> {
    printer.warn('Not implemented');
  }

  public async rollback(): Promise<void> {
    printer.warn('Not implemented');
  }

  private async createChangeSet(): Promise<DescribeChangeSetOutput> {
    const meta = stateManager.getMeta();
    const stackName = meta.providers.awscloudformation.StackName;

    const cfn = new CloudFormationClient({});
    const changeSetName = `decommission-${Date.now()}`;
    const spinner = new AmplifySpinner();

    await cfn.send(
      new CreateChangeSetCommand({
        StackName: stackName,
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

    spinner.start('Analyzing environment resources...');
    await waitUntilChangeSetCreateComplete({ client: cfn, maxWaitTime: 120 }, { StackName: stackName, ChangeSetName: changeSetName });

    const allChanges = [];
    let nextToken: string | undefined;
    let changeSet!: DescribeChangeSetOutput;
    do {
      changeSet = await cfn.send(
        new DescribeChangeSetCommand({
          StackName: stackName,
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
        StackName: stackName,
        ChangeSetName: changeSetName,
      }),
    );

    spinner.stop(`Reviewing environment resources`);
    return changeSet;
  }
}
