import ora from 'ora';
import {
  FeatureFlags, stateManager, UnknownArgumentError, exitOnNextTick, $TSContext,
} from 'amplify-cli-core';
import { deleteEnvParamManager, listLocalEnvNames } from '@aws-amplify/amplify-environment-parameters';
import { printer } from 'amplify-prompts';
import { getConfirmation } from '../../extensions/amplify-helpers/delete-project';
import { removeEnvFromCloud } from '../../extensions/amplify-helpers/remove-env-from-cloud';

/**
 * Entry point for env remove subcommand
 */
export const run = async (context: $TSContext): Promise<void> => {
  const envName = context.parameters.first;
  const currentEnv = context.amplify.getEnvInfo().envName;

  if (!envName) {
    const errMessage = "You must pass in the name of the environment as a part of the 'amplify env remove <env-name>' command";
    printer.error(errMessage);
    await context.usageData.emitError(new UnknownArgumentError(errMessage));
    exitOnNextTick(1);
  }

  if (!listLocalEnvNames().includes(envName)) {
    printer.error('No environment found with the corresponding name provided');
  } else {
    if (currentEnv === envName) {
      const errMessage = 'You cannot delete your current environment. Please switch to another environment to delete your current environment';
      printer.error(errMessage);
      printer.info("If this is your only environment you can use the 'amplify delete' command to delete your project");
      await context.usageData.emitError(new UnknownArgumentError(errMessage));
      exitOnNextTick(1);
    }

    const confirmation = await getConfirmation(context, envName);
    if (confirmation.proceed) {
      const spinner = ora('Deleting resources from the cloud. This will take a few minutes.');
      spinner.start();
      try {
        await removeEnvFromCloud(context, envName, confirmation.deleteS3);
      } catch (ex) {
        spinner.fail(`remove env failed: ${ex.message}`);
        throw ex;
      }
      spinner.succeed('Successfully removed environment from the cloud');

      // Remove from team-provider-info
      deleteEnvParamManager(envName);

      // Remove entry from aws-info
      const awsInfo = stateManager.getLocalAWSInfo();

      if (awsInfo[envName]) {
        delete awsInfo[envName];

        stateManager.setLocalAWSInfo(undefined, awsInfo);
      }

      if (FeatureFlags.isInitialized()) {
        await FeatureFlags.removeFeatureFlagConfiguration(false, [envName]);
      }

      printer.success('Successfully removed environment from your project locally');
    }
  }
};
