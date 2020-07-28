import * as fs from 'fs-extra';
import _ from 'lodash';
import { getBackendConfigFilePath } from './path-manager';
import { readJsonFile } from './read-json-file';

export function updateBackendConfigAfterResourceAdd(category, resourceName, options) {
  const backendConfigFilePath = getBackendConfigFilePath();
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

export function updateBackendConfigAfterResourceUpdate(category, resourceName, attribute, value) {
  const backendConfigFilePath = getBackendConfigFilePath();
  const backendConfig = getExistingBackendConfig(backendConfigFilePath);
  _.set(backendConfig, [category, resourceName, attribute], value);
  fs.writeFileSync(backendConfigFilePath, JSON.stringify(backendConfig, undefined, 4), 'utf8');
}

export function updateBackendConfigAfterResourceRemove(category, resourceName) {
  const backendConfigFilePath = getBackendConfigFilePath();
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
