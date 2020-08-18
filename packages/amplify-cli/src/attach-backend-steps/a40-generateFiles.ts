import * as fs from 'fs-extra';
import sequential from 'promise-sequential';
import { getFrontendPlugins } from '../extensions/amplify-helpers/get-frontend-plugins';
import { getProviderPlugins } from '../extensions/amplify-helpers/get-provider-plugins';
import { insertAmplifyIgnore } from '../extensions/amplify-helpers/git-manager';
import { readJsonFile } from '../extensions/amplify-helpers/read-json-file';

export async function generateFiles(context) {
  const { projectPath } = context.exeInfo.localEnvInfo;
  const { amplify } = context;

  const amplifyDirPath = amplify.pathManager.getAmplifyDirPath(projectPath);
  const dotConfigDirPath = amplify.pathManager.getDotConfigDirPath(projectPath);
  const backendDirPath = amplify.pathManager.getBackendDirPath(projectPath);
  const currentBackendDirPath = amplify.pathManager.getCurrentCloudBackendDirPath(projectPath);

  fs.ensureDirSync(amplifyDirPath);
  fs.ensureDirSync(dotConfigDirPath);
  fs.ensureDirSync(backendDirPath);
  fs.ensureDirSync(currentBackendDirPath);

  const providerPlugins = getProviderPlugins(context);
  const providerOnSuccessTasks: (() => Promise<any>)[] = [];

  const frontendPlugins = getFrontendPlugins(context);
  const frontendModule = require(frontendPlugins[context.exeInfo.projectConfig.frontend]);

  await frontendModule.onInitSuccessful(context);

  generateLocalRuntimeFiles(context);
  generateNonRuntimeFiles(context);

  context.exeInfo.projectConfig.providers.forEach(provider => {
    const providerModule = require(providerPlugins[provider]);
    providerOnSuccessTasks.push(() => providerModule.onInitSuccessful(context));
  });

  await sequential(providerOnSuccessTasks);

  const currentAmplifyMetafilePath = amplify.pathManager.getCurrentAmplifyMetaFilePath();
  let currentAmplifyMeta = {};
  if (fs.existsSync(currentAmplifyMetafilePath)) {
    currentAmplifyMeta = readJsonFile(currentAmplifyMetafilePath);
  }
  await context.amplify.onCategoryOutputsChange(context, currentAmplifyMeta);

  return context;
}

function generateLocalRuntimeFiles(context) {
  generateLocalEnvInfoFile(context);
}

export function generateLocalEnvInfoFile(context) {
  const { projectPath } = context.exeInfo.localEnvInfo;
  const jsonString = JSON.stringify(context.exeInfo.localEnvInfo, null, 4);
  const localEnvFilePath = context.amplify.pathManager.getLocalEnvFilePath(projectPath);
  fs.writeFileSync(localEnvFilePath, jsonString, 'utf8');
}

function generateNonRuntimeFiles(context) {
  generateProjectConfigFile(context);
  generateBackendConfigFile(context);
  generateProviderInfoFile(context);
  generateGitIgnoreFile(context);
}

function generateProjectConfigFile(context) {
  if (context.exeInfo.isNewProject) {
    const { projectPath } = context.exeInfo.localEnvInfo;
    const jsonString = JSON.stringify(context.exeInfo.projectConfig, null, 4);
    const projectConfigFilePath = context.amplify.pathManager.getProjectConfigFilePath(projectPath);
    fs.writeFileSync(projectConfigFilePath, jsonString, 'utf8');
  }
}

function generateProviderInfoFile(context) {
  const { projectPath, envName } = context.exeInfo.localEnvInfo;
  const { existingTeamProviderInfo, teamProviderInfo } = context.exeInfo;
  const providerInfoFilePath = context.amplify.pathManager.getProviderInfoFilePath(projectPath);

  if (existingTeamProviderInfo) {
    if (existingTeamProviderInfo[envName]) {
      if (existingTeamProviderInfo[envName].categories) {
        teamProviderInfo[envName] = teamProviderInfo[envName] || {};
        teamProviderInfo[envName].categories = existingTeamProviderInfo[envName].categories;
      }
      delete existingTeamProviderInfo[envName];
    }
    Object.assign(teamProviderInfo, existingTeamProviderInfo);
  }

  const jsonString = JSON.stringify(teamProviderInfo, null, 4);
  fs.writeFileSync(providerInfoFilePath, jsonString, 'utf8');
}

function generateBackendConfigFile(context) {
  const { projectPath } = context.exeInfo.localEnvInfo;
  const backendConfigFilePath = context.amplify.pathManager.getBackendConfigFilePath(projectPath);
  if (!fs.existsSync(backendConfigFilePath)) {
    fs.writeFileSync(backendConfigFilePath, '{}', 'utf8');
  }
}

function generateGitIgnoreFile(context) {
  if (context.exeInfo.isNewProject) {
    const { projectPath } = context.exeInfo.localEnvInfo;

    const gitIgnoreFilePath = context.amplify.pathManager.getGitIgnoreFilePath(projectPath);

    insertAmplifyIgnore(gitIgnoreFilePath);
  }
}
