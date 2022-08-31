import {
  $TSAny,
  $TSContext,
  AmplifyError,
  AMPLIFY_SUPPORT_DOCS,
  spinner,
  stateManager,
} from 'amplify-cli-core';
import sequential from 'promise-sequential';
import {
  notifyFieldAuthSecurityChange,
  notifyListQuerySecurityChange,
  notifySecurityEnhancement,
} from '../extensions/amplify-helpers/auth-notifications';
import {
  getProviderPlugins,
} from '../extensions/amplify-helpers/get-provider-plugins';

/**
 * Download and unzip deployment bucket contents to #current-cloud-backend so amplify status shows correct state
 */
const syncCurrentCloudBackend = async (context: $TSContext): Promise<void> => {
  context.exeInfo.restoreBackend = false;
  const currentEnv = context.exeInfo.localEnvInfo.envName;

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
};

/**
 * Runs push command
 */
export const run = async (context: $TSContext): Promise<$TSAny> => {
  context.amplify.constructExeInfo(context);
  if (context.exeInfo.localEnvInfo.noUpdateBackend) {
    throw new AmplifyError(
      'NoUpdateBackendError',
      {
        message: 'The local environment configuration does not allow backend updates.',
        link: `${AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url}`,
      },
    );
  }
  if (context.parameters.options.force) {
    context.exeInfo.forcePush = true;
  }
  await syncCurrentCloudBackend(context);
  return context.amplify.pushResources(context);
};
