const constants = require('../constants/plugin-constants');
const pathManager = require('../utils/path-manager');
const fs = require('fs-extra');
const utils = require('../utils/amplify-context-utils');

function initCFNTemplate(context, templateFilePath) {
  const templateContent = context.amplify.readJsonFile(templateFilePath);
  const serviceDirPath = pathManager.getAmplifyHostingDirPath(context);

  fs.ensureDirSync(pathManager.getHostingDirPath(context));
  fs.ensureDirSync(serviceDirPath);

  const jsonString = JSON.stringify(templateContent, null, 4);
  fs.writeFileSync(pathManager.getTemplatePath(context), jsonString, 'utf8');
}

function initMetaFile(context, category, resourceName, type) {
  const timeStamp = type === constants.TYPE_CICD ? new Date() : undefined;
  const metaData = {
    service: resourceName,
    providerPlugin: constants.PROVIDER,
    type,
    lastPushTimeStamp: timeStamp,
  };

  context.amplify.updateamplifyMetaAfterResourceAdd(
    category,
    resourceName,
    metaData,
  );

  if (timeStamp) {
    // init #current-cloud-backend config file for CICD
    initCurrBackendMeta(context, category, resourceName, type, timeStamp);
  }
}

function initCurrBackendMeta(context, category, resourceName, type, timeStamp) {
  const metaData = {
    service: resourceName,
    providerPlugin: constants.PROVIDER,
    type,
    lastPushTimeStamp: timeStamp,
  };

  const currMetaFilePath = pathManager.getCurrentAmplifyMetaFilePath(context);
  const currMetaContent = context.amplify.readJsonFile(currMetaFilePath);
  if (!currMetaContent[category]) {
    currMetaContent[category] = {};
  }

  if (!currMetaContent[category][resourceName]) {
    currMetaContent[category][resourceName] = {};
  }

  currMetaContent[category][resourceName] = metaData;
  fs.writeFileSync(currMetaFilePath, JSON.stringify(currMetaContent, null, 4));

  const currHostingDir = pathManager.getCurrCloudBackendHostingDirPath(context);
  const currAmplifyHostingDir = pathManager.getCurrCloudBackendAmplifyHostingDirPath(context);
  fs.ensureDirSync(currHostingDir);
  fs.ensureDirSync(currAmplifyHostingDir);
}

function initTeamProviderInfo(context, category, resourceName, type) {
  const categories = constants.CATEGORIES;

  const { amplify } = context;
  const currEnv = amplify.getEnvInfo().envName;
  const teamProviderInfoFilePath = pathManager.getProviderInfoFilePath(context);
  const teamProviderInfo = amplify.readJsonFile(teamProviderInfoFilePath);
  if (!teamProviderInfo[currEnv][categories]) {
    teamProviderInfo[currEnv][categories] = {};
  }

  if (!teamProviderInfo[currEnv][categories][category]) {
    teamProviderInfo[currEnv][categories][category] = {};
  }

  if (!teamProviderInfo[currEnv][categories][category][resourceName]) {
    teamProviderInfo[currEnv][categories][category][resourceName] = {};
  }

  const appId = utils.getAppIdForCurrEnv(context);
  teamProviderInfo[currEnv][categories][category][resourceName] = {
    appId,
    type,
  };
  fs.writeFileSync(
    teamProviderInfoFilePath,
    JSON.stringify(teamProviderInfo, null, 4),
  );
}

function deleteConsoleConfigFromCurrMeta(context) {
  const category = constants.CATEGORY;
  const resourceName = constants.CONSOLE_RESOURCE_NAME;
  const currMetaFilePath = pathManager.getCurrentAmplifyMetaFilePath(context);
  const currMetaContent = context.amplify.readJsonFile(currMetaFilePath);
  if (!currMetaContent[category]) {
    return;
  }

  if (!currMetaContent[category][resourceName]) {
    return;
  }

  currMetaContent[category][resourceName] = undefined;
  fs.writeFileSync(currMetaFilePath, JSON.stringify(currMetaContent, null, 4));
}

function deleteConsoleConfigFromTeamProviderInfo(context) {
  const categories = constants.CATEGORIES;
  const category = constants.CATEGORY;
  const resourceName = constants.CONSOLE_RESOURCE_NAME;

  const { amplify } = context;
  const currEnv = amplify.getEnvInfo().envName;
  const teamProviderInfoFilePath = pathManager.getProviderInfoFilePath(context);
  const teamProviderInfo = amplify.readJsonFile(teamProviderInfoFilePath);
  if (!teamProviderInfo[currEnv][categories]) {
    return;
  }

  if (!teamProviderInfo[currEnv][categories][category]) {
    return;
  }

  if (!teamProviderInfo[currEnv][categories][category][resourceName]) {
    return;
  }
  teamProviderInfo[currEnv][categories][category][resourceName] = undefined;
  fs.writeFileSync(
    teamProviderInfoFilePath,
    JSON.stringify(teamProviderInfo, null, 4),
  );
}

function initBackendConfig(context, category, resourceName, type) {
  const backendConfigFilePath = pathManager.getBackendConfigPath(context);
  const backendConfig = context.amplify.readJsonFile(backendConfigFilePath);

  if (!backendConfig[category]) {
    backendConfig[category] = {};
  }

  if (!backendConfig[category][resourceName]) {
    backendConfig[category][resourceName] = {};
  }

  backendConfig[category][resourceName] = {
    type,
  };
}

function loadConsoleConfigFromTeamProviderinfo(context) {
  const categories = constants.CATEGORIES;
  const category = constants.CATEGORY;
  const resource = constants.CONSOLE_RESOURCE_NAME;
  const teamProviderInfo = utils.getTeamProviderInfo(context);
  const currEnv = utils.getCurrEnv(context);
  if (
    teamProviderInfo[currEnv][categories] &&
    teamProviderInfo[currEnv][categories][category] &&
    teamProviderInfo[currEnv][categories][category][resource]
  ) {
    return teamProviderInfo[currEnv][categories][category][resource];
  }
  return undefined;
}

module.exports = {
  initCFNTemplate,
  initMetaFile,
  initCurrBackendMeta,
  initTeamProviderInfo,
  initBackendConfig,
  loadConsoleConfigFromTeamProviderinfo,
  deleteConsoleConfigFromTeamProviderInfo,
  deleteConsoleConfigFromCurrMeta,
};
