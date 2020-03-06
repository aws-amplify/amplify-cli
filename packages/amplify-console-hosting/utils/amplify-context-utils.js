const constants = require('../constants/plugin-constants');
const pathManager = require('../utils/path-manager');
const fs = require('fs-extra');

function getAppIdForCurrEnv(context) {
  const currEnv = getCurrEnv(context);
  const teamProviderInfo = getTeamProviderInfo(context);
  return teamProviderInfo[currEnv][constants.PROVIDER][constants.APPID_KEY];
}

function getCurrEnv(context) {
  const { amplify } = context;
  return amplify.getEnvInfo().envName;
}

function getTeamProviderInfo(context) {
  const { amplify } = context;
  const teamProviderInfoFilePath = pathManager.getProviderInfoFilePath(context);
  const teamProviderInfo = amplify.readJsonFile(teamProviderInfoFilePath);
  return teamProviderInfo;
}

function getMetaInfo(context) {
  const { amplify } = context;
  const metaInfoPath = pathManager.getAmplifyMetaFilePath(context);
  return amplify.readJsonFile(metaInfoPath);
}

function getBackendInfoConfig(context) {
  const { amplify } = context;
  const backendConfigFilePath = pathManager.getBackendConfigPath(context);
  const backendConfig = fs.existsSync(backendConfigFilePath)
    ? amplify.readJsonFile(backendConfigFilePath) : undefined;
  return backendConfig;
}

function getProjectConfig(context) {
  return context.amplify.getProjectConfig();
}

function getLocalEnvInfo(context) {
  return context.amplify.getEnvInfo();
}

function getRegionForCurrEnv(context) {
  return context.amplify.getProjectMeta().providers.awscloudformation.Region;
}

module.exports = {
  getAppIdForCurrEnv,
  getBackendInfoConfig,
  getTeamProviderInfo,
  getCurrEnv,
  getProjectConfig,
  getLocalEnvInfo,
  getRegionForCurrEnv,
  getMetaInfo,
};

