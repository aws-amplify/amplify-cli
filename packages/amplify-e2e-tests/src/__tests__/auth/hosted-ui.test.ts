import {
  addAuthUserPoolOnlyWithOAuth,
  addAuthWithDefault,
  addAuthWithSignInSignOutUrl,
  amplifyPushAuth,
  createNewProjectDir,
  createUserPoolOnlyWithOAuthSettings,
  deleteProject,
  deleteProjectDir,
  deleteUserPoolDomain,
  generateRandomShortId,
  getHostedUIDomain,
  getProjectMeta,
  getUserPool,
  getUserPoolDomain,
  getUserPoolId,
  initJSProjectWithProfile,
  updateAuthDomainPrefixWithAllProvidersConfigured,
  updateAuthSignInSignOutUrlWithAll,
} from '@aws-amplify/amplify-e2e-core';

const defaultsSettings = {
  name: 'authTest',
};

const oauthSettings = {
  signinUrl: 'https://danielle.lol/',
  signoutUrl: 'https://danielle.lol/',
};

describe('hosted ui tests', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  describe('...amplify add auth', () => {
    describe('...creating with oauth', () => {
      it('...creates a user pool domain', async () => {
        await initJSProjectWithProfile(projRoot, defaultsSettings);
        await addAuthWithSignInSignOutUrl(projRoot, oauthSettings);
        await amplifyPushAuth(projRoot);

        const meta = getProjectMeta(projRoot);
        const region = meta.providers.awscloudformation.Region;
        const { HostedUIDomain, UserPoolId } = Object.keys(meta.auth)
          .map((key) => meta.auth[key])
          .find((auth) => auth.service === 'Cognito').output;

        const userPoolRes = await getUserPool(UserPoolId, region);

        expect(HostedUIDomain).toBeDefined();
        expect(HostedUIDomain).toEqual(userPoolRes.UserPool.Domain);
      });
    });
  });

  describe('amplify update auth', () => {
    describe('...updating to add oauth', () => {
      it('...creates a user pool domain', async () => {
        await initJSProjectWithProfile(projRoot, defaultsSettings);
        await addAuthWithDefault(projRoot);
        await updateAuthSignInSignOutUrlWithAll(projRoot, oauthSettings);
        await amplifyPushAuth(projRoot);

        const meta = getProjectMeta(projRoot);
        const region = meta.providers.awscloudformation.Region;
        const { HostedUIDomain, UserPoolId } = Object.keys(meta.auth)
          .map((key) => meta.auth[key])
          .find((auth) => auth.service === 'Cognito').output;

        const userPoolRes = await getUserPool(UserPoolId, region);

        expect(HostedUIDomain).toBeDefined();
        expect(HostedUIDomain).toEqual(userPoolRes.UserPool.Domain);
      });
    });

    describe('...updating to add oauth after push', () => {
      it('...creates a user pool domain', async () => {
        await initJSProjectWithProfile(projRoot, defaultsSettings);
        await addAuthWithDefault(projRoot);
        await amplifyPushAuth(projRoot);

        await updateAuthSignInSignOutUrlWithAll(projRoot, oauthSettings);
        await amplifyPushAuth(projRoot);

        const meta = getProjectMeta(projRoot);
        const region = meta.providers.awscloudformation.Region;
        const { HostedUIDomain, UserPoolId } = Object.keys(meta.auth)
          .map((key) => meta.auth[key])
          .find((auth) => auth.service === 'Cognito').output;

        const userPoolRes = await getUserPool(UserPoolId, region);

        expect(HostedUIDomain).toBeDefined();
        expect(HostedUIDomain).toEqual(userPoolRes.UserPool.Domain);
      });
    });

    describe('...updating to change domain prefix', () => {
      it('...updates a user pool domain', async () => {
        await initJSProjectWithProfile(projRoot, defaultsSettings);
        const oauthSettings = createUserPoolOnlyWithOAuthSettings('hui', generateRandomShortId());
        await addAuthUserPoolOnlyWithOAuth(projRoot, oauthSettings);
        await amplifyPushAuth(projRoot);
        const originalUserPoolId = getUserPoolId(projRoot);
        const originalHostedUIDomain = getHostedUIDomain(projRoot);
        const meta = getProjectMeta(projRoot);
        const region = meta.providers.awscloudformation.Region;
        expect(originalHostedUIDomain).toMatch(oauthSettings.domainPrefix);
        const originalUserPoolRes = await getUserPool(originalUserPoolId, region);
        expect(originalHostedUIDomain).toEqual(originalUserPoolRes.UserPool.Domain);

        const updatedDomainPrefix = `new-prefix-${generateRandomShortId()}`;
        await updateAuthDomainPrefixWithAllProvidersConfigured(projRoot, {
          domainPrefix: updatedDomainPrefix,
        });
        await amplifyPushAuth(projRoot);

        const userPoolId = getUserPoolId(projRoot);
        const hostedUIDomain = getHostedUIDomain(projRoot);
        expect(userPoolId).toEqual(originalUserPoolId);
        const userPoolRes = await getUserPool(userPoolId, region);
        expect(hostedUIDomain).not.toEqual(originalHostedUIDomain);
        expect(hostedUIDomain).toMatch(updatedDomainPrefix);
        expect(hostedUIDomain).toEqual(userPoolRes.UserPool.Domain);

        const updatedDomainRes = await getUserPoolDomain(hostedUIDomain, region);
        expect(updatedDomainRes).toBeDefined();
        const originalDomainRes = await getUserPoolDomain(originalHostedUIDomain, region);
        // originalDomainRes has 2 properties $metadata and DomainDescription, we expect DomainDescription to be an empty object
        // $metadata property is common in SDK V3 objects
        expect(originalDomainRes.DomainDescription).toEqual({});

        const deleteOriginalDomainRes = await deleteUserPoolDomain(originalHostedUIDomain, userPoolId, region);
        // undefined response as it throws InvalidParameterException: No such domain or user pool exists.
        expect(deleteOriginalDomainRes).toBeUndefined();
      });
    });
  });
});
