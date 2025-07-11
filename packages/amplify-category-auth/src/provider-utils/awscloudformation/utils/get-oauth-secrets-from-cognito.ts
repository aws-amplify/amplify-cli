import { ICognitoUserPoolService } from '@aws-amplify/amplify-util-import';
import { $TSContext, stateManager, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { IdentityProviderType } from '@aws-sdk/client-cognito-identity-provider';
import { createOAuthCredentials } from '../import';

/**
 * get oAuth secrets from cognito only for amplify generated userPools
 */
export const getOAuthObjectFromCognito = async (
  context: $TSContext,
  userPoolName: string,
): Promise<Array<OAuthProviderDetails> | undefined> => {
  const { envName } = stateManager.getLocalEnvInfo();
  const envUserPoolName = `${userPoolName}-${envName}`;
  const cognito = (await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'createCognitoUserPoolService', [
    context,
  ])) as ICognitoUserPoolService;
  const userPool = (await cognito.listUserPools()).filter((userPoolCognito) => userPoolCognito.Name === envUserPoolName)[0];
  const userPoolId = userPool?.Id;
  if (userPoolId) {
    const identityProviders: IdentityProviderType[] = await cognito.listUserPoolIdentityProviders(userPoolId);
    if (identityProviders.length > 0) {
      const providerObj = JSONUtilities.parse<Array<OAuthProviderDetails>>(createOAuthCredentials(identityProviders));
      return providerObj;
    }
  }
  return undefined;
};

/**
 *  type for "Facebook" | "Google" | "LoginWithAmazon"
 */
export type GenericProviderDetails = {
  ProviderName: string;
  client_id: string;
  client_secret: string;
};

/**
 * type for SignInWithApple
 */
export type AppleProviderDetails = {
  ProviderName: string;
  client_id: string;
  team_id: string;
  key_id: string;
  private_key: string;
};

export type OAuthProviderDetails = GenericProviderDetails | AppleProviderDetails;
