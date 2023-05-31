import { $TSAny, $TSContext, AmplifyFault, spinner, stateManager } from '@aws-amplify/amplify-cli-core';
import sequential from 'promise-sequential';
import { notifyFieldAuthSecurityChange, notifyListQuerySecurityChange, notifySecurityEnhancement } from './auth-notifications';
import { getProviderPlugins } from './get-provider-plugins';
import { getProjectConfig } from './get-project-config';

/**
 * Download and unzip deployment bucket contents to #current-cloud-backend so amplify status shows correct state
 */
export const syncCurrentCloudBackend = async (context: $TSContext): Promise<void> => {
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

    if (!(await notifyFieldAuthSecurityChange(context))) {
      await notifyListQuerySecurityChange(context);
    }

    spinner.start(`Fetching updates to backend environment: ${currentEnv} from the cloud.`);
    await sequential(pullCurrentCloudTasks);
    spinner.succeed(`Successfully pulled backend environment ${currentEnv} from the cloud.`);
  } catch (e) {
    spinner.fail(`There was an error pulling the backend environment ${currentEnv}.`);
    throw new AmplifyFault('BackendPullFault', { message: e.message }, e);
  }
};

/**
 * Delegates storeCurrentCloudBackend to all providers (just aws cfn provider)
 */
export const storeCurrentCloudBackend = async (context: $TSContext): Promise<void> => {
  const { providers } = getProjectConfig();
  const providerPlugins = getProviderPlugins(context);

  await Promise.all(
    providers.map(async (provider: string) => {
      const providerModule = await import(providerPlugins[provider]);
      return providerModule.storeCurrentCloudBackend(context);
    }),
  );
};
