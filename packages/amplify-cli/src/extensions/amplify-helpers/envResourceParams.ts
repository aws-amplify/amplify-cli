import * as fs from 'fs-extra';
import _ from 'lodash';
import { getEnvInfo } from './get-env-info';
import { readJsonFile } from './read-json-file';
import { getProviderInfoFilePath } from './path-manager';

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
    const teamProviderInfoFilePath = getProviderInfoFilePath();
    if (fs.existsSync(teamProviderInfoFilePath)) {
      return readJsonFile(teamProviderInfoFilePath);
    }
  } catch (e) {
    return {};
  }
}

function getOrCreateSubObject(data, keys) {
  let currentObj = data;
  keys.forEach(key => {
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

  const teamProviderInfoFilePath = getProviderInfoFilePath();
  fs.writeFileSync(teamProviderInfoFilePath, JSON.stringify(data, null, 4));
}

export function saveEnvResourceParameters(context, category, resource, parameters) {
  const allParams = loadAllResourceParameters(context);
  const currentEnv = getCurrentEnvName(context);
  const resources = getOrCreateSubObject(allParams, [currentEnv, CATEGORIES, category]);
  resources[resource] = _.assign(resources[resource], parameters);
  saveAllResourceParams(context, allParams);
}

export function loadEnvResourceParameters(context, category, resource) {
  const allParams = loadAllResourceParameters(context);
  try {
    const currentEnv = getCurrentEnvName(context);
    return getOrCreateSubObject(allParams, [currentEnv, CATEGORIES, category, resource]);
  } catch (e) {
    return {};
  }
}

export function removeResourceParameters(context, category, resource) {
  const allParams = loadAllResourceParameters(context);
  const currentEnv = getCurrentEnvName(context);
  removeObjectRecursively(allParams, [currentEnv, CATEGORIES, category, resource]);
  saveAllResourceParams(context, allParams);
}
