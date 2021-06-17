import sequential from 'promise-sequential';
import ora from 'ora';
import { $TSAny, $TSContext, $TSObject, stateManager, exitOnNextTick } from 'amplify-cli-core';
import { getProviderPlugins } from '../extensions/amplify-helpers/get-provider-plugins';

const spinner = ora('');

// The following code pulls the latest backend to #current-cloud-backend
// so the amplify status is correctly shown to the user before the user confirms
// to push his local developments
async function syncCurrentCloudBackend(context: $TSContext) {
  context.exeInfo.restoreBackend = false;

  const currentEnv = context.exeInfo.localEnvInfo.envName;

  try {
    const { projectPath } = context.exeInfo.localEnvInfo;
    const amplifyMeta: $TSObject = {};
    const teamProviderInfo = stateManager.getTeamProviderInfo(projectPath);

    amplifyMeta.providers = teamProviderInfo[currentEnv];

    const providerPlugins = getProviderPlugins(context);

    const pullCurrentCloudTasks: (() => Promise<$TSAny>)[] = [];

    context.exeInfo.projectConfig.providers.forEach(provider => {
      const providerModule = require(providerPlugins[provider]);
      pullCurrentCloudTasks.push(() => providerModule.initEnv(context, amplifyMeta.providers[provider]));
    });

    spinner.start(`Fetching updates to backend environment: ${currentEnv} from the cloud.`);
    await sequential(pullCurrentCloudTasks);
    spinner.succeed(`Successfully pulled backend environment ${currentEnv} from the cloud.`);
  } catch (e) {
    spinner.fail(`There was an error pulling the backend environment ${currentEnv}.`);
    throw e;
  }
}

export const run = async (context: $TSContext) => {
  try {
    context.amplify.constructExeInfo(context);
    if (context.parameters.options.force) {
      context.exeInfo.forcePush = true;
    }
    await syncCurrentCloudBackend(context);
    return await context.amplify.pushResources(context);
  } catch (e) {
    if (e.name !== 'InvalidDirectiveError') {
      const message = e.name === 'GraphQLError' ? e.toString() : e.message;
      context.print.error(`An error occurred during the push operation: ${message}`);
    }
    await context.usageData.emitError(e);
    exitOnNextTick(1);
  }
};
