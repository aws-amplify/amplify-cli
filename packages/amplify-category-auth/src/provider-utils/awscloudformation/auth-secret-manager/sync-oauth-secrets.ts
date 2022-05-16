import {
  $TSContext, $TSObject,
} from 'amplify-cli-core';
import _ from 'lodash';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import { getOAuthObjectFromCognito } from '../utils/get-oauth-secrets-from-cognito';
import { OAuthSecretsStateManager } from './auth-secret-manager';
import { removeAppIdForFunctionInTeamProvider, setAppIdForFunctionInTeamProvider } from './tpi-utils';

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
  let oAuthSecrets;
  if (!imported && cliState.cliInputFileExists()) {
    const authCliInputs = cliState.getCLIInputPayload();
    const oAuthSecretsStateManager = await OAuthSecretsStateManager.getInstance(context);
    const authProviders = authCliInputs.cognitoConfig.authProvidersUserPool;
    const { hostedUI, userPoolName } = authCliInputs.cognitoConfig;
    if (!_.isEmpty(authProviders) && hostedUI) {
      if (!_.isEmpty(secrets)) {
        oAuthSecrets = secrets?.hostedUIProviderCreds;
        await oAuthSecretsStateManager.setOAuthSecrets(oAuthSecrets, authResourceName);
      } else {
        // check if parameter is set in the parameter store,
        // if not then fetch the secrets from cognito and insert in parameter store
        oAuthSecrets = await oAuthSecretsStateManager.getOAuthSecrets(authResourceName);
        // eslint-disable-next-line max-depth
        if (_.isEmpty(oAuthSecrets)) {
          // data is present in deployent secrets , which can be fetched from cognito
          oAuthSecrets = await getOAuthObjectFromCognito(context, userPoolName!);
          await oAuthSecretsStateManager.setOAuthSecrets(oAuthSecrets, authResourceName);
        }
      }
      setAppIdForFunctionInTeamProvider(authResourceName);
    } else {
      removeAppIdForFunctionInTeamProvider(authResourceName);
    }
  }
  return oAuthSecrets;
};
