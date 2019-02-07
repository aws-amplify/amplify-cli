const fs = require('fs-extra');
const ora = require('ora');
const mobileHubService = require('amplify-provider-awscloudformation/src/aws-utils/aws-mobilehub');

const spinner = ora('');

async function importProject(context) {
  if (context.parameters.first) {
    const projectId = context.parameters.first;
    try {
      spinner.start('Importing your project');
      const mobileHubResources = await getMobileResources(projectId);
      await persistResourcesToConfig(mobileHubResources, context);
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
    persistMergedAmplifyMetaConfig(mergedBackendConfig, context);
  }
}

function persistMergedAmplifyMetaConfig(mergedConfigs, context) {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  const jsonString = JSON.stringify(mergedConfigs, null, 4);
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

module.exports = {
  importProject,
};
