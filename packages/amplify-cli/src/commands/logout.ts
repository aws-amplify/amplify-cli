import { stateManager } from 'amplify-cli-core';
import { prompt } from 'enquirer';
import { Context } from '../domain/context';
import { CognitoIdentityServiceProvider } from 'aws-sdk';

export const run = async (context: Context) => {
  const { appId } = context.parameters.options;
  if (!appId || appId === true) {
    context.print.info(`Expected parameters: --appId <appId>`);
    return;
  }

  const amplifyAdminConfig = stateManager.getAmplifyAdminConfigEntry(appId);

  if (!amplifyAdminConfig) {
    context.print.info(`No access information found for appId ${appId}`);
    return;
  }

  const response: { useGlobalSignOut: string } = await prompt({
    type: 'confirm',
    name: 'useGlobalSignOut',
    message: 'Do you want to logout from all sessions?',
  });

  if (response.useGlobalSignOut) {
    const cognitoISP = new CognitoIdentityServiceProvider({ region: amplifyAdminConfig.region });
    try {
      await cognitoISP.globalSignOut(amplifyAdminConfig.accessToken.jwtToken);
      context.print.info('Logged out globally.');
    } catch (e) {
      context.print.error(`An error occurred during logout: ${e.message}`);
      return;
    }
  }
  stateManager.removeAmplifyAdminConfigEntry(appId);
};
