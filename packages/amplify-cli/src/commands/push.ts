import {
  $TSAny,
  $TSContext,
  AmplifyError,
  AmplifyFault,
  stateManager,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import sequential from 'promise-sequential';
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
    const amplifyMeta = stateManager.getMeta();
    const providerPlugins = getProviderPlugins(context);
    const pullCurrentCloudTasks: (() => Promise<$TSAny>)[] = [];

    for (const provider of context.exeInfo.projectConfig.providers) {
      const providerModule = await import(providerPlugins[provider]);
      pullCurrentCloudTasks.push(() => providerModule.initEnv(context, amplifyMeta.providers[provider]));
    }

    await notifySecurityEnhancement(context);

    let securityChangeNotified = false;
    securityChangeNotified = await notifyFieldAuthSecurityChange(context);

    if (!securityChangeNotified) {
      securityChangeNotified = await notifyListQuerySecurityChange(context);
    }

    printer.info(`Fetching updates to backend environment: ${currentEnv} from the cloud.`);
    await sequential(pullCurrentCloudTasks);
    printer.success(`Successfully pulled backend environment ${currentEnv} from the cloud.`);
  } catch (e) {
    printer.error(`There was an error pulling the backend environment ${currentEnv}.`);
    throw new AmplifyFault('BackendPullFault', { message: e.message }, e);
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
    throw new AmplifyError('NoUpdateBackendError', { message: 'The local environment configuration does not allow backend updates.' });
  }
  if (context.parameters.options.force) {
    context.exeInfo.forcePush = true;
  }
  await syncCurrentCloudBackend(context);
  await updateTrackedFiles();
  return context.amplify.pushResources(context);
};
