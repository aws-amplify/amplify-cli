const fs = require('fs-extra');
const ora = require('ora');
const mobileHubService = require('amplify-provider-awscloudformation/src/aws-utils/aws-mobilehub');

const spinner = ora('');

async function importProject(context) {
  if (context.parameters.first) {
    const projectId = context.parameters.first;
    const frontendPlugins = context.amplify.getFrontendPlugins(context);
    const projectConfigFilePath = context.amplify.pathManager.getProjectConfigFilePath();
    const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
    try {
      spinner.start('Importing your project');
      const mobileHubResources = await getMobileResources(projectId);
      await persistResourcesToConfig(mobileHubResources, context);
      const frontendHandlerModule = require(frontendPlugins[projectConfig.frontend]);
      frontendHandlerModule.createFrontendConfigs(context, getResourceOutputs(context));
      spinner.succeed('Importing your project was successfully.');
    } catch (error) {
      console.log(error);
      spinner.fail('There was an error importing your project.');
    }
  } else {
    context.print.error('Something went wrong. You did not specifiy a project id. Try this format \' amplify mobilehub-import [PROJECT-ID] \'');
  }
}
async function getMobileResources(projectId) {
  const mobilehubResources = await mobileHubService.getProjectResources(projectId);
  return JSON.parse(mobilehubResources);
}

async function persistResourcesToConfig(mobileHubResources, context) {
  if (mobileHubResources) {
    const amplifyMetaConfig = getAmplifyMetaConfig(context);
    const mergedBackendConfig = mergeConfig(amplifyMetaConfig, mobileHubResources);
    persistToFile(mergedBackendConfig, context.amplify.pathManager.getAmplifyMetaFilePath());
    persistToFile(mergedBackendConfig, context.amplify.pathManager.getCurentAmplifyMetaFilePath());
  }
}
function persistToFile(mergedBackendConfig, filePath) {
  const amplifyMetaFilePath = filePath;
  const jsonString = JSON.stringify(mergedBackendConfig, null, 4);
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
}

function getAmplifyMetaConfig(context) {
  const amplifyMetaConfig = context.amplify.pathManager.getAmplifyMetaFilePath();
  return JSON.parse(fs.readFileSync(amplifyMetaConfig));
}

function mergeConfig(currentBackendConfig, mobilehubResources) {
  if (currentBackendConfig.providers) {
    Object.keys(mobilehubResources).forEach((category) => {
      if (!currentBackendConfig[category]) {
        currentBackendConfig[category] = mobilehubResources[category];
      }
    });
  }
  return currentBackendConfig;
}

function getResourceOutputs(context) {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));
  // Build the provider object
  const outputsByProvider = {};
  const outputsByCategory = {};
  const outputsForFrontend = {
    metadata: {},
    serviceResourceMapping: {},
  };

  Object.keys(amplifyMeta.providers).forEach((provider) => {
    outputsByProvider[provider] = {};
    outputsByProvider[provider].metadata = amplifyMeta.providers[provider] || {};
    outputsByProvider[provider].serviceResourceMapping = {};
  });

  Object.keys(amplifyMeta).forEach((category) => {
    const categoryMeta = amplifyMeta[category];
    Object.keys(categoryMeta).forEach((resourceName) => {
      const resourceMeta = categoryMeta[resourceName];
      console.log('logger');
      console.log(resourceMeta.lastPushTimeStamp);
      if (resourceMeta.output) {
        const { providerPlugin } = resourceMeta;
        if (!outputsByProvider[providerPlugin]) {
          outputsByProvider[providerPlugin] = {
            metadata: {},
            serviceResourceMapping: {},
          };
        }
        if (!outputsByProvider[providerPlugin].serviceResourceMapping[resourceMeta.service]) {
          outputsByProvider[providerPlugin].serviceResourceMapping[resourceMeta.service] = [];
        }
        /*eslint-disable*/
        outputsByProvider[providerPlugin].serviceResourceMapping[resourceMeta.service].push(resourceMeta);
         /* eslint-enable */
        if (!outputsByCategory[category]) {
          outputsByCategory[category] = {};
        }
        if (resourceMeta.service) {
          resourceMeta.output.service = resourceMeta.service;
        }
        outputsByCategory[category][resourceName] = resourceMeta.output;

        // for frontend configuration file generation
        if (!outputsForFrontend.serviceResourceMapping[resourceMeta.service]) {
          outputsForFrontend.serviceResourceMapping[resourceMeta.service] = [];
        }
        outputsForFrontend.serviceResourceMapping[resourceMeta.service].push(resourceMeta);
      }
    });
  });

  if (outputsByProvider.awscloudformation) {
    outputsForFrontend.metadata = outputsByProvider.awscloudformation.metadata;
  }
  return { outputsByProvider, outputsByCategory, outputsForFrontend };
}

module.exports = {
  importProject,
};
