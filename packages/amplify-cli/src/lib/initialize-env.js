const fs = require('fs-extra');
const sequential = require('promise-sequential');
const ora = require('ora');
const { readJsonFile } = require('../extensions/amplify-helpers/read-json-file');

const spinner = ora('');

const { getProviderPlugins } = require('../extensions/amplify-helpers/get-provider-plugins');

async function initializeEnv(context, currentAmplifyMeta) {
  const currentEnv = context.exeInfo.localEnvInfo.envName;
  try {
    const { projectPath } = context.exeInfo.localEnvInfo;
    const providerInfoFilePath = context.amplify.pathManager.getProviderInfoFilePath(projectPath);
    const amplifyMeta = {};
    amplifyMeta.providers = readJsonFile(providerInfoFilePath)[currentEnv];

    if (!currentAmplifyMeta) {
      // Get current-cloud-backend's amplify-meta
      const currentAmplifyMetafilePath = context.amplify.pathManager.getCurentAmplifyMetaFilePath();

      if (fs.existsSync(currentAmplifyMetafilePath)) {
        currentAmplifyMeta = readJsonFile(currentAmplifyMetafilePath);
      }
    }

    if (!context.exeInfo.restoreBackend) {
      populateAmplifyMeta(context, amplifyMeta);
    }

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

    spinner.start(`Initializing your environment: ${currentEnv}`);
    await sequential(initializationTasks);
    spinner.succeed('Initialized provider successfully.');

    const projectDetails = context.amplify.getProjectDetails();
    context.exeInfo = context.exeInfo || {};
    Object.assign(context.exeInfo, projectDetails);
    await sequential(categoryInitializationTasks);

    if (context.exeInfo.forcePush === undefined) {
      context.exeInfo.forcePush = await context.amplify.confirmPrompt.run('Do you want to push your resources to the cloud for your environment?');
    }
    if (context.exeInfo.forcePush) {
      for (let i = 0; i < context.exeInfo.projectConfig.providers.length; i += 1) {
        const provider = context.exeInfo.projectConfig.providers[i];
        const providerModule = require(providerPlugins[provider]);
        const resourceDefiniton = await context.amplify.getResourceStatus(
          undefined,
          undefined,
          provider,
        );
        providerPushTasks.push(() => providerModule.pushResources(context, resourceDefiniton));
      }
      await sequential(providerPushTasks);
    }
    // Generate AWS exports/configurtion file
    await context.amplify.onCategoryOutputsChange(context, currentAmplifyMeta);
    context.print.success('Initialized your environment successfully.');
  } catch (e) {
    spinner.fail('There was an error initializing your environment.');
    throw e;
  }
}

function populateAmplifyMeta(context, amplifyMeta) {
  const { projectPath } = context.exeInfo.localEnvInfo;

  const backendConfigFilePath = context.amplify.pathManager.getBackendConfigFilePath(projectPath);

  const backendResourceInfo = readJsonFile(backendConfigFilePath);

  Object.assign(amplifyMeta, backendResourceInfo);

  const backendMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath(projectPath);
  const jsonString = JSON.stringify(amplifyMeta, null, 4);

  fs.writeFileSync(backendMetaFilePath, jsonString, 'utf8');
}

module.exports = {
  initializeEnv,
};
