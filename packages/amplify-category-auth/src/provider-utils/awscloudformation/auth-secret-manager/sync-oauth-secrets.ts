/* eslint-disable spellcheck/spell-checker */
import {
  $TSContext, $TSObject,
} from 'amplify-cli-core';
import _ from 'lodash';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import { getOAuthObjectFromCognito } from '../utils/get-oauth-secrets-from-cognito';
import { OAuthSecretsStateManager } from './auth-secret-manager';

/**
 * if secrets is defined , function stores the OAuth secret into parameter store with
 * Key /amplify/{appid}/{env}/{authResourceName}_HostedUIProviderCreds
 * else fetches it from cognito to store in parameter store
 */
export const syncOAuthSecretsToCloud = async (context: $TSContext, authResourceName: string, secrets?: $TSObject): Promise<void> => {
// check if its imported auth
  const { imported } = context.amplify.getImportedAuthProperties(context);
  if (!imported) {
    const cliState = new AuthInputState(authResourceName);
    const authCliInputs = cliState.getCLIInputPayload();
    const oAuthSecretsStateManager = await OAuthSecretsStateManager.getInstance(context);
    const authProviders = authCliInputs.cognitoConfig.authProvidersUserPool;
    const { hostedUI } = authCliInputs.cognitoConfig;
    if (!_.isEmpty(authProviders) && hostedUI) {
      if (!_.isEmpty(secrets)) {
        const { hostedUIProviderCreds } = secrets!;
        await oAuthSecretsStateManager.setOAuthSecrets(hostedUIProviderCreds, authResourceName);
      } else {
        // check if parameter is set in the parameter store,
        // if not then fetch the secrets from cognito and insert in parameter store
        const oAuthSecretString = await oAuthSecretsStateManager.getOAuthSecrets(authResourceName);
        if (_.isEmpty(oAuthSecretString)) {
          // data is present in deployent secrets , which can be fetched from cognito
          const hostedUIProviderCreds = await getOAuthObjectFromCognito(context, authResourceName);
          await oAuthSecretsStateManager.setOAuthSecrets(hostedUIProviderCreds, authResourceName);
        }
      }
    } else {
      // remove oAuth secrets but there is currently no way to update in a desired way
      // await oAuthSecretsStateManager.removeOAuthSecrets(hostedUIProviderCreds, cognitoCLIInputs.cognitoConfig.resourceName);
    }
  }
};
