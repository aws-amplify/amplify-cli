import _ from 'lodash';
import { getEnvInfo } from './get-env-info';
import { $TSContext, $TSObject, stateManager, mergeDeploymentSecrets, removeFromDeploymentSecrets } from 'amplify-cli-core';
import { getRootStackId } from './get-root-stack-id';

const CATEGORIES = 'categories';
const hostedUIProviderCredsField = 'hostedUIProviderCreds';

function isMigrationContext(context: $TSContext) {
  return 'migrationInfo' in context;
}

function getCurrentEnvName(context: $TSContext) {
  if (isMigrationContext(context)) {
    return context.migrationInfo.localEnvInfo.envName;
  }
  return getEnvInfo().envName;
}

function getApplicableTeamProviderInfo(context: $TSContext) {
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

export function saveEnvResourceParameters(context: $TSContext, category: string, resource: string, parameters?: $TSObject) {
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
}

export function loadEnvResourceParameters(context: $TSContext, category: string, resource: string) {
  const envParameters = {
    ...loadEnvResourceParametersFromDeploymentSecrets(context, category, resource),
    ...loadEnvResourceParametersFromTeamproviderInfo(context, category, resource),
  };
  return envParameters;
}

function loadEnvResourceParametersFromDeploymentSecrets(context: $TSContext, category: string, resource: string) {
  try {
    const currentEnv = getCurrentEnvName(context);
    const deploymentSecrets = stateManager.getDeploymentSecrets();
    const rootStackId = getRootStackId();
    const deploymentSecretByAppId = _.find(deploymentSecrets.appSecrets, appSecret => appSecret.rootStackId === rootStackId);
    if (deploymentSecretByAppId) {
      return _.get(deploymentSecretByAppId.environments, [currentEnv, category, resource]);
    } else {
      const parameters = stateManager.getResourceParametersJson(undefined, category, resource);
      //set empty default if no hostedUIProviderCreds found
      if (parameters && parameters.hostedUI) {
        return _.set({}, hostedUIProviderCredsField, '[]');
      }
    }
  } catch (e) {}
  return {};
}

function loadEnvResourceParametersFromTeamproviderInfo(context: $TSContext, category: string, resource: string) {
  try {
    const teamProviderInfo = getApplicableTeamProviderInfo(context);
    const currentEnv = getCurrentEnvName(context);
    return getOrCreateSubObject(teamProviderInfo, [currentEnv, CATEGORIES, category, resource]);
  } catch (e) {
    return {};
  }
}

export function removeResourceParameters(context: $TSContext, category: string, resource: string) {
  const teamProviderInfo = getApplicableTeamProviderInfo(context);
  const currentEnv = getCurrentEnvName(context);
  removeObjectRecursively(teamProviderInfo, [currentEnv, CATEGORIES, category, resource]);

  if (!isMigrationContext(context)) {
    stateManager.setTeamProviderInfo(undefined, teamProviderInfo);
    removeDeploymentSecrets(context, category, resource);
  }
}
// removes deployment secrets
// called after remove and push
export function removeDeploymentSecrets(context: $TSContext, category: string, resource: string) {
  const currentEnv = getCurrentEnvName(context);
  const deploymentSecrets = stateManager.getDeploymentSecrets();
  const rootStackId = getRootStackId();

  if (!isMigrationContext(context)) {
    stateManager.setDeploymentSecrets(
      removeFromDeploymentSecrets({
        currentDeploymentSecrets: deploymentSecrets,
        rootStackId,
        envName: currentEnv,
        category: category,
        resource: resource,
        keyName: hostedUIProviderCredsField,
      }),
    );
  }
}
