/* eslint-disable spellcheck/spell-checker */
import {
  addHeadlessAuth,
  amplifyPushNonInteractive,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  generateRandomShortId,
  getProjectMeta,
  getSocialIdpProvider,
  getSocialProviders,
  getUserPool,
  getUserPoolClients,
  initJSProjectWithProfile,
  isDeploymentSecretForEnvExists,
  validateNodeModulesDirRemoval,
} from '@aws-amplify/amplify-e2e-core';
import { AddAuthRequest, CognitoUserPoolSigninMethod, CognitoUserProperty } from 'amplify-headless-interface';

const defaultsSettings = {
  name: 'authTest',
};

describe('amplify add auth...', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('...should init a project and add auth with social provider headless', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);

    const socialProviders = getSocialProviders(true);

    const addAuthRequest: AddAuthRequest = {
      version: 2,
      resourceName: 'myAuthResource',
      serviceConfiguration: {
        serviceName: 'Cognito',
        includeIdentityPool: false,
        userPoolConfiguration: {
          requiredSignupAttributes: [CognitoUserProperty.EMAIL],
          // eslint-disable-next-line spellcheck/spell-checker
          signinMethod: CognitoUserPoolSigninMethod.USERNAME,
          autoVerifiedAttributes: [
            {
              type: 'EMAIL',
            },
          ],
          oAuth: {
            redirectSigninURIs: ['https://www.google.com/'],
            redirectSignoutURIs: ['https://www.nytimes.com/'],
            domainPrefix: generateRandomShortId(),
            oAuthGrantType: 'CODE',
            oAuthScopes: ['EMAIL', 'OPENID'],
            socialProviderConfigurations: [
              {
                provider: 'FACEBOOK',
                clientId: socialProviders.FACEBOOK_APP_ID,
                clientSecret: socialProviders.FACEBOOK_APP_SECRET,
              },
              {
                provider: 'GOOGLE',
                clientId: socialProviders.GOOGLE_APP_ID,
                clientSecret: socialProviders.GOOGLE_APP_SECRET,
              },
              {
                provider: 'LOGIN_WITH_AMAZON',
                clientId: socialProviders.AMAZON_APP_ID,
                clientSecret: socialProviders.AMAZON_APP_SECRET,
              },
              {
                provider: 'SIGN_IN_WITH_APPLE',
                clientId: socialProviders.APPLE_APP_ID,
                keyId: socialProviders.APPLE_KEY_ID,
                teamId: socialProviders.APPLE_TEAM_ID,
                privateKey: socialProviders.APPLE_PRIVATE_KEY,
              },
            ],
          },
        },
      },
    };
    await addHeadlessAuth(projRoot, addAuthRequest);

    expect(isDeploymentSecretForEnvExists(projRoot, 'integtest')).toBeTruthy();
    await amplifyPushNonInteractive(projRoot);
    expect(isDeploymentSecretForEnvExists(projRoot, 'integtest')).toBeFalsy();

    const meta = getProjectMeta(projRoot);
    const authMeta = Object.keys(meta.auth).map((key) => meta.auth[key])[0];
    const id = authMeta.output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clientIds = [authMeta.output.AppClientIDWeb, authMeta.output.AppClientID];
    const clients = await getUserPoolClients(id, clientIds, meta.providers.awscloudformation.Region);

    expect(userPool.UserPool).toBeDefined();
    expect(clients).toHaveLength(2);
    validateNodeModulesDirRemoval(projRoot);
    expect(clients[0].UserPoolClient.CallbackURLs[0]).toEqual('https://www.google.com/');
    expect(clients[0].UserPoolClient.LogoutURLs[0]).toEqual('https://www.nytimes.com/');
    expect(clients[0].UserPoolClient.SupportedIdentityProviders).toHaveLength(5);

    const idpFacebook = await getSocialIdpProvider(id, 'Facebook', meta.providers.awscloudformation.Region);
    const idpGoogle = await getSocialIdpProvider(id, 'Google', meta.providers.awscloudformation.Region);
    const idpAmazon = await getSocialIdpProvider(id, 'LoginWithAmazon', meta.providers.awscloudformation.Region);
    const idpApple = await getSocialIdpProvider(id, 'SignInWithApple', meta.providers.awscloudformation.Region);
    expect(idpFacebook.IdentityProvider.ProviderDetails.client_id).toEqual(socialProviders.FACEBOOK_APP_ID);
    expect(idpFacebook.IdentityProvider.ProviderDetails.client_secret).toEqual(socialProviders.FACEBOOK_APP_SECRET);
    expect(idpGoogle.IdentityProvider.ProviderDetails.client_id).toEqual(socialProviders.GOOGLE_APP_ID);
    expect(idpGoogle.IdentityProvider.ProviderDetails.client_secret).toEqual(socialProviders.GOOGLE_APP_SECRET);
    expect(idpAmazon.IdentityProvider.ProviderDetails.client_id).toEqual(socialProviders.AMAZON_APP_ID);
    expect(idpAmazon.IdentityProvider.ProviderDetails.client_secret).toEqual(socialProviders.AMAZON_APP_SECRET);
    expect(idpApple.IdentityProvider.ProviderDetails.client_id).toEqual(socialProviders.APPLE_APP_ID);
    expect(idpApple.IdentityProvider.ProviderDetails.key_id).toEqual(socialProviders.APPLE_KEY_ID);
  });
});
