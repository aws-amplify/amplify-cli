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
  const metaData = {
    service: resourceName,
    providerPlugin: constants.PROVIDER,
    type,
  };

  context.amplify.updateamplifyMetaAfterResourceAdd(
    category,
    resourceName,
    metaData,
  );
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
  fs.writeFileSync(teamProviderInfoFilePath, JSON.stringify(teamProviderInfo, null, 4));
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

module.exports = {
  initCFNTemplate,
  initMetaFile,
  initTeamProviderInfo,
  initBackendConfig,
};

