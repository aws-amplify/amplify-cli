const fs = require('fs-extra');
const pathManager = require('./path-manager');
const { readJsonFile } = require('./read-json-file');
const _ = require('lodash');

function updateBackendConfigAfterResourceAdd(category, resourceName, options) {
  const backendConfigFilePath = pathManager.getBackendConfigFilePath();
  const backendConfig = getExistingBackendConfig(backendConfigFilePath);

  if (!backendConfig[category]) {
    backendConfig[category] = {};
  }
  if (!backendConfig[category][resourceName]) {
    backendConfig[category][resourceName] = {};
    backendConfig[category][resourceName] = options;
    const jsonString = JSON.stringify(backendConfig, null, '\t');
    fs.writeFileSync(backendConfigFilePath, jsonString, 'utf8');
  }
}

function updateBackendConfigAfterResourceUpdate(category, resourceName, attribute, value) {
  const backendConfigFilePath = pathManager.getBackendConfigFilePath();
  const backendConfig = getExistingBackendConfig(backendConfigFilePath);
  _.set(backendConfig, [category, resourceName, attribute], value);
  fs.writeFileSync(backendConfigFilePath, JSON.stringify(backendConfig, undefined, 4), 'utf8');
}

function updateBackendConfigAfterResourceRemove(category, resourceName) {
  const backendConfigFilePath = pathManager.getBackendConfigFilePath();
  const backendConfig = getExistingBackendConfig(backendConfigFilePath);

  if (backendConfig[category] && backendConfig[category][resourceName] !== undefined) {
    delete backendConfig[category][resourceName];
  }

  const jsonString = JSON.stringify(backendConfig, null, '\t');
  fs.writeFileSync(backendConfigFilePath, jsonString, 'utf8');
}

function getExistingBackendConfig(backendConfigFilePath) {
  let backendConfig = {};
  if (fs.existsSync(backendConfigFilePath)) {
    backendConfig = readJsonFile(backendConfigFilePath);
  }
  return backendConfig;
}

module.exports = {
  updateBackendConfigAfterResourceAdd,
  updateBackendConfigAfterResourceUpdate,
  updateBackendConfigAfterResourceRemove,
  updateBackendConfigAfterResourceUpdate,
};
