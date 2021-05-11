import { stateManager, mergeDeploymentSecrets } from 'amplify-cli-core';
import { getDeploymentSecretsKey } from '../extensions/amplify-helpers/get-deployment-secrets-key';
const hostedUIProviderCredsField = 'hostedUIProviderCreds';

export const moveSecretsFromTeamProviderToDeployment = (projectPath?: string): void => {
  const { envName } = stateManager.getLocalEnvInfo(projectPath);
  let teamProviderInfo = stateManager.getTeamProviderInfo();
  const envTeamProvider = teamProviderInfo[envName];
  let secrets = stateManager.getDeploymentSecrets();
  Object.keys(envTeamProvider.categories)
    .filter(category => category === 'auth')
    .forEach(() => {
      Object.keys(envTeamProvider.categories.auth).forEach(resourceName => {
        if (envTeamProvider.categories.auth[resourceName][hostedUIProviderCredsField]) {
          const teamProviderSecrets = envTeamProvider.categories.auth[resourceName][hostedUIProviderCredsField];

          delete envTeamProvider.categories.auth[resourceName][hostedUIProviderCredsField];
          const deploymentSecretsKey = getDeploymentSecretsKey();
          secrets = mergeDeploymentSecrets({
            currentDeploymentSecrets: secrets,
            category: 'auth',
            rootStackId: deploymentSecretsKey,
            envName,
            resource: resourceName,
            keyName: hostedUIProviderCredsField,
            value: teamProviderSecrets,
          });
        }
      });
    });
  stateManager.setTeamProviderInfo(undefined, teamProviderInfo);
  stateManager.setDeploymentSecrets(secrets);
};
