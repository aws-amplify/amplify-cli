import { $TSContext, $TSObject, AmplifyCategories, AmplifySupportedService } from '@aws-amplify/amplify-cli-core';

/**
 * uploads Cognito auth trigger files (code and assets needed for trigger to execute)
 */
export const uploadAuthTriggerFiles = async (context: $TSContext, toBeCreated: $TSObject[], toBeUpdated: $TSObject[]): Promise<void> => {
  const newAuth = toBeCreated.find((a) => a.service === AmplifySupportedService.COGNITO);
  const updatedAuth = toBeUpdated.find((b) => b.service === AmplifySupportedService.COGNITO);
  if (newAuth || updatedAuth) {
    await context.amplify.invokePluginMethod(context, AmplifyCategories.AUTH, undefined, 'uploadFiles', [context]);
  }
};
