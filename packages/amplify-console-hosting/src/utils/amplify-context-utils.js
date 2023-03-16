// disabling eslint until this file is migrated to TS
/* eslint-disable */
const constants = require('../constants/plugin-constants');
const pathManager = require('../utils/path-manager');
const fs = require('fs-extra');
const { stateManager } = require('@aws-amplify/amplify-cli-core');

function getAppIdForCurrEnv() {
  return stateManager.getMeta()?.providers?.awscloudformation?.[constants.APPID_KEY];
}

function getCurrEnv(context) {
  const { amplify } = context;
  return amplify.getEnvInfo().envName;
}

function getMetaInfo(context) {
  const { amplify } = context;
  const metaInfoPath = pathManager.getAmplifyMetaFilePath(context);
  return amplify.readJsonFile(metaInfoPath);
}

function getBackendInfoConfig(context) {
  const { amplify } = context;
  const backendConfigFilePath = pathManager.getBackendConfigPath(context);
  const backendConfig = fs.existsSync(backendConfigFilePath) ? amplify.readJsonFile(backendConfigFilePath) : undefined;
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
  getCurrEnv,
  getProjectConfig,
  getLocalEnvInfo,
  getRegionForCurrEnv,
  getMetaInfo,
};
/* eslint-enable */
