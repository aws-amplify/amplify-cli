import _ from 'lodash';
import {
  $TSContext, $TSObject, stateManager, mergeDeploymentSecrets, removeFromDeploymentSecrets, $TSAny,
} from 'amplify-cli-core';
import { getEnvInfo } from './get-env-info';
import { getRootStackId } from './get-root-stack-id';

const CATEGORIES = 'categories';
const hostedUIProviderCredsField = 'hostedUIProviderCreds';

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
  const { hostedUIProviderCreds, ...otherParameters } = parameters;
  resources[resource] = _.assign(resources[resource], otherParameters);

  if (!isMigrationContext(context)) {
    stateManager.setTeamProviderInfo(undefined, teamProviderInfo);
    // write hostedUIProviderCreds to deploymentSecrets
    const deploymentSecrets = stateManager.getDeploymentSecrets();
    const rootStackId = getRootStackId();
    if (hostedUIProviderCreds) {
      stateManager.setDeploymentSecrets(
        mergeDeploymentSecrets({
          currentDeploymentSecrets: deploymentSecrets,
          rootStackId,
          category,
          envName: currentEnv,
          keyName: hostedUIProviderCredsField,
          value: hostedUIProviderCreds,
          resource,
        }),
      );
    } else {
      stateManager.setDeploymentSecrets(
        removeFromDeploymentSecrets({
          currentDeploymentSecrets: deploymentSecrets,
          rootStackId,
          category,
          resource,
          envName: currentEnv,
          keyName: hostedUIProviderCredsField,
        }),
      );
    }
  }
};

/**
 * Load resource params from TPI and deployment secrets
 */
export const loadEnvResourceParameters = (context: $TSContext, category: string, resource: string): $TSAny => {
  const envParameters = {
    ...loadEnvResourceParametersFromDeploymentSecrets(context, category, resource),
    ...loadEnvResourceParametersFromTeamProviderInfo(context, category, resource),
  };
  return envParameters;
};

const loadEnvResourceParametersFromDeploymentSecrets = (
  context: $TSContext, category: string, resource: string,
): Record<string, string> => {
  try {
    const currentEnv = getCurrentEnvName(context);
    const deploymentSecrets = stateManager.getDeploymentSecrets();
    const rootStackId = getRootStackId();
    const deploymentSecretByAppId = _.find(deploymentSecrets.appSecrets, appSecret => appSecret.rootStackId === rootStackId);
    if (deploymentSecretByAppId) {
      return _.get(deploymentSecretByAppId.environments, [currentEnv, category, resource]);
    }
    const parameters = stateManager.getResourceParametersJson(undefined, category, resource);
    // set empty default if no hostedUIProviderCreds found
    if (parameters && parameters.hostedUI) {
      return _.set({}, hostedUIProviderCredsField, '[]');
    }
  } catch (e) {
    // swallow error
  }
  return {};
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
    removeDeploymentSecrets(context, category, resource);
  }
};

/**
 * removes deployment secrets
 * called after remove and push
 */
export const removeDeploymentSecrets = (context: $TSContext, category: string, resource: string): void => {
  const currentEnv = getCurrentEnvName(context);
  const deploymentSecrets = stateManager.getDeploymentSecrets();
  const rootStackId = getRootStackId();

  if (!isMigrationContext(context)) {
    stateManager.setDeploymentSecrets(
      removeFromDeploymentSecrets({
        currentDeploymentSecrets: deploymentSecrets,
        rootStackId,
        envName: currentEnv,
        category,
        resource,
        keyName: hostedUIProviderCredsField,
      }),
    );
  }
};
