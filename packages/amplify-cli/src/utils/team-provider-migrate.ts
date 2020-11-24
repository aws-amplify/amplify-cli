import { Context } from '../domain/context';
import { stateManager, pathManager, PathConstants } from 'amplify-cli-core';
import _ from 'lodash';
import { externalAuthEnable, migrate } from 'amplify-category-auth';
import { isYesFlagSet } from './headless-input-utils';
import chalk from 'chalk';
import { moveSecretsFromTeamProviderToDeployment } from './move-secrets-to-deployment';

const message = `Amplify has been upgraded to handle secrets more securely by migrating some values in ${chalk.red(
  PathConstants.TeamProviderInfoFileName,
)} to ${chalk.green(PathConstants.DeploymentSecretsFileName)}
You can create a back up of the ${chalk.red(PathConstants.TeamProviderInfoFileName)} file before proceeding.`;
const hostedUIProviderCredsField = 'hostedUIProviderCreds';

// return true if the current state of the app does not contain secrets in the team provider info
// if the state of the app is not without secrets in team-provider-info it return false
export const migrateTeamProviderInfo = async (context: Context): Promise<boolean> => {
  // check if command executed in proj root and team provider has secrets

  if (!isPulling(context) && pathManager.findProjectRoot()) {
    const authResourceName = teamProviderInfoGetAuthResourceNameHasSecrets();
    if (!authResourceName) return true;
    if (isYesFlagSet(context) || (await context.prompt.confirm(message))) {
      const authParams = stateManager.getResourceParametersJson(undefined, 'auth', authResourceName);
      moveSecretsFromTeamProviderToDeployment();
      await externalAuthEnable(context, undefined, undefined, authParams);
    } else {
      return false;
    }
  }

  return true;
};

function isPulling(context: Context): boolean {
  const isPulling =
    context.input.command === 'pull' ||
    context.input.command === 'init' ||
    (context.input.command === 'env' &&
      !!context.input.subCommands &&
      context.input.subCommands.length > 0 &&
      context.input.subCommands[0] === 'pull');
  return isPulling;
}

function teamProviderInfoGetAuthResourceNameHasSecrets(): any | undefined {
  if (stateManager.teamProviderInfoExists()) {
    const teamProviderInfo = stateManager.getTeamProviderInfo();
    const { envName } = stateManager.getLocalEnvInfo();
    const authResources = _.get(teamProviderInfo, [envName, 'categories', 'auth']);
    if (authResources) {
      return _.find(Object.keys(authResources), resource => _.has(authResources, [resource, hostedUIProviderCredsField]));
    }
  }
  return;
}
