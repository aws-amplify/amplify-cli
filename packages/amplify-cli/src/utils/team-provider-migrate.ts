import { Context } from '../domain/context';
import { stateManager, pathManager, PathConstants } from 'amplify-cli-core';
import _ from 'lodash';
import { externalAuthEnable } from 'amplify-category-auth';
import { isYesFlagSet } from './headless-input-utils';
import chalk from 'chalk';

const message = `Amplify has been upgraded to handle secrets more securely by migrating some values in ${chalk.red(
  PathConstants.TeamProviderInfoFileName,
)} to ${chalk.green(PathConstants.DeploymentSecretsFileName)}
You can create a back up of the ${chalk.red(PathConstants.TeamProviderInfoFileName)} file before proceeding.`;
const hostedUIProviderCredsField = 'hostedUIProviderCreds';

export const migrateTeamProviderInfo = async (context: Context): Promise<boolean> => {
  // check if command executed in proj root and team provider has secrets
  if (!isPulling(context) && pathManager.findProjectRoot() && teamProviderInfoHasAuthSecrets()) {
    if (isYesFlagSet(context) || (await context.prompt.confirm(message))) {
      stateManager.moveSecretsFromTeamProviderToDeployment();
      await externalAuthEnable(context, undefined, undefined, { authSelections: 'identityPoolAndUserPool' });
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

function teamProviderInfoHasAuthSecrets(): boolean {
  if (stateManager.teamProviderInfoExists()) {
    const teamProviderInfo = stateManager.getTeamProviderInfo();
    const { envName } = stateManager.getLocalEnvInfo();
    const envTeamProvider = teamProviderInfo[envName];
    if (envTeamProvider && envTeamProvider.categories && envTeamProvider.categories.auth) {
      return _.some(Object.keys(envTeamProvider.categories.auth), resource => {
        return !!envTeamProvider.categories.auth[resource][hostedUIProviderCredsField];
      });
    }
  }
  return false;
}
