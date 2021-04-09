import _ from 'lodash';
import ora from 'ora';
import sequential from 'promise-sequential';
import { stateManager, $TSAny, $TSMeta, $TSContext } from 'amplify-cli-core';
import { getProviderPlugins } from './extensions/amplify-helpers/get-provider-plugins';
const spinner = ora('');

export async function initializeEnv(context: $TSContext, currentAmplifyMeta?: $TSMeta) {
  const currentEnv = context.exeInfo.localEnvInfo.envName;
  const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && context.input.subCommands[0] === 'pull');

  try {
    const { projectPath } = context.exeInfo.localEnvInfo;

    const amplifyMeta: $TSMeta = {};
    const teamProviderInfo = stateManager.getTeamProviderInfo(projectPath);

    amplifyMeta.providers = _.pick(teamProviderInfo[currentEnv], 'awscloudformation');

    if (!currentAmplifyMeta) {
      // Get current-cloud-backend's amplify-meta
      if (stateManager.currentMetaFileExists()) {
        currentAmplifyMeta = stateManager.getCurrentMeta();
      }
    }

    if (!context.exeInfo.restoreBackend) {
      populateAmplifyMeta(projectPath, amplifyMeta);
    }

    const categoryInitializationTasks: (() => Promise<$TSAny>)[] = [];

    const initializedCategories = Object.keys(stateManager.getMeta());
    const categoryPluginInfoList = context.amplify.getAllCategoryPluginInfo(context);
    const availableCategories = Object.keys(categoryPluginInfoList).filter(key => initializedCategories.includes(key));

    availableCategories.forEach(category => {
      categoryPluginInfoList[category].forEach(pluginInfo => {
        try {
          const { initEnv } = require(pluginInfo.packageLocation);

          if (initEnv) {
            categoryInitializationTasks.push(() => initEnv(context));
          }
        } catch (e) {
          context.print.warning(`Could not load initEnv for ${category}`);
        }
      });
    });

    const providerPlugins = getProviderPlugins(context);

    const initializationTasks: (() => Promise<$TSAny>)[] = [];
    const providerPushTasks: (() => Promise<$TSAny>)[] = [];

    context.exeInfo.projectConfig.providers.forEach(provider => {
      const providerModule = require(providerPlugins[provider]);
      initializationTasks.push(() => providerModule.initEnv(context, amplifyMeta.providers[provider]));
    });

    spinner.start(
      isPulling ? `Fetching updates to backend environment: ${currentEnv} from the cloud.` : `Initializing your environment: ${currentEnv}`,
    );

    try {
      await sequential(initializationTasks);
    } catch (e) {
      context.print.error(`Could not initialize '${currentEnv}': ${e.message}`);
      context.usageData.emitError(e);
      process.exit(1);
    }

    spinner.succeed(
      isPulling ? `Successfully pulled backend environment ${currentEnv} from the cloud.` : 'Initialized provider successfully.',
    );

    const projectDetails = context.amplify.getProjectDetails();

    context.exeInfo = context.exeInfo || {};
    Object.assign(context.exeInfo, projectDetails);

    await sequential(categoryInitializationTasks);

    if (context.exeInfo.forcePush === undefined) {
      context.exeInfo.forcePush = await context.amplify.confirmPrompt(
        'Do you want to push your resources to the cloud for your environment?',
      );
    }

    if (context.exeInfo.forcePush) {
      for (let provider of context.exeInfo.projectConfig.providers) {
        const providerModule = require(providerPlugins[provider]);
        const resourceDefiniton = await context.amplify.getResourceStatus(undefined, undefined, provider);
        providerPushTasks.push(() => providerModule.pushResources(context, resourceDefiniton));
      }

      await sequential(providerPushTasks);
    }

    // Generate AWS exports/configurtion file
    await context.amplify.onCategoryOutputsChange(context, currentAmplifyMeta);

    context.print.success(isPulling ? '' : 'Initialized your environment successfully.');
  } catch (e) {
    spinner.fail('There was an error initializing your environment.');
    throw e;
  }
}

function populateAmplifyMeta(projectPath: string, amplifyMeta: $TSMeta) {
  const backendConfig = stateManager.getBackendConfig(projectPath);
  Object.assign(amplifyMeta, backendConfig);
  stateManager.setMeta(projectPath, amplifyMeta);
}
