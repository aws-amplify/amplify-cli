import {
  addAuthWithDefault,
  addAuthWithSignInSignOutUrl,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  getUserPool,
  initJSProjectWithProfile,
  updateAuthSignInSignOutUrlAfterPull,
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
        await updateAuthSignInSignOutUrlAfterPull(projRoot, oauthSettings);
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

        await updateAuthSignInSignOutUrlAfterPull(projRoot, oauthSettings);
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
});
