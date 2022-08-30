/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import sequential from 'promise-sequential';
import { $TSAny, $TSContext, stateManager } from 'amplify-cli-core';
import { ensureEnvMeta, getEnvMeta, listLocalEnvNames } from '@aws-amplify/amplify-environment-parameters';
import { printer } from 'amplify-prompts';
import { initializeEnv } from '../../initialize-env';
import { getProviderPlugins } from '../../extensions/amplify-helpers/get-provider-plugins';
import { getEnvInfo } from '../../extensions/amplify-helpers/get-env-info';

/**
 * Entry point for initializing environments
 */
export const run = async (context: $TSContext): Promise<void> => {
  const envName = context.parameters.first;

  // Check if environment exists

  const allEnvNames = listLocalEnvNames();

  if (!allEnvNames.includes(envName)) {
    printer.error('Please pass in a valid environment name. Run amplify env list to get a list of valid environments');
    return;
  }

  // load env meta from specified environment
  await ensureEnvMeta(context, envName);

  // Set the current env to the environment name provided
  const localEnvInfo = getEnvInfo();
  localEnvInfo.envName = envName;
  stateManager.setLocalEnvInfo(undefined, localEnvInfo);

  if (localEnvInfo.noUpdateBackend) {
    printer.error(
      `The local environment configuration does not allow modifying the backend.\nUse amplify env pull --envName ${envName}`,
    );
    process.exitCode = 1;
    return;
  }

  // Setup exeInfo
  context.amplify.constructExeInfo(context);
  context.exeInfo.forcePush = false;
  context.exeInfo.isNewEnv = false;
  context.exeInfo.restoreBackend = context.parameters.options.restore;

  // Setup Provider creds/info
  const initializationTasks: (() => Promise<$TSAny>)[] = [];
  const providerPlugins = getProviderPlugins(context);
  context.exeInfo.projectConfig.providers.forEach(provider => {
    const providerModule = require(providerPlugins[provider]);
    initializationTasks.push(async () => providerModule.init(context, getEnvMeta(envName)));
  });

  await sequential(initializationTasks);

  const onInitSuccessfulTasks: (() => Promise<$TSAny>)[] = [];
  context.exeInfo.projectConfig.providers.forEach(provider => {
    const providerModule = require(providerPlugins[provider]);
    onInitSuccessfulTasks.push(async () => providerModule.onInitSuccessful(context, getEnvMeta(envName)));
  });

  await sequential(onInitSuccessfulTasks);

  // Initialize the environment

  await initializeEnv(context);
};
