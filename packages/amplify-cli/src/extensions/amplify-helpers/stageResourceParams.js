const fs = require('fs');
const pathManager = require('./path-manager');
const { getEnvInfo } = require('./get-env-info');

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

function saveAllResourceParams(data) {
  const teamProviderInfoFilePath = pathManager.getProviderInfoFilePath();
  fs.writeFileSync(teamProviderInfoFilePath, JSON.stringify(data, null, 4));
}

function saveEnvResourceParameters(category, resource, parameters) {
  const allParams = loadAllResourceParameters();
  const currentEnv = getEnvInfo().envName;
  const resources = getOrCreateSubObject(allParams, [currentEnv, category]);
  resources[resource] = parameters;

  saveAllResourceParams(allParams);
}

function loadEnvResourceParameters(category, resource) {
  const allParams = loadAllResourceParameters();
  try {
    const currentEnv = getEnvInfo().envName;
    return getOrCreateSubObject(allParams, [currentEnv, category, resource]);
  } catch (e) {
    return {};
  }
}

function removeResourceParameters(category, resource) {
  const allParams = loadAllResourceParameters();
  const envs = Object.keys(allParams);
  envs.forEach((env) => {
    const envObj = allParams[env];
    if (category in envObj) {
      if (resource in envObj[category]) {
        delete envObj[category][resource];
        if (!Object.keys(envObj[category]).length) delete envObj[category];
      }
    }
  });
  saveAllResourceParams(allParams);
}

module.exports = {
  loadEnvResourceParameters,
  saveEnvResourceParameters,
  removeResourceParameters,
};
