import { ProviderMeta, ProviderCreds, ProviderParameters } from './auth-types';

export const generateAuthNestedStackParameters = (
  hostedUIProviderMeta: ProviderMeta[],
  hostedUIProviderCreds: ProviderCreds[],
): ProviderParameters => {
  const parameters: ProviderParameters = {};

  hostedUIProviderCreds.forEach((provider: ProviderCreds) => {
    const { ProviderName } = provider;
    const authorizeScopes = hostedUIProviderMeta.find((p) => p.ProviderName === ProviderName)?.authorize_scopes;

    if (ProviderName === 'SignInWithApple' && 'key_id' in provider) {
      parameters.signinwithappleAuthorizeScopes = authorizeScopes;
      parameters.signinwithappleClientIdUserPool = provider.client_id;
      parameters.signinwithappleKeyIdUserPool = provider.key_id;
      parameters.signinwithapplePrivateKeyUserPool = provider.private_key;
      parameters.signinwithappleTeamIdUserPool = provider.team_id;
    } else if (ProviderName === 'Facebook' && 'client_secret' in provider) {
      parameters.facebookAuthorizeScopes = authorizeScopes;
      parameters.facebookAppIdUserPool = provider.client_id;
      parameters.facebookAppSecretUserPool = provider.client_secret;
    } else if (ProviderName === 'Google' && 'client_secret' in provider) {
      parameters.googleAuthorizeScopes = authorizeScopes;
      parameters.googleAppIdUserPool = provider.client_id;
      parameters.googleAppSecretUserPool = provider.client_secret;
    } else if (ProviderName === 'LoginWithAmazon' && 'client_secret' in provider) {
      parameters.loginwithamazonAuthorizeScopes = authorizeScopes;
      parameters.loginwithamazonAppIdUserPool = provider.client_id;
      parameters.loginwithamazonAppSecretUserPool = provider.client_secret;
    }
  });

  return parameters;
};
