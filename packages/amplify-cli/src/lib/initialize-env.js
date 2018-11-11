const fs = require('fs-extra');
const sequential = require('promise-sequential');
const ora = require('ora');

const spinner = ora('');

const { getProviderPlugins } = require('../extensions/amplify-helpers/get-provider-plugins');

async function initializeEnv(context) {
  const currentEnv = context.exeInfo.localEnvInfo.envName;
  spinner.start(`Initializing your environment: ${currentEnv}`);
  try {
    const { projectPath } = context.exeInfo.localEnvInfo;
    const providerInfoFilePath = context.amplify.pathManager.getProviderInfoFilePath(projectPath);
    const amplifyMeta = {};
    amplifyMeta.providers = JSON.parse(fs.readFileSync(providerInfoFilePath))[currentEnv];

    if (!context.exeInfo.restoreBackend) {
      populateAmplifyMeta(context, amplifyMeta);
    }

    const providerPlugins = getProviderPlugins(context);

    const initializationTasks = [];
    const providerPushTasks = [];

    context.exeInfo.projectConfig.providers.forEach((provider) => {
      const providerModule = require(providerPlugins[provider]);
      initializationTasks.push(() => providerModule.initEnv(
        context,
        amplifyMeta.providers[provider],
      ));
    });

    await sequential(initializationTasks);

    if (context.exeInfo.forcePush === undefined) {
      context.exeInfo.forcePush = await context.prompt.confirm('Do you want to push your resources to the cloud for your environment?');
    }

    if (context.exeInfo.forcePush) {
      context.exeInfo.projectConfig.providers.forEach((provider) => {
        const providerModule = require(providerPlugins[provider]);
        providerPushTasks.push(() => providerModule.pushResources(context));
      });
      await sequential(providerPushTasks);
    }

    // Generate AWS exports/configurtion file
    context.amplify.onCategoryOutputsChange(context);

    spinner.succeed('Initialized your environment successfully.');
  } catch (e) {
    spinner.fail('There was an error initializing your environment.');
    throw e;
  }
}

function populateAmplifyMeta(context, amplifyMeta) {
  const { projectPath } = context.exeInfo.localEnvInfo;

  const backendConfigFilePath = context.amplify.pathManager.getBackendConfigFilePath(projectPath);

  const backendResourceInfo = JSON.parse(fs.readFileSync(backendConfigFilePath));

  Object.assign(amplifyMeta, backendResourceInfo);

  const backendMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath(projectPath);
  const jsonString = JSON.stringify(amplifyMeta, null, 4);

  fs.writeFileSync(backendMetaFilePath, jsonString, 'utf8');
}

module.exports = {
  initializeEnv,
};
