import ora from 'ora';
import { AmplifyMigrationStep } from './_step';
import { printer } from '@aws-amplify/amplify-prompts';
import { removeEnvFromCloud } from '../../extensions/amplify-helpers/remove-env-from-cloud';
import { invokeDeleteEnvParamsFromService } from '../../extensions/amplify-helpers/invoke-delete-env-params';
import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { getConfirmation } from '../../extensions/amplify-helpers/delete-project';

export class AmplifyMigrationDecommissionStep extends AmplifyMigrationStep {
  readonly command = 'decommission';
  readonly describe = 'Decommission Gen1 resources';

  public async validate(): Promise<void> {
    printer.warn('Not implemented');
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

    const spinner = ora('Deleting Gen1 resources from the cloud. This will take a few minutes.');
    spinner.start();

    try {
      await removeEnvFromCloud(context, envName, true);
      await invokeDeleteEnvParamsFromService(context, envName);
      spinner.succeed('Successfully decommissioned Gen1 environment from the cloud');
    } catch (ex) {
      spinner.fail(`Decommission failed: ${ex.message}`);
      throw ex;
    }
  }

  public async rollback(): Promise<void> {
    printer.warn('Not implemented');
  }

  private getContext(): $TSContext {
    return (this as any).context;
  }
}
