import type { $TSObject } from '@aws-amplify/amplify-cli-core';
import {
  addAuthUserPoolOnlyWithOAuth,
  AddAuthUserPoolOnlyWithOAuthSettings,
  amplifyPushAuth,
  generateRandomShortId,
  getProjectMeta,
  getSocialIdpProvider,
} from '@aws-amplify/amplify-e2e-core';

/**
 * sets up a project with auth (UserPool only or UserPool & IdentityPool)
 */
export const setupOgProjectWithAuth = async (
  ogProjectRoot: string,
  ogProjectSettings: { name: string },
): Promise<AddAuthUserPoolOnlyWithOAuthSettings> => {
  const ogShortId = generateRandomShortId();
  const oauthSettings = createUserPoolWithOAuthSettings(ogProjectSettings.name, ogShortId);
  await addAuthUserPoolOnlyWithOAuth(ogProjectRoot, createUserPoolWithOAuthSettings(ogProjectSettings.name, ogShortId));
  await amplifyPushAuth(ogProjectRoot);
  return oauthSettings;
};

const createUserPoolWithOAuthSettings = (projectPrefix: string, shortId: string): AddAuthUserPoolOnlyWithOAuthSettings => {
  return {
    /* eslint-disable spellcheck/spell-checker */
    resourceName: `${projectPrefix}oares${shortId}`,
    userPoolName: `${projectPrefix}oaup${shortId}`,
    domainPrefix: `${projectPrefix}oadom${shortId}`,
    signInUrl1: 'https://sin1/',
    signInUrl2: 'https://sin2/',
    signOutUrl1: 'https://sout1/',
    signOutUrl2: 'https://sout2/',
    facebookAppId: 'facebookAppId',
    facebookAppSecret: 'facebookAppSecret',
    googleAppId: 'googleAppId',
    googleAppSecret: 'googleAppSecret',
    amazonAppId: 'amazonAppId',
    amazonAppSecret: 'amazonAppSecret',
    appleAppClientId: 'com.fake.app',
    appleAppTeamId: '2QLEWNDK6K',
    appleAppKeyID: '2QLZXKYJ8J',
    appleAppPrivateKey:
      '----BEGIN PRIVATE KEY----MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgIltgNsTgTfSzUadYiCS0VYtDDMFln/J8i1yJsSIw5g+gCgYIKoZIzj0DAQehRANCAASI8E0L/DhR/mIfTT07v3VwQu6q8I76lgn7kFhT0HvWoLuHKGQFcFkXXCgztgBrprzd419mUChAnKE6y89bWcNw----END PRIVATE KEY----',
    /* eslint-enable spellcheck/spell-checker */
  };
};

const lambdaCalloutFilter = (r: $TSObject) => r?.Type === 'AWS::Lambda::Function' || r?.Type === 'Custom::LambdaCallout';

export const migratedLambdas = ['UserPoolClientLambda', 'UserPoolClientInputs', 'OAuthCustomResource', 'OAuthCustomResourceInputs'];
export const nonMigratedLambdas = [
  'HostedUICustomResource',
  'HostedUICustomResourceInputs',
  'HostedUIProvidersCustomResource',
  'HostedUIProvidersCustomResourceInputs',
];

const getLambdaNamesInCfnTemplate = (template: $TSObject): Array<string> => {
  return Object.entries(template.Resources)
    .filter((entry) => lambdaCalloutFilter(entry[1]))
    .map((entry) => entry[0]);
};

export const expectLambdasInCfnTemplate = (template: $TSObject, namesPresent: Array<string>, namesAbsent: Array<string>): void => {
  expect(template?.Resources).toBeDefined();
  const lambdasInCfnTemplate = getLambdaNamesInCfnTemplate(template);
  for (const name of namesPresent) {
    expect(lambdasInCfnTemplate).toContain(name);
  }
  for (const name of namesAbsent) {
    expect(lambdasInCfnTemplate).not.toContain(name);
  }
};

export const expectCorrectOAuthSettings = async (projRoot: string, oAuthSettings: AddAuthUserPoolOnlyWithOAuthSettings): Promise<void> => {
  const meta = getProjectMeta(projRoot);
  const authMeta = Object.keys(meta.auth).map((key) => meta.auth[key])[0];
  const id = authMeta.output.UserPoolId;
  const idpFacebook = await getSocialIdpProvider(id, 'Facebook', meta.providers.awscloudformation.Region);
  const idpGoogle = await getSocialIdpProvider(id, 'Google', meta.providers.awscloudformation.Region);
  const idpAmazon = await getSocialIdpProvider(id, 'LoginWithAmazon', meta.providers.awscloudformation.Region);
  const idpApple = await getSocialIdpProvider(id, 'SignInWithApple', meta.providers.awscloudformation.Region);
  expect(idpFacebook.IdentityProvider.ProviderDetails.client_id).toEqual(oAuthSettings.facebookAppId);
  expect(idpFacebook.IdentityProvider.ProviderDetails.client_secret).toEqual(oAuthSettings.facebookAppSecret);
  expect(idpGoogle.IdentityProvider.ProviderDetails.client_id).toEqual(oAuthSettings.googleAppId);
  expect(idpGoogle.IdentityProvider.ProviderDetails.client_secret).toEqual(oAuthSettings.googleAppSecret);
  expect(idpAmazon.IdentityProvider.ProviderDetails.client_id).toEqual(oAuthSettings.amazonAppId);
  expect(idpAmazon.IdentityProvider.ProviderDetails.client_secret).toEqual(oAuthSettings.amazonAppSecret);
  expect(idpApple.IdentityProvider.ProviderDetails.client_id).toEqual(oAuthSettings.appleAppClientId);
  expect(idpApple.IdentityProvider.ProviderDetails.key_id).toEqual(oAuthSettings.appleAppKeyID);
};
