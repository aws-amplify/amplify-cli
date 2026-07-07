/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-dynamic-require */
import sequential from 'promise-sequential';
import { $TSAny, $TSContext, AmplifyError, stateManager } from '@aws-amplify/amplify-cli-core';
import { initializeEnv } from '../../initialize-env';
import { getProviderPlugins } from '../../extensions/amplify-helpers/get-provider-plugins';
import { getEnvInfo } from '../../extensions/amplify-helpers/get-env-info';

/**
 * Entry point for env checkout command
 */
export const run = async (context: $TSContext): Promise<void> => {
  const envName = context.parameters.first;

  // Check if environment exists

  const allEnvs = context.amplify.getEnvDetails();
  if (!envName || !allEnvs[envName]) {
    throw new AmplifyError('EnvironmentNameError', {
      message: 'Environment name is invalid.',
      resolution: `Run amplify env list to get a list of valid environments.`,
    });
  }

  // Set the current env to the environment name provided

  const localEnvInfo = getEnvInfo();
  localEnvInfo.envName = envName;
  stateManager.setLocalEnvInfo(undefined, localEnvInfo);

  if (localEnvInfo.noUpdateBackend) {
    throw new AmplifyError('NoUpdateBackendError', {
      message: 'The local environment configuration does not allow modifying the backend.',
      resolution: `Use amplify env pull --envName ${envName}`,
    });
  }

  // Setup exe info
  context.amplify.constructExeInfo(context);
  context.exeInfo.forcePush = false;
  context.exeInfo.isNewEnv = false;
  context.exeInfo.restoreBackend = context.parameters.options?.restore;

  // Setup Provider creds/info
  const initializationTasks: (() => Promise<$TSAny>)[] = [];
  const providerPlugins = getProviderPlugins(context);
  context.exeInfo.projectConfig.providers.forEach((provider) => {
    const providerModule = require(providerPlugins[provider]);
    initializationTasks.push(() => providerModule.init(context, allEnvs[envName][provider]));
  });

  await sequential(initializationTasks);

  const onInitSuccessfulTasks: (() => Promise<$TSAny>)[] = [];
  context.exeInfo.projectConfig.providers.forEach((provider) => {
    const providerModule = require(providerPlugins[provider]);
    onInitSuccessfulTasks.push(() => providerModule.onInitSuccessful(context, allEnvs[envName][provider]));
  });

  await sequential(onInitSuccessfulTasks);

  // Initialize the environment

  await initializeEnv(context);
};
