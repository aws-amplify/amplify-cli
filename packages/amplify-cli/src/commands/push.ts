import {
  $TSAny, $TSContext, ConfigurationError, exitOnNextTick, stateManager, spinner,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import sequential from 'promise-sequential';
import { notifyFieldAuthSecurityChange, notifyListQuerySecurityChange, notifySecurityEnhancement } from '../extensions/amplify-helpers/auth-notifications';
import { getProviderPlugins } from '../extensions/amplify-helpers/get-provider-plugins';
import { showTroubleshootingURL } from './help';
import { reportError } from './diagnose';
import { Context } from '../domain/context';

/**
 * Download and unzip deployment bucket contents to #current-cloud-backend so amplify status shows correct state
 */
const syncCurrentCloudBackend = async (context: $TSContext): Promise<void> => {
  context.exeInfo.restoreBackend = false;

  const currentEnv = context.exeInfo.localEnvInfo.envName;

  try {
    const amplifyMeta = stateManager.getMeta();

    const providerPlugins = getProviderPlugins(context);

    const pullCurrentCloudTasks: (() => Promise<$TSAny>)[] = [];

    context.exeInfo.projectConfig.providers.forEach(provider => {
      // eslint-disable-next-line
      const providerModule = require(providerPlugins[provider]);
      pullCurrentCloudTasks.push(() => providerModule.initEnv(context, amplifyMeta.providers[provider]));
    });

    await notifySecurityEnhancement(context);

    let securityChangeNotified = false;
    securityChangeNotified = await notifyFieldAuthSecurityChange(context);

    if (!securityChangeNotified) {
      securityChangeNotified = await notifyListQuerySecurityChange(context);
    }

    spinner.start(`Fetching updates to backend environment: ${currentEnv} from the cloud.`);
    await sequential(pullCurrentCloudTasks);
    spinner.succeed(`Successfully pulled backend environment ${currentEnv} from the cloud.`);
  } catch (e) {
    spinner.fail(`There was an error pulling the backend environment ${currentEnv}.`);
    throw e;
  }
};

/**
 * Runs push command
 */
export const run = async (context: $TSContext): Promise<$TSAny|void> => {
  try {
    context.amplify.constructExeInfo(context);
    if (context.exeInfo.localEnvInfo.noUpdateBackend) {
      throw new ConfigurationError('The local environment configuration does not allow backend updates.');
    }
    if (context.parameters.options.force) {
      context.exeInfo.forcePush = true;
    }
    await syncCurrentCloudBackend(context);
    return await context.amplify.pushResources(context);
  } catch (e) {
    const message = (e.name === 'GraphQLError' || e.name === 'InvalidMigrationError') ? e.toString() : e.message;
    printer.error(`An error occurred during the push operation: \n${message}`);
    await reportError(context as unknown as Context, e);
    await context.usageData.emitError(e);
    showTroubleshootingURL();
    exitOnNextTick(1);
    return undefined;
  }
};
