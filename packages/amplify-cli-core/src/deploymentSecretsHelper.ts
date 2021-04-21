import { DeploymentSecrets } from '.';
import _ from 'lodash';
import { recursiveOmit } from './utils/recursiveOmit';

export const mergeDeploymentSecrets = (deploymentSecretsModifier: deploymentSecretMerge): DeploymentSecrets => {
  const { currentDeploymentSecrets, category, rootStackId, envName, resource, keyName, value } = deploymentSecretsModifier;
  const newDeploymentAppSecret = _.find(currentDeploymentSecrets.appSecrets, appSecret => appSecret.rootStackId === rootStackId) || {
    rootStackId,
    environments: {},
  };
  _.set(newDeploymentAppSecret, ['environments', envName, category, resource, keyName], value);
  return {
    appSecrets: [...currentDeploymentSecrets.appSecrets.filter(appSecret => appSecret.rootStackId !== rootStackId), newDeploymentAppSecret],
  };
};

export const removeFromDeploymentSecrets = (deploymentSecretsModifier: deploymentSecretsRemove): DeploymentSecrets => {
  const { currentDeploymentSecrets, category, rootStackId, envName, resource, keyName } = deploymentSecretsModifier;
  const secretsByAppId = _.find(currentDeploymentSecrets.appSecrets, secrets => secrets.rootStackId === rootStackId);
  if (secretsByAppId) {
    recursiveOmit(secretsByAppId.environments, [envName, category, resource, keyName]);
    if (Object.keys(secretsByAppId.environments).length === 0) {
      currentDeploymentSecrets.appSecrets = currentDeploymentSecrets.appSecrets.filter(r => r.rootStackId !== rootStackId);
    }
  }
  return currentDeploymentSecrets;
};

type deploymentSecretMerge = deploymentSecretsRemove & { value: string };

type deploymentSecretsRemove = {
  currentDeploymentSecrets: DeploymentSecrets;
  category: string;
  rootStackId: string;
  envName: string;
  resource: string;
  keyName: string;
};
