import { Context } from '../domain/context';
import { stateManager, pathManager } from 'amplify-cli-core';
import _ from 'lodash';
import { externalAuthEnable } from 'amplify-category-auth';
const message = `Amplify auth will be modified to mangage secrets from deployment-secrets.json. Would you like to proceed?`;

export async function MigrateTeamProvider(context: Context): Promise<boolean> {
  // check if command executed in proj root and team provider has secrets
  if (pathManager.findProjectRoot() && stateManager.teamProviderInfoHasAuthSecrets()) {
    if (await context.prompt.confirm(message)) {
      stateManager.moveSecretsFromDeploymentToTeamProvider();
      externalAuthEnable(context, undefined, undefined, { authSelections: 'identityPoolAndUserPool' });
    } else {
      return false;
    }
  }
  return true;
}
