import * as fs from 'fs-extra';
import sequential from 'promise-sequential';
import { pathManager, stateManager, $TSContext } from 'amplify-cli-core';
import { getFrontendPlugins } from '../extensions/amplify-helpers/get-frontend-plugins';
import { getProviderPlugins } from '../extensions/amplify-helpers/get-provider-plugins';
import { insertAmplifyIgnore } from '../extensions/amplify-helpers/git-manager';

export async function generateFiles(context: $TSContext) {
  const { projectPath } = context.exeInfo.localEnvInfo;

  const amplifyDirPath = pathManager.getAmplifyDirPath(projectPath);
  const dotConfigDirPath = pathManager.getDotConfigDirPath(projectPath);
  const backendDirPath = pathManager.getBackendDirPath(projectPath);
  const currentBackendDirPath = pathManager.getCurrentCloudBackendDirPath(projectPath);

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

  const currentAmplifyMeta = stateManager.getCurrentMeta(undefined, {
    throwIfNotExist: false,
    default: {},
  });

  await context.amplify.onCategoryOutputsChange(context, currentAmplifyMeta);

  return context;
}

function generateLocalRuntimeFiles(context: $TSContext) {
  generateLocalEnvInfoFile(context);
}

function generateLocalEnvInfoFile(context: $TSContext) {
  const { projectPath } = context.exeInfo.localEnvInfo;

  stateManager.setLocalEnvInfo(projectPath, context.exeInfo.localEnvInfo);
}

function generateNonRuntimeFiles(context: $TSContext) {
  generateProjectConfigFile(context);
  generateBackendConfigFile(context);
  generateTeamProviderInfoFile(context);
  generateGitIgnoreFile(context);
}

function generateProjectConfigFile(context: $TSContext) {
  if (context.exeInfo.isNewProject || context.exeInfo.existingLocalEnvInfo?.noUpdateBackend) {
    const { projectPath } = context.exeInfo.localEnvInfo;

    stateManager.setProjectConfig(projectPath, context.exeInfo.projectConfig);
  }
}

function generateTeamProviderInfoFile(context: $TSContext) {
  const { projectPath, envName } = context.exeInfo.localEnvInfo;
  const { existingTeamProviderInfo, teamProviderInfo } = context.exeInfo;

  if (context.exeInfo.existingLocalEnvInfo?.noUpdateBackend) {
    return stateManager.setTeamProviderInfo(projectPath, existingTeamProviderInfo);
  }

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

  stateManager.setTeamProviderInfo(projectPath, teamProviderInfo);
}

function generateBackendConfigFile(context: $TSContext) {
  const { projectPath } = context.exeInfo.localEnvInfo;

  if (!stateManager.backendConfigFileExists(projectPath)) {
    stateManager.setBackendConfig(projectPath, {});
  }
}

function generateGitIgnoreFile(context: $TSContext) {
  if (context.exeInfo.isNewProject) {
    const { projectPath } = context.exeInfo.localEnvInfo;

    const gitIgnoreFilePath = pathManager.getGitIgnoreFilePath(projectPath);

    insertAmplifyIgnore(gitIgnoreFilePath);
  }
}
