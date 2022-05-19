import {
  $TSAny, $TSContext, $TSObject, stateManager,
} from 'amplify-cli-core';
import _ from 'lodash';
import { getEnvInfo } from './get-env-info';

const CATEGORIES = 'categories';

const isMigrationContext = (context: $TSContext): boolean => 'migrationInfo' in context;

const getCurrentEnvName = (context: $TSContext): string => {
  if (isMigrationContext(context)) {
    return context.migrationInfo.localEnvInfo.envName;
  }
  return getEnvInfo().envName;
};

const getApplicableTeamProviderInfo = (context: $TSContext): $TSAny => {
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
};

const getOrCreateSubObject = (data: $TSAny, keys: $TSAny): $TSAny => {
  let currentObj = data;
  keys.forEach(key => {
    if (!(key in currentObj)) {
      currentObj[key] = {};
    }
    currentObj = currentObj[key];
  });
  return currentObj;
};

const removeObjectRecursively = (obj: $TSAny, keys: $TSAny): $TSAny => {
  if (keys.length > 1) {
    const [currentKey, ...rest] = keys;
    if (currentKey in obj) {
      removeObjectRecursively(obj[currentKey], rest);
      if (!Object.keys(obj[currentKey]).length) {
        // eslint-disable-next-line no-param-reassign
        delete obj[currentKey];
      }
    }
  } else {
    const [currentKey] = keys;
    if (currentKey in obj) {
      // eslint-disable-next-line no-param-reassign
      delete obj[currentKey];
    }
  }
};

/**
 * Save environment-specific resource params
 */
export const saveEnvResourceParameters = (context: $TSContext, category: string, resource: string, parameters?: $TSObject): void => {
  if (!parameters) {
    return;
  }

  const teamProviderInfo = getApplicableTeamProviderInfo(context);
  const currentEnv = getCurrentEnvName(context);
  const resources = getOrCreateSubObject(teamProviderInfo, [currentEnv, CATEGORIES, category]);
  const { otherParameters } = parameters;
  resources[resource] = _.assign(resources[resource], otherParameters);

  if (!isMigrationContext(context)) {
    stateManager.setTeamProviderInfo(undefined, teamProviderInfo);
  }
};

/**
 * load env specific parameter for a resource
 */
export const loadEnvResourceParameters = (context: $TSContext, category: string, resource: string): $TSObject => {
  const envParameters = {
    ...loadEnvResourceParametersFromTeamProviderInfo(context, category, resource),
  };
  return envParameters;
};

const loadEnvResourceParametersFromTeamProviderInfo = (context: $TSContext, category: string, resource: string): Record<string, string> => {
  try {
    const teamProviderInfo = getApplicableTeamProviderInfo(context);
    const currentEnv = getCurrentEnvName(context);
    return getOrCreateSubObject(teamProviderInfo, [currentEnv, CATEGORIES, category, resource]);
  } catch (e) {
    return {};
  }
};

/**
 * Remove env specific resource param from TPI and/or deployment secrets
 */
export const removeResourceParameters = (context: $TSContext, category: string, resource: string): void => {
  const teamProviderInfo = getApplicableTeamProviderInfo(context);
  const currentEnv = getCurrentEnvName(context);
  removeObjectRecursively(teamProviderInfo, [currentEnv, CATEGORIES, category, resource]);

  if (!isMigrationContext(context)) {
    stateManager.setTeamProviderInfo(undefined, teamProviderInfo);
  }
};
