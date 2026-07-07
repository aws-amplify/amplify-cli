import { externalAuthEnable } from '@aws-amplify/amplify-category-auth';
import { ensureEnvParamManager, getEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import { mergeDeploymentSecrets, PathConstants, pathManager, stateManager } from '@aws-amplify/amplify-cli-core';
import chalk from 'chalk';
import { Context } from '../domain/context';
import { getRootStackId } from '../extensions/amplify-helpers/get-root-stack-id';
import { isYesFlagSet } from './headless-input-utils';

const message = `Amplify has been upgraded to handle secrets more securely by migrating some values in ${chalk.red(
  PathConstants.TeamProviderInfoFileName,
)} to ${chalk.green(PathConstants.DeploymentSecretsFileName)}
You can create a backup of the ${chalk.red(PathConstants.TeamProviderInfoFileName)} file before proceeding.`;
const hostedUIProviderCredsField = 'hostedUIProviderCreds';

/**
 * return true if TPI does not contain any secrets or secrets successfully removed from TPI
 * return false if TPI does contain secrets and they could not be removed
 */
export const migrateTeamProviderInfo = async (context: Context): Promise<boolean> => {
  if (!stateManager.teamProviderInfoExists()) {
    return true;
  }
  // check if command executed in project root and team provider has secrets

  if (!isInvalidEnvOrPulling(context) && pathManager.findProjectRoot()) {
    await ensureEnvParamManager();
    const authResourceName = authResourceNameHasSecrets();

    if (!authResourceName) {
      return true;
    }

    if (isYesFlagSet(context) || (await context.prompt.confirm(message))) {
      const authParams = stateManager.getResourceParametersJson(undefined, 'auth', authResourceName);

      moveAuthSecretToDeploymentSecrets(authResourceName);

      await externalAuthEnable(context, undefined, undefined, authParams);
    } else {
      return false;
    }
  }

  return true;
};

const isInvalidEnvOrPulling = (context: Context): boolean => {
  if (!stateManager.localEnvInfoExists()) {
    return true;
  }

  if (context.input.command) {
    return ['pull', 'init', 'env', 'delete'].includes(context.input.command);
  }

  return false;
};

const authResourceNameHasSecrets = (): string | undefined => {
  const backendConfig = stateManager.getBackendConfig(undefined, { throwIfNotExist: false });
  const authResourceName = Object.keys(backendConfig?.auth || {})[0];
  if (!authResourceName) {
    return undefined;
  }
  if (getEnvParamManager().getResourceParamManager('auth', authResourceName).hasParam(hostedUIProviderCredsField)) {
    return authResourceName;
  }
  return undefined;
};

const moveAuthSecretToDeploymentSecrets = (authResourceName: string): void => {
  const resourceParamManager = getEnvParamManager().getResourceParamManager('auth', authResourceName);
  const teamProviderSecrets = resourceParamManager.getParam(hostedUIProviderCredsField)!;
  const rootStackId = getRootStackId();
  const { envName } = stateManager.getLocalEnvInfo();

  let secrets = stateManager.getDeploymentSecrets();
  secrets = mergeDeploymentSecrets({
    currentDeploymentSecrets: secrets,
    category: 'auth',
    rootStackId,
    envName,
    resource: authResourceName,
    keyName: hostedUIProviderCredsField,
    value: teamProviderSecrets,
  });
  stateManager.setDeploymentSecrets(secrets);
  resourceParamManager.deleteParam(hostedUIProviderCredsField);
};
