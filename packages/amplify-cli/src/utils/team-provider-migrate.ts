import { externalAuthEnable } from '@aws-amplify/amplify-category-auth';
import { ensureEnvParamManager, getEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import {
  $TSAny,
  AmplifyError,
  mergeDeploymentSecrets, PathConstants, stateManager,
} from 'amplify-cli-core';
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
export const moveTpiSecretsToDeploymentSecrets = async (context: Context): Promise<void> => {
  if (!stateManager.teamProviderInfoExists()) {
    return;
  }
  // check if command executed in project root and team provider has secrets

  if (isInvalidEnvOrPulling(context)) {
    return;
  }
  await ensureEnvParamManager();
  const authResourceName = authResourceNameHasSecrets();

  if (!authResourceName) {
    return;
  }

  if (isYesFlagSet(context) || (await context.prompt.confirm(message))) {
    const authParams = stateManager.getResourceParametersJson(undefined, 'auth', authResourceName);

    moveAuthSecretToDeploymentSecrets(authResourceName);

    await externalAuthEnable(context, undefined, undefined, authParams);
  } else {
    throw new AmplifyError('MigrationError', {
      message: 'An error occurred while migrating team provider info',
      link: 'https://docs.amplify.aws/cli/project/troubleshooting/',
    });
  }
};

/**
 * Copies the AmplifyAppId and Region from the awscloudformation provider metadata in team-provider-info.json into `local-aws-info.json`
 * for each environment present in the team-provider-info.json file.
 *
 * This allows the metadata for each environment to be reconstructed from service calls rather than rely on the team-provider-info.json file
 */
export const copyAppIdAndRegionToLocalAwsInfo = async (): Promise<void> => {
  // early return if the files don't exist
  if (!stateManager.teamProviderInfoExists() || !stateManager.localAWSInfoExists()) {
    return;
  }
  const localAwsInfo = stateManager.getLocalAWSInfo();
  Object.entries(stateManager.getTeamProviderInfo()).forEach(([envName, envConfig]: [string, $TSAny]) => {
    const cfnMeta = envConfig?.awscloudformation;
    if (!cfnMeta) {
      return;
    }
    if (!localAwsInfo[envName].AmplifyAppId) {
      localAwsInfo[envName].AmplifyAppId = cfnMeta.AmplifyAppId;
    }
    if (!localAwsInfo[envName].Region) {
      localAwsInfo[envName].Region = cfnMeta.Region;
    }
  });
  stateManager.setLocalAWSInfo(undefined, localAwsInfo);
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
