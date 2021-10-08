import ora from 'ora';
import { FeatureFlags, stateManager, UnknownArgumentError, exitOnNextTick } from 'amplify-cli-core';
import { getConfirmation } from '../../extensions/amplify-helpers/delete-project';
import { removeEnvFromCloud } from '../../extensions/amplify-helpers/remove-env-from-cloud';

export const run = async context => {
  const envName = context.parameters.first;
  const currentEnv = context.amplify.getEnvInfo().envName;

  if (!envName) {
    const errMessage = "You must pass in the name of the environment as a part of the 'amplify env remove <env-name>' command";
    context.print.error(errMessage);
    await context.usageData.emitError(new UnknownArgumentError(errMessage));
    exitOnNextTick(1);
  }
  let envFound = false;
  const allEnvs = context.amplify.getEnvDetails();

  Object.keys(allEnvs).forEach(env => {
    if (env === envName) {
      envFound = true;
      delete allEnvs[env];
    }
  });

  if (!envFound) {
    context.print.error('No environment found with the corresponding name provided');
  } else {
    if (currentEnv === envName) {
      const errMessage =
        'You cannot delete your current environment. Please switch to another environment to delete your current environment';
      context.print.error(errMessage);
      context.print.error("If this is your only environment you can use the 'amplify delete' command to delete your project");
      await context.usageData.emitError(new UnknownArgumentError(errMessage));
      exitOnNextTick(1);
    }

    const confirmation = await getConfirmation(context, envName);
    if (confirmation.proceed) {
      const spinner = ora('Deleting resources from the cloud. This may take a few minutes...');
      spinner.start();
      try {
        await removeEnvFromCloud(context, envName, confirmation.deleteS3);
      } catch (ex) {
        spinner.fail(`remove env failed: ${ex.message}`);
        throw ex;
      }
      spinner.succeed('Successfully removed environment from the cloud');

      // Remove from team-provider-info
      stateManager.setTeamProviderInfo(undefined, allEnvs);

      // Remove entry from aws-info
      const awsInfo = stateManager.getLocalAWSInfo();

      if (awsInfo[envName]) {
        delete awsInfo[envName];

        stateManager.setLocalAWSInfo(undefined, awsInfo);
      }

      if (FeatureFlags.isInitialized()) {
        await FeatureFlags.removeFeatureFlagConfiguration(false, [envName]);
      }

      context.print.success('Successfully removed environment from your project locally');
    }
  }
};
