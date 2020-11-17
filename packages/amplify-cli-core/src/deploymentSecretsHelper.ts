import { DeploymentSecrets } from '.';
import _ from 'lodash';

export const mergeDeploymentSecrets = (deploymentSecretsModifier: deploymentSecretMerge): DeploymentSecrets => {
  const { currentDeploymentSecrets, category, amplifyAppId, envName, resource, keyName, value } = deploymentSecretsModifier;
  const newDeploymentAppSecret = _.find(currentDeploymentSecrets.appSecrets, appSecret => appSecret.amplifyAppId === amplifyAppId) || {
    amplifyAppId,
    environments: {},
  };
  _.set(newDeploymentAppSecret, ['environments', envName, category, resource, keyName], value);
  return {
    appSecrets: [
      ...currentDeploymentSecrets.appSecrets.filter(appSecret => appSecret.amplifyAppId !== amplifyAppId),
      newDeploymentAppSecret,
    ],
  };
};

export const removeFromDeploymentSecrets = (deploymentSecretsModifier: deploymentSecretsRemove): DeploymentSecrets => {
  const { currentDeploymentSecrets, category, amplifyAppId, envName, resource, keyName } = deploymentSecretsModifier;
  const secretsByAppId = _.find(currentDeploymentSecrets.appSecrets, secrets => secrets.amplifyAppId === amplifyAppId);
  if (secretsByAppId) {
    recursiveOmit(secretsByAppId.environments, [envName, category, resource, keyName]);
    if (Object.keys(secretsByAppId.environments).length === 0) {
      currentDeploymentSecrets.appSecrets = currentDeploymentSecrets.appSecrets.filter(r => r.amplifyAppId !== amplifyAppId);
    }
  }
  return currentDeploymentSecrets;
};
const recursiveOmit = (obj: any, path: Array<string>): void => {
  if (path.length === 0) return;
  const currentKey = path[0];
  if (path.length === 1 && !!obj[currentKey]) {
    delete obj[currentKey];
    return;
  }
  recursiveOmit(obj[currentKey], path.slice(1));

  if (obj[currentKey] && _.isEmpty(obj[currentKey])) {
    delete obj[currentKey];
  }
};

type deploymentSecretMerge = deploymentSecretsRemove & { value: string };

type deploymentSecretsRemove = {
  currentDeploymentSecrets: DeploymentSecrets;
  category: string;
  amplifyAppId: string;
  envName: string;
  resource: string;
  keyName: string;
};
