import { $TSContext, AmplifyCategories, AmplifyFault, stateManager } from '@aws-amplify/amplify-cli-core';
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
      if (clientId && userpoolId) {
        try {
          const appClientSecret = await getAppClientSecret(context, userpoolId, clientId);
          if (appClientSecret) {
            authMetaOutput.AppClientSecret = appClientSecret;
            await context.amplify.updateamplifyMetaAfterResourceUpdate(AmplifyCategories.AUTH, authResourceName, 'output', authMetaOutput);
          }
        } catch (error) {
          throw new AmplifyFault(
            'ServiceCallFault',
            {
              message: error.message,
            },
            error,
          );
        }
      } else {
        console.log('reached here');
        /* throw a fault here as both clientId and userPoolId are expected to be 
         present in amplify-meta.json. This follows previous behavior of fectching 
         appClientSecret with CustomResource if any input parameter is missing from custom resource
        */
        throw new AmplifyFault('ParametersNotFoundFault', {
          message: 'clientId and userpoolId should be present in amplify-meta.json',
        });
      }
    }
  }
};
