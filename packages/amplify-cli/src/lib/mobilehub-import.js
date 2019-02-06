const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const inquirer = require('inquirer');
const utils = require('amplify-provider-awscloudformation/lib/utility-functions');
const mobileHubService = require('amplify-provider-awscloudformation/src/aws-utils/aws-mobilehub');

const spinner = ora('');

const {
  searchProjectRootPath,
  getAmplifyMetaFilePath,
  getBackendConfigFilePath,
} = require('../extensions/amplify-helpers/path-manager');

async function importProject(context) {
  const projectPath = searchProjectRootPath();
  if (context.parameters.first) {
    const projectId = context.parameters.first;
    try {
      spinner.start('Importing your project');
      const mobileHubResources = await getMobileResources(context, projectId);
      await persistResourcesToConfig(mobileHubResources, projectPath);
      spinner.succeed('Importing your project was successfully.');
    } catch (error) {
      spinner.fail('There was an error importing your project.');
    }
  } else {
    context.print.error('Something went wrong. You did not specifiy a project id. Try this format \' amplify mobilehub-import [PROJECT-ID] \'');
  }
}
async function getMobileResources(context, projectId) {
  const mobilehubResources = await mobileHubService.getProjectResources(projectId);
  return JSON.parse(mobilehubResources);
}

async function persistResourcesToConfig(mobileHubResources, projectPath) {
  if (mobileHubResources) {
    const amplifyMetaConfig = getAmplifyMetaConfig(projectPath);
    const mergedBackendConfig = mergeConfig(amplifyMetaConfig, mobileHubResources);
    persistMergedAmplifyMetaConfig(projectPath, mergedBackendConfig);
  }
}

function persistMergedAmplifyMetaConfig(projectPath, mergedConfigs) {
  const currentBackedConfigPath = getBackendConfigFilePath(projectPath);
  const jsonString = JSON.stringify(mergedConfigs, null, 4);
  fs.writeFileSync(currentBackedConfigPath, jsonString, 'utf8');
}

function getAmplifyMetaConfig(projectPath) {
  const amplifyMetaConfig = getAmplifyMetaFilePath(projectPath);
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
