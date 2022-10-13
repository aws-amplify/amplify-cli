import ora from 'ora';
import sequential from 'promise-sequential';
import {
  stateManager, $TSAny, $TSMeta, $TSContext, amplifyFaultWithTroubleshootingLink,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import {
  ensureEnvParamManager, IEnvironmentParameterManager, ensureEnvMeta, getEnvMeta,
} from '@aws-amplify/amplify-environment-parameters';
import { initEnv as providerInitEnv, pushResources } from 'amplify-provider-awscloudformation';
import { getProviderPlugins } from './extensions/amplify-helpers/get-provider-plugins';
import { ManuallyTimedCodePath } from './domain/amplify-usageData/UsageDataTypes';

const spinner = ora('');

/**
 * Entry point for initializing an environment. Delegates out to plugins initEnv function
 */
export const initializeEnv = async (
  context: $TSContext,
  currentAmplifyMeta: $TSMeta = stateManager.currentMetaFileExists() ? stateManager.getCurrentMeta() : undefined,
): Promise<void> => {
  const currentEnv = context.exeInfo.localEnvInfo.envName;
  const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && context.input.subCommands[0] === 'pull');

  try {
    const { projectPath } = context.exeInfo.localEnvInfo;

    const envParamManager = (await ensureEnvParamManager(currentEnv)).instance;

    const categoryMeta = { providers: { awscloudformation: {} } };
    (await ensureEnvMeta(context, currentEnv)).write(false, (metaObj => { categoryMeta.providers.awscloudformation = metaObj; }));

    if (!context.exeInfo.restoreBackend) {
      mergeBackendConfigIntoAmplifyMeta(projectPath, categoryMeta);
      mergeCategoryEnvParamsIntoAmplifyMeta(envParamManager, categoryMeta, 'hosting', 'ElasticContainer');
      stateManager.setMeta(projectPath, categoryMeta);
    }

    const categoryInitializationTasks: (() => Promise<$TSAny>)[] = [];

    const initializedCategories = Object.keys(stateManager.getBackendConfig(undefined, { throwIfNotExist: false }) || {});
    const categoryPluginInfoList = context.amplify.getAllCategoryPluginInfo(context);
    const availableCategories = Object.keys(categoryPluginInfoList).filter(key => initializedCategories.includes(key));

    const importCategoryPluginAndQueueInitEnvTask = async (pluginInfo, category) : Promise<void> => {
      try {
        const { initEnv } = await import(pluginInfo.packageLocation);

        if (initEnv) {
          categoryInitializationTasks.push(() => initEnv(context));
        }
      } catch (e) {
        throw amplifyFaultWithTroubleshootingLink('PluginNotLoadedFault', {
          message: `Could not load plugin for category ${category}.`,
          details: e.message,
          resolution: `Review the error message and stack trace for additional information.`,
          stack: e.stack,
        }, e);
      }
    };
    const currentEnvMeta = await ensureEnvMeta(context, currentEnv);
    for (const category of availableCategories) {
      for (const pluginInfo of categoryPluginInfoList[category]) {
        await importCategoryPluginAndQueueInitEnvTask(pluginInfo, category);
      }
    }

    const providerPlugins = getProviderPlugins(context);
    const pluginKeys = Object.keys(providerPlugins);
    if (!(pluginKeys.length === 1 && pluginKeys[0] === 'awscloudformation')) {
      // TODO convert to AmplifyError
      throw new Error('Amplify no longer supports provider plugins');
    }

    spinner.start(
      isPulling ? `Fetching updates to backend environment: ${currentEnv} from the cloud.` : `Initializing your environment: ${currentEnv}`,
    );

    try {
      context.usageData.startCodePathTimer(ManuallyTimedCodePath.INIT_ENV_PLATFORM);
      await providerInitEnv(context, currentEnvMeta);
    } finally {
      context.usageData.stopCodePathTimer(ManuallyTimedCodePath.INIT_ENV_PLATFORM);
    }

    spinner.succeed(
      isPulling ? `Successfully pulled backend environment ${currentEnv} from the cloud.` : 'Initialized provider successfully.',
    );

    const projectDetails = context.amplify.getProjectDetails();

    context.exeInfo = context.exeInfo || {};
    Object.assign(context.exeInfo, projectDetails);

    try {
      context.usageData.startCodePathTimer(ManuallyTimedCodePath.INIT_ENV_CATEGORIES);
      await sequential(categoryInitializationTasks);
    } catch (e) {
      throw amplifyFaultWithTroubleshootingLink('ProjectInitFault', {
        message: `Could not initialize categories for '${currentEnv}': ${e.message}`,
        resolution: 'Review the error message and stack trace for additional information.',
        stack: e.stack,
      }, e);
    } finally {
      context.usageData.stopCodePathTimer(ManuallyTimedCodePath.INIT_ENV_CATEGORIES);
    }

    if (context.exeInfo.forcePush === undefined) {
      context.exeInfo.forcePush = await context.amplify.confirmPrompt(
        'Do you want to push your resources to the cloud for your environment?',
      );
    }

    if (context.exeInfo.forcePush) {
      const resourceDefinition = await context.amplify.getResourceStatus(undefined, undefined, 'awscloudformation');
      await pushResources(context, resourceDefinition);
    }

    // save the current environment metadata so that it is loaded properly by the frontend plugins when generating frontend config
    getEnvMeta(currentEnv).write();

    // Generate AWS exports/configuration file
    await context.amplify.onCategoryOutputsChange(context, currentAmplifyMeta);

    printer.success(isPulling ? '' : 'Initialized your environment successfully.');
  } catch (e) {
    // let the error propagate up after we safely exit the spinner
    spinner.fail('There was an error initializing your environment.');
    throw e;
  }
};

const mergeBackendConfigIntoAmplifyMeta = (projectPath: string, amplifyMeta: $TSMeta): void => {
  const backendConfig = stateManager.getBackendConfig(projectPath);
  Object.assign(amplifyMeta, backendConfig);
};

const mergeCategoryEnvParamsIntoAmplifyMeta = (
  envParamManager: IEnvironmentParameterManager,
  amplifyMeta: $TSMeta,
  category: string,
  serviceName: string,
): void => {
  if (
    envParamManager.hasResourceParamManager(category, serviceName)
    && envParamManager.getResourceParamManager(category, serviceName).hasAnyParams()
  ) {
    Object.assign(amplifyMeta[category][serviceName], envParamManager.getResourceParamManager(category, serviceName).getAllParams());
  }
};
