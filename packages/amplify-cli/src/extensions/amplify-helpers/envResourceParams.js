const fs = require('fs');
const pathManager = require('./path-manager');
const { getEnvInfo } = require('./get-env-info');

const CATEGORIES = 'categories';

function loadAllResourceParameters() {
  const teamProviderInfoFilePath = pathManager.getProviderInfoFilePath();
  try {
    if (fs.existsSync(teamProviderInfoFilePath)) {
      return JSON.parse(fs.readFileSync(teamProviderInfoFilePath));
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
      delete obj[currentKey]
    }
  }
}

function saveAllResourceParams(data) {
  const teamProviderInfoFilePath = pathManager.getProviderInfoFilePath();
  fs.writeFileSync(teamProviderInfoFilePath, JSON.stringify(data, null, 4));
}

function saveEnvResourceParameters(category, resource, parameters) {
  const allParams = loadAllResourceParameters();
  const currentEnv = getEnvInfo().envName;
  const resources = getOrCreateSubObject(allParams, [currentEnv, CATEGORIES, category]);
  resources[resource] = parameters;

  saveAllResourceParams(allParams);
}

function loadEnvResourceParameters(category, resource) {
  const allParams = loadAllResourceParameters();
  try {
    const currentEnv = getEnvInfo().envName;
    return getOrCreateSubObject(allParams, [currentEnv, CATEGORIES, category, resource]);
  } catch (e) {
    return {};
  }
}

function removeResourceParameters(category, resource) {
  const allParams = loadAllResourceParameters();
  const currentEnv = getEnvInfo().envName;
  removeObjectRecursively(allParams, [currentEnv, CATEGORIES, category, resource]);
  saveAllResourceParams(allParams);
}

module.exports = {
  loadEnvResourceParameters,
  saveEnvResourceParameters,
  removeResourceParameters,
};
