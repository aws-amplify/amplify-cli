import { getEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import { $TSContext, $TSObject, stateManager, removeFromDeploymentSecrets, mergeDeploymentSecrets, $TSAny } from 'amplify-cli-core';

import _ from 'lodash';
import { getRootStackId } from './get-root-stack-id';

const hostedUIProviderCredsField = 'hostedUIProviderCreds';

/**
 * Save environment-specific resource params
 */
export const saveEnvResourceParameters = (__: $TSContext | undefined, category: string, resource: string, parameters?: $TSObject): void => {
  if (!parameters) {
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hostedUIProviderCreds, ...nonSecretParams } = parameters;

  getEnvParamManager().getResourceParamManager(category, resource).setParams(nonSecretParams);
  const deploymentSecrets = stateManager.getDeploymentSecrets();
  const rootStackId = getRootStackId();
  const currentEnv = stateManager.getLocalEnvInfo().envName;

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
};

/**
 * Load resource params from environment parameter manager and deployment secrets
 *
 * @deprecated use @aws-amplify/amplify-environment-parameters
 */
export const loadEnvResourceParameters = (__: $TSContext | undefined, category: string, resource: string): $TSAny => {
  const envParameters = {
    ...loadEnvResourceParametersFromDeploymentSecrets(category, resource),
    ...getEnvParamManager().getResourceParamManager(category, resource).getAllParams(),
  };
  return envParameters;
};

const loadEnvResourceParametersFromDeploymentSecrets = (category: string, resource: string): Record<string, string> => {
  try {
    const currentEnv = stateManager.getLocalEnvInfo().envName;
    const deploymentSecrets = stateManager.getDeploymentSecrets();
    const rootStackId = getRootStackId();
    const deploymentSecretByAppId = _.find(deploymentSecrets.appSecrets, (appSecret) => appSecret.rootStackId === rootStackId);
    if (deploymentSecretByAppId) {
      return _.get(deploymentSecretByAppId.environments, [currentEnv, category, resource]);
    }
    const parameters = stateManager.getResourceParametersJson(undefined, category, resource);
    // set empty default if no hostedUIProviderCreds found
    if (parameters && parameters.hostedUI) {
      return _.setWith({}, hostedUIProviderCredsField, '[]');
    }
  } catch (e) {
    // swallow error
  }
  return {};
};

/**
 * Remove env specific resource param from TPI and/or deployment secrets
 */
export const removeResourceParameters = (context: $TSContext, category: string, resource: string): void => {
  getEnvParamManager().removeResourceParamManager(category, resource);
  removeDeploymentSecrets(context, category, resource);
};

/**
 * removes deployment secrets
 * called after remove and push
 */
export const removeDeploymentSecrets = (__: $TSContext | undefined, category: string, resource: string): void => {
  const currentEnv = stateManager.getLocalEnvInfo().envName;
  const deploymentSecrets = stateManager.getDeploymentSecrets();
  const rootStackId = getRootStackId();

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
};
