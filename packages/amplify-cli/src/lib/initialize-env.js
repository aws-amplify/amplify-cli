const fs = require('fs-extra');
const sequential = require('promise-sequential');
const ora = require('ora');

const spinner = ora('');

const { getProviderPlugins } = require('../extensions/amplify-helpers/get-provider-plugins');

async function initializeEnv(context) {
  const currentEnv = context.exeInfo.localEnvInfo.envName;
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

    const categoryInitializationTasks = [];
    const initializedCategories = Object.keys(context.amplify.getProjectMeta());
    const categoryPlugins = context.amplify.getCategoryPlugins(context);
    const availableCategory = Object.keys(categoryPlugins).filter(key =>
      initializedCategories.includes(key));
    availableCategory.forEach((category) => {
      try {
        const { initEnv } = require(categoryPlugins[category]);
        if (initEnv) {
          categoryInitializationTasks.push(() => initEnv(context));
        }
      } catch (e) {
        context.print.warning(`Could not run initEnv for ${category}`);
      }
    });

    await sequential(categoryInitializationTasks);

    spinner.start(`Initializing your environment: ${currentEnv}`);
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
