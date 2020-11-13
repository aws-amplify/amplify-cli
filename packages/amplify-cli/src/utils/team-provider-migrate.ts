import { Context } from '../domain/context';
import { stateManager, pathManager } from 'amplify-cli-core';
import _ from 'lodash';
import { externalAuthEnable } from 'amplify-category-auth';
const message = `Amplify auth will be modified to mangage secrets from deployment-secrets.json. Would you like to proceed?`;

export async function MigrateTeamProvider(context: Context): Promise<boolean> {
  // check if command executed in proj root and team provider has secrets

  if (!isPulling(context) && pathManager.findProjectRoot() && stateManager.teamProviderInfoHasAuthSecrets()) {
    if (checkIfHeadless(context) || (await context.prompt.confirm(message))) {
      stateManager.moveSecretsFromTeamProviderToDeployment();
      externalAuthEnable(context, undefined, undefined, { authSelections: 'identityPoolAndUserPool' });
    } else {
      return false;
    }
  }
  return true;
}
function isPulling(context: Context): boolean {
  const isPulling =
    context.input.command === 'pull' ||
    (context.input.command === 'env' &&
      !!context.input.subCommands &&
      context.input.subCommands.length > 0 &&
      context.input.subCommands[0] === 'pull');
  return isPulling;
}

function checkIfHeadless(context: Context): boolean {
  return context.exeInfo && context.exeInfo.inputParams && context.exeInfo.inputParams.yes;
}
