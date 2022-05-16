import {
  $TSContext, AmplifyCategories, ResourceDoesNotExistError, stateManager,
} from 'amplify-cli-core';
import { ICognitoUserPoolService } from 'amplify-util-import';
import { IdentityProviderType } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { createOAuthCredentials } from '../import';

/**
 * get oAuth secrets from cognito
 */
export const getOAuthObjectFromCognito = async (context: $TSContext, userPoolName : string): Promise<string> => {
  const { envName } = stateManager.getLocalEnvInfo();
  const envUserPoolName = `${userPoolName}-${envName}`;
  const cognito = await context.amplify.invokePluginMethod(context, AmplifyCategories.AWSCLOUDFORMATION, undefined, 'createCognitoUserPoolService', [
    context,
  ]) as ICognitoUserPoolService;
  const userPool = (await cognito.listUserPools()).filter(userPoolCognito => userPoolCognito.Name === envUserPoolName)[0];
  if (userPool) {
    const identityProviders: IdentityProviderType[] = await cognito.listUserPoolIdentityProviders(userPool.Id!);
    return createOAuthCredentials(identityProviders);
  }

  throw new ResourceDoesNotExistError('No auth resource found. Add one using `amplify add auth`');
};
