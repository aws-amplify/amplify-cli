const fs = require('fs');
const pathManager = require('./path-manager');
const { getEnvInfo } = require('./get-env-info');
const { readJsonFile } = require('./read-json-file');

const CATEGORIES = 'categories';

function isMigrationContext(context) {
  return 'migrationInfo' in context;
}

function getCurrentEnvName(context) {
  if (isMigrationContext(context)) {
    return context.migrationInfo.localEnvInfo.envName;
  }
  return getEnvInfo().envName;
}

function loadAllResourceParameters(context) {
  try {
    if (isMigrationContext(context)) {
      return context.migrationInfo.teamProviderInfo;
    }
    const teamProviderInfoFilePath = pathManager.getProviderInfoFilePath();
    if (fs.existsSync(teamProviderInfoFilePath)) {
      return readJsonFile(teamProviderInfoFilePath);
    }
  } catch (e) {
    return {};
  }
}

function getOrCreateSubObject(data, keys) {
  let currentObj = data;
  keys.forEach((key) => {
    if (!(key in currentObj)) {
      currentObj[key] = {};
    }
    currentObj = currentObj[key];
  });
  return currentObj;
}

function removeObjectRecursively(obj, keys) {
  if (keys.length > 1) {
    const [currentKey, ...rest] = keys;
    if (currentKey in obj) {
      removeObjectRecursively(obj[currentKey], rest);
      if (!Object.keys(obj[currentKey]).length) {
        delete obj[currentKey];
      }
    }
  } else {
    const [currentKey] = keys;
    if (currentKey in obj) {
      delete obj[currentKey];
    }
  }
}

function saveAllResourceParams(context, data) {
  if (isMigrationContext(context)) return; // no need to serialize team provider

  const teamProviderInfoFilePath = pathManager.getProviderInfoFilePath();
  fs.writeFileSync(teamProviderInfoFilePath, JSON.stringify(data, null, 4));
}

function saveEnvResourceParameters(context, category, resource, parameters) {
  const allParams = loadAllResourceParameters(context);
  const currentEnv = getCurrentEnvName(context);
  const resources = getOrCreateSubObject(allParams, [currentEnv, CATEGORIES, category]);
  resources[resource] = parameters;
  saveAllResourceParams(context, allParams);
}

function loadEnvResourceParameters(context, category, resource) {
  const allParams = loadAllResourceParameters(context);
  try {
    const currentEnv = getCurrentEnvName(context);
    return getOrCreateSubObject(allParams, [currentEnv, CATEGORIES, category, resource]);
  } catch (e) {
    return {};
  }
}

function removeResourceParameters(context, category, resource) {
  const allParams = loadAllResourceParameters(context);
  const currentEnv = getCurrentEnvName(context);
  removeObjectRecursively(allParams, [currentEnv, CATEGORIES, category, resource]);
  saveAllResourceParams(context, allParams);
}

module.exports = {
  loadEnvResourceParameters,
  saveEnvResourceParameters,
  removeResourceParameters,
};
