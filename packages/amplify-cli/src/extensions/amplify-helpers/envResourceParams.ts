import _ from 'lodash';
import { getEnvInfo } from './get-env-info';
import { $TSContext, $TSObject, stateManager } from 'amplify-cli-core';

const CATEGORIES = 'categories';

function isMigrationContext(context: $TSContext) {
  return 'migrationInfo' in context;
}

function getCurrentEnvName(context: $TSContext) {
  if (isMigrationContext(context)) {
    return context.migrationInfo.localEnvInfo.envName;
  }
  return getEnvInfo().envName;
}

function loadAllResourceParameters(context: $TSContext) {
  try {
    if (isMigrationContext(context)) {
      return context.migrationInfo.teamProviderInfo;
    }

    return stateManager.getTeamProviderInfo(undefined, {
      throwIfNotExist: false,
      default: {},
    });
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

function saveAllResourceParams(context: $TSContext, data: $TSObject) {
  if (isMigrationContext(context)) return; // no need to serialize team provider

  stateManager.setTeamProviderInfo(undefined, data);
}

export function saveEnvResourceParameters(context: $TSContext, category: string, resource: string, parameters: $TSObject) {
  const allParams = loadAllResourceParameters(context);
  const currentEnv = getCurrentEnvName(context);
  const resources = getOrCreateSubObject(allParams, [currentEnv, CATEGORIES, category]);
  resources[resource] = _.assign(resources[resource], parameters);
  saveAllResourceParams(context, allParams);
}

export function loadEnvResourceParameters(context: $TSContext, category: string, resource: string) {
  const allParams = loadAllResourceParameters(context);
  try {
    const currentEnv = getCurrentEnvName(context);
    return getOrCreateSubObject(allParams, [currentEnv, CATEGORIES, category, resource]);
  } catch (e) {
    return {};
  }
}

export function removeResourceParameters(context: $TSContext, category: string, resource: string) {
  const allParams = loadAllResourceParameters(context);
  const currentEnv = getCurrentEnvName(context);
  removeObjectRecursively(allParams, [currentEnv, CATEGORIES, category, resource]);
  saveAllResourceParams(context, allParams);
}
