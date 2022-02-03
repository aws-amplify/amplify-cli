import sequential from 'promise-sequential';
import ora from 'ora';
import {
  $TSAny,
  $TSContext,
  $TSObject,
  stateManager,
  exitOnNextTick,
  ConfigurationError,
  FeatureFlags,
  pathManager,
} from 'amplify-cli-core';
import { getProviderPlugins } from '../extensions/amplify-helpers/get-provider-plugins';
import { showTroubleshootingURL } from './help';
import { printer, prompter } from 'amplify-prompts';
import { collectDirectivesByTypeNames, readProjectConfiguration } from 'graphql-transformer-core';
import path from 'path';
import fs from 'fs-extra';
import { notifyFieldAuthSecurityChange } from '../extensions/amplify-helpers/auth-notifications';


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

    await notifySecurityEnhancement(context);
    await notifyFieldAuthSecurityChange(context);

    spinner.start(`Fetching updates to backend environment: ${currentEnv} from the cloud.`);
    await sequential(pullCurrentCloudTasks);
    spinner.succeed(`Successfully pulled backend environment ${currentEnv} from the cloud.`);
  } catch (e) {
    spinner.fail(`There was an error pulling the backend environment ${currentEnv}.`);
    throw e;
  }
}

async function pushHooks(context: $TSContext) {
  context.exeInfo.pushHooks = true;
  const providerPlugins = getProviderPlugins(context);
  const pushHooksTasks: (() => Promise<$TSAny>)[] = [];
  context.exeInfo.projectConfig.providers.forEach(provider => {
    const providerModule = require(providerPlugins[provider]);
    pushHooksTasks.push(() => providerModule.uploadHooksDirectory(context));
  });
  await sequential(pushHooksTasks);
}

export const run = async (context: $TSContext) => {
  try {
    context.amplify.constructExeInfo(context);
    if (context.exeInfo.localEnvInfo.noUpdateBackend) {
      throw new ConfigurationError('The local environment configuration does not allow backend updates.');
    }
    if (context.parameters.options.force) {
      context.exeInfo.forcePush = true;
    }
    await pushHooks(context);
    await syncCurrentCloudBackend(context);
    return await context.amplify.pushResources(context);
  } catch (e) {
    const message = e.name === 'GraphQLError' ? e.toString() : e.message;
    printer.error(`An error occurred during the push operation: ${message}`);
    await context.usageData.emitError(e);
    showTroubleshootingURL();
    exitOnNextTick(1);
  }
};

async function notifySecurityEnhancement(context) {
  if (FeatureFlags.getBoolean('graphqltransformer.securityEnhancementNotification')) {
    const projectPath = pathManager.findProjectRoot() ?? process.cwd();
    const meta = stateManager.getMeta();

    const apiNames = Object.entries(meta?.api || {})
      .filter(([_, apiResource]) => (apiResource as $TSAny).service === 'AppSync')
      .map(([name]) => name);

    if (apiNames.length !== 1) {
      await unsetSecurityNotificationFlag(projectPath);
      return;
    }

    const apiName = apiNames[0];

    const apiResourceDir = pathManager.getResourceDirectoryPath(projectPath, 'api', apiName);
    const project = await readProjectConfiguration(apiResourceDir);

    const directiveMap = collectDirectivesByTypeNames(project.schema);
    const notifyAuthWithKey = Object.keys(directiveMap.types).some(
      type => directiveMap.types[type].includes('auth') && directiveMap.types[type].includes('primaryKey'),
    );

    if (meta?.auth && notifyAuthWithKey) {
      printer.blankLine();
      const shouldContinue = await prompter.yesOrNo(
        `This version of Amplify CLI introduces additional security enhancements for your GraphQL API. @auth authorization rules applied on primary keys and indexes are scoped down further. The changes are applied automatically with this deployment. This change won't impact your client code. Continue`,
      );

      if (!shouldContinue) {
        await context.usageData.emitSuccess();
        exitOnNextTick(0);
      }

      const schemaPath = path.join(apiResourceDir, 'schema.graphql');
      fs.appendFile(schemaPath, ' ');

      await unsetSecurityNotificationFlag(projectPath);
    } else {
      await unsetSecurityNotificationFlag(projectPath);
    }
  }

  async function unsetSecurityNotificationFlag(projectPath: string) {
    let config = stateManager.getCLIJSON(projectPath, undefined, {
      throwIfNotExist: false,
      preserveComments: true,
    });

    if (config?.features?.graphqltransformer?.securityEnhancementNotification) {
      config.features.graphqltransformer.securityEnhancementNotification = false;
      stateManager.setCLIJSON(projectPath, config);
      await FeatureFlags.reloadValues();
    }
  }
}
