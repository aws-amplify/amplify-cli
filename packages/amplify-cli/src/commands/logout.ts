import { stateManager } from '@aws-amplify/amplify-cli-core';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import { Context } from '../domain/context';
import { CognitoIdentityProviderClient, GlobalSignOutCommand } from '@aws-sdk/client-cognito-identity-provider';

export const run = async (context: Context) => {
  const { appId } = context.parameters.options;
  if (!appId || appId === true) {
    printer.info(`Expected parameters: --appId <appId>`);
    return;
  }

  const amplifyAdminConfig = stateManager.getAmplifyAdminConfigEntry(appId);

  if (!amplifyAdminConfig) {
    printer.info(`No access information found for appId ${appId}`);
    return;
  }

  const useGlobalSignOut = await prompter.yesOrNo('Do you want to logout from all sessions?');

  if (useGlobalSignOut) {
    const cognitoISP = new CognitoIdentityProviderClient({ region: amplifyAdminConfig.region });
    try {
      await cognitoISP.send(new GlobalSignOutCommand({ AccessToken: amplifyAdminConfig.accessToken.jwtToken }));
      printer.info('Logged out globally.');
    } catch (e) {
      printer.error(`An error occurred during logout: ${e.message}`);
      return;
    }
  }
  stateManager.removeAmplifyAdminConfigEntry(appId);
};
