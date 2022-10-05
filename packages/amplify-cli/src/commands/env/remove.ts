import ora from 'ora';
import {
  FeatureFlags, stateManager, $TSContext, AmplifyError,
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
    throw new AmplifyError('EnvironmentNameError', {
      message: 'Environment name was not specified.',
      resolution: 'Pass in the name of the environment using the --name flag.',
    });
  }

  if (!listLocalEnvNames().includes(envName)) {
    throw new AmplifyError('EnvironmentNameError', {
      message: 'Environment name is invalid.',
      resolution: 'Run amplify env list to get a list of valid environments.',
    });
  }
  if (currentEnv === envName) {
    throw new AmplifyError('EnvironmentNameError', {
      message: 'You cannot delete your current environment.',
      resolution: 'Switch to another environment before deleting the current environment.',
      details: "If this is your only environment you can use the 'amplify delete' command to delete your project.",
    });
  }
  const confirmation = await getConfirmation(context, envName);
  if (!confirmation.proceed) {
    return;
  }
  const spinner = ora('Deleting resources from the cloud. This will take a few minutes.');
  spinner.start();
  try {
    await removeEnvFromCloud(context, envName, confirmation.deleteS3);
  } finally {
    spinner.stop();
  }
  spinner.succeed('Successfully removed environment from the cloud');

  // Remove environment from env param manager
  deleteEnvParamManager(envName);

  // Remove entry from aws-info
  const awsInfo = stateManager.getLocalAWSInfo();
  if (awsInfo[envName]) {
    delete awsInfo[envName];
    stateManager.setLocalAWSInfo(undefined, awsInfo);
  }

  // Remove env feature flags
  if (FeatureFlags.isInitialized()) {
    await FeatureFlags.removeFeatureFlagConfiguration(false, [envName]);
  }

  printer.success('Successfully removed environment from your project locally');
};
