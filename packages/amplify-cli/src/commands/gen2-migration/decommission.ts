import ora from 'ora';
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
import { stateManager, $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { removeEnvFromCloud } from '../../extensions/amplify-helpers/remove-env-from-cloud';
import { getConfirmation } from '../../extensions/amplify-helpers/delete-project';
import { invokeDeleteEnvParamsFromService } from '../../extensions/amplify-helpers/invoke-delete-env-params';

export class AmplifyMigrationDecommissionStep extends AmplifyMigrationStep {
  public async validate(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validations = new AmplifyGen2MigrationValidations({} as any);
    // eslint-disable-next-line spellcheck/spell-checker
    await validations.validateStatefulResources(await this.createChangeSet());
  }

  public async execute(): Promise<void> {
    const context = this.getContext();
    const envName = context.parameters.first;
    const allEnvs = context.amplify.getEnvDetails();

    if (!envName) {
      throw new AmplifyError('EnvironmentNameError', {
        message: 'Environment name was not specified.',
        resolution: 'Pass in the name of the environment.',
      });
    }

    if (!allEnvs[envName]) {
      throw new AmplifyError('EnvironmentNameError', {
        message: 'Environment name is invalid.',
        resolution: 'Run amplify env list to get a list of valid environments.',
      });
    }

    const confirmation = await getConfirmation(context, envName);
    if (!confirmation.proceed) {
      return;
    }

    printer.info(`Starting decommission of environment: ${envName}`);

    const spinner = ora('Preparing to delete Gen1 resources...');
    spinner.start();

    try {
      spinner.text = 'Deleting Gen1 resources from the cloud. This will take a few minutes.';
      await removeEnvFromCloud(context, envName, true);

      spinner.text = 'Cleaning up SSM parameters...';
      await invokeDeleteEnvParamsFromService(context, envName);

      spinner.succeed('Successfully decommissioned Gen1 environment from the cloud');
      printer.success(`Environment '${envName}' has been completely removed from AWS`);
    } catch (ex) {
      spinner.fail(`Decommission failed: ${ex.message}`);
      throw ex;
    }
  }

  public async rollback(): Promise<void> {
    printer.warn('Not implemented');
  }

  private getContext(): $TSContext {
    return (this is any).context;
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
