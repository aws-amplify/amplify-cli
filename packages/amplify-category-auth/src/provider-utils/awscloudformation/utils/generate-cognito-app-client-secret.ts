import { $TSContext, AmplifyCategories, stateManager } from '@aws-amplify/amplify-cli-core';
import { getAuthResourceName } from '../../../utils/getAuthResourceName';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import { MetaOutput } from '../import/types';
import { getAppClientSecretViaSdk } from './get-app-client-secret-sdk';
import { projectHasAuth } from './project-has-auth';

/**
 *
 * returns app client secret if user pool exists
 */
const generateAppClientSecret = async (
  context: $TSContext,
  authResourceName: string,
  clientId: string,
  userPoolId: string,
): Promise<string | undefined> => {
  const authState = new AuthInputState(context, authResourceName);
  if (authState.cliInputFileExists()) {
    const { cognitoConfig } = authState.getCLIInputPayload();
    if (cognitoConfig.userpoolClientGenerateSecret) {
      const appClientSecret = await getAppClientSecretViaSdk(context, userPoolId, clientId);
      console.log(appClientSecret);
      return appClientSecret;
    }
  }
};

/**
 *
 * updates app client secret if user pool exists and userpoolClientGenerateSecret is set to true
 */
export const updatesAppClientSecret = async (context: $TSContext): Promise<void> => {
  if (projectHasAuth()) {
    // check if its imported auth
    const { imported } = context.amplify.getImportedAuthProperties(context);
    if (!imported) {
      const authResourceName = await getAuthResourceName(context);
      const authMetaOutput: MetaOutput = stateManager.getMeta()?.auth[authResourceName]?.output;
      const clientId = authMetaOutput.AppClientID;
      const userPoolId = authMetaOutput.UserPoolId;
      if (clientId && userPoolId) {
        const appClientSecret = await generateAppClientSecret(context, authResourceName, clientId, userPoolId);
        if (appClientSecret) {
          authMetaOutput.AppClientSecret = appClientSecret;
        }
      }
      await context.amplify.updateamplifyMetaAfterResourceUpdate(AmplifyCategories.AUTH, authResourceName, 'output', authMetaOutput);
    }
  }
};
