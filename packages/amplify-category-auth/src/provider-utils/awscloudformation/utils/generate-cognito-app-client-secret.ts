import { $TSContext, AmplifyCategories, stateManager } from '@aws-amplify/amplify-cli-core';
import { getAuthResourceName } from '../../../utils/getAuthResourceName';
import { MetaOutput } from '../import/types';
import { getAppClientSecret } from './get-app-client-secret-sdk';
import { projectHasAuth } from './project-has-auth';

/**
 *
 * updates app client secret if user pool exists and userpoolClientGenerateSecret is set to true
 */
export const updateAppClientWithGeneratedSecret = async (context: $TSContext): Promise<void> => {
  if (projectHasAuth()) {
    // check if its imported auth
    const { imported } = context.amplify.getImportedAuthProperties(context);
    if (!imported) {
      const authResourceName = await getAuthResourceName(context);
      const authMetaOutput: MetaOutput = stateManager.getMeta()?.auth[authResourceName]?.output;
      const clientId = authMetaOutput.AppClientID;
      const userpoolId = authMetaOutput.UserPoolId;
      // no else case required as userpool client is default created with userPool when created through amplify
      if (clientId && userpoolId) {
        const appClientSecret = await getAppClientSecret(context, userpoolId, clientId);
        if (appClientSecret) {
          authMetaOutput.AppClientSecret = appClientSecret;
          await context.amplify.updateamplifyMetaAfterResourceUpdate(AmplifyCategories.AUTH, authResourceName, 'output', authMetaOutput);
        }
      }
    }
  }
};
