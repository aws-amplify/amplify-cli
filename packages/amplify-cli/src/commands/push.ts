import { ensureEnvMeta } from '@aws-amplify/amplify-environment-parameters';
import {
  $TSAny,
  $TSContext,
  amplifyErrorWithTroubleshootingLink,
  amplifyFaultWithTroubleshootingLink,
  spinner,
} from 'amplify-cli-core';
import {
  notifyFieldAuthSecurityChange,
  notifyListQuerySecurityChange,
  notifySecurityEnhancement,
} from '../extensions/amplify-helpers/auth-notifications';
import {
  getProviderPlugins,
} from '../extensions/amplify-helpers/get-provider-plugins';
import { updateCognitoTrackedFiles } from '../extensions/amplify-helpers/update-tracked-files';

/**
 * Download and unzip deployment bucket contents to #current-cloud-backend so amplify status shows correct state
 */
const syncCurrentCloudBackend = async (context: $TSContext): Promise<void> => {
  context.exeInfo.restoreBackend = false;
  const currentEnv = context.exeInfo.localEnvInfo.envName;

  try {
    const providerPlugins = getProviderPlugins(context);
    const awsProviderPlugin = await import(providerPlugins.awscloudformation);
    if (!awsProviderPlugin) {
      throw amplifyFaultWithTroubleshootingLink('PluginNotLoadedFault', { message: 'Could not find AWS CloudFormation provider plugin' });
    }

    spinner.start(`Fetching updates to backend environment: ${currentEnv} from the cloud.`);
    await awsProviderPlugin.initEnv(context, await ensureEnvMeta(context, currentEnv));

    await notifySecurityEnhancement(context);

    let securityChangeNotified = false;
    securityChangeNotified = await notifyFieldAuthSecurityChange(context);

    if (!securityChangeNotified) {
      securityChangeNotified = await notifyListQuerySecurityChange(context);
    }
    spinner.succeed(`Successfully pulled backend environment ${currentEnv} from the cloud.`);
  } catch (e) {
    spinner.fail(`There was an error pulling the backend environment ${currentEnv}.`);
    throw amplifyFaultWithTroubleshootingLink('BackendPullFault', { message: e.message });
  }
};

/**
 * Updates tracked files for auto updates in the build directory that will not be detected for 'amplify push'
 */
const updateTrackedFiles = async (): Promise<void> => {
  await updateCognitoTrackedFiles();
};

/**
 * Runs push command
 */
export const run = async (context: $TSContext): Promise<$TSAny> => {
  context.amplify.constructExeInfo(context);
  if (context.exeInfo.localEnvInfo.noUpdateBackend) {
    throw amplifyErrorWithTroubleshootingLink('NoUpdateBackendError', { message: 'The local environment configuration does not allow backend updates.' });
  }
  if (context.parameters.options.force) {
    context.exeInfo.forcePush = true;
  }
  await syncCurrentCloudBackend(context);
  await updateTrackedFiles();
  return context.amplify.pushResources(context);
};
