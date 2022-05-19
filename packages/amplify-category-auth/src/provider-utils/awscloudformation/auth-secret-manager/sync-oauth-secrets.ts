import {
  $TSContext, $TSObject,
} from 'amplify-cli-core';
import _ from 'lodash';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import { getOAuthObjectFromCognito } from '../utils/get-oauth-secrets-from-cognito';
import { OAuthSecretsStateManager } from './auth-secret-manager';
import {
  removeAppIdForAuthInTeamProvider, setAppIdForAuthInTeamProvider,
} from './tpi-utils';

/**
 * if secrets is defined , function stores the OAuth secret into parameter store with
 * Key /amplify/{app-id}/{env}/{authResourceName}_HostedUIProviderCreds
 * else fetches it from cognito to store in parameter store
 */
export const syncOAuthSecretsToCloud = async (context: $TSContext, authResourceName: string, secrets?: $TSObject)
: Promise<string | undefined> => {
// check if its imported auth and check if auth is migrated
  const { imported } = context.amplify.getImportedAuthProperties(context);
  const cliState = new AuthInputState(authResourceName);
  let oAuthSecretsString;
  if (!imported) {
    if (cliState.cliInputFileExists()) {
      const authCliInputs = cliState.getCLIInputPayload();
      const oAuthSecretsStateManager = await OAuthSecretsStateManager.getInstance(context);
      const authProviders = authCliInputs.cognitoConfig.authProvidersUserPool;
      const { hostedUI, userPoolName } = authCliInputs.cognitoConfig;
      if (!_.isEmpty(authProviders) && hostedUI) {
        if (!_.isEmpty(secrets)) {
          await oAuthSecretsStateManager.setOAuthSecrets(secrets?.hostedUIProviderCreds, authResourceName);
        } else {
          // check if parameter is set in the parameter store,
          // if not then fetch the secrets from cognito and insert in parameter store
          const hasOauthSecrets = await oAuthSecretsStateManager.hasOAuthSecrets(authResourceName);
          // eslint-disable-next-line max-depth
          if (!hasOauthSecrets) {
            // data is present in deployent secrets , which can be fetched from cognito
            const oAuthSecrets = await getOAuthObjectFromCognito(context, userPoolName!);
            await oAuthSecretsStateManager.setOAuthSecrets(oAuthSecrets, authResourceName);
          }
        }
        setAppIdForAuthInTeamProvider(authResourceName);
        oAuthSecretsString = await oAuthSecretsStateManager.getOAuthSecrets(authResourceName);
      } else {
        removeAppIdForAuthInTeamProvider(authResourceName);
      }
    }
  }
  return oAuthSecretsString;
};

/**
 * removes OAuth secret from parameter store
 */
export const removeOAuthSecretFromCloud = async (context: $TSContext, resourceName: string): Promise<void> => {
  // check if its imported auth and check if auth is migrated
  const { imported } = context.amplify.getImportedAuthProperties(context);
  const cliState = new AuthInputState(resourceName);
  if (!imported) {
    if (cliState.cliInputFileExists()) {
      const authCliInputs = cliState.getCLIInputPayload();
      const oAuthSecretsStateManager = await OAuthSecretsStateManager.getInstance(context);
      const authProviders = authCliInputs.cognitoConfig.authProvidersUserPool;
      const { hostedUI } = authCliInputs.cognitoConfig;
      if (!_.isEmpty(authProviders) && hostedUI) {
        const hasOauthSecrets = await oAuthSecretsStateManager.hasOAuthSecrets(resourceName);
        if (hasOauthSecrets) {
          await oAuthSecretsStateManager.removeOAuthSecrets(resourceName);
        }
      }
    }
  }
};
