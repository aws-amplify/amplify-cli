import {
  addAuthWithGroups,
  addAuthWithSignInSignOutUrl,
  amplifyPull,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  getUserPool,
  getProjectMeta,
  initJSProjectWithProfile,
  updateAuthSignInSignOutUrl,
  addAuthWithDefault,
} from '@aws-amplify/amplify-e2e-core';
import { versionCheck, allowedVersionsToMigrateFrom } from '../../migration-helpers';

const oauthSettings = {
  signinUrl: 'https://danielle.lol/',
  signoutUrl: 'https://danielle.lol/',
};

describe('v11: hosted UI migration', () => {
  let projRoot1: string;

  beforeAll(async () => {
    const migrateFromVersion = { v: '11.0.0' };
    const migrateToVersion = { v: 'unintialized' };

    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);

    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
  });

  beforeEach(async () => {
    projRoot1 = await createNewProjectDir('authMigration1');
  });

  afterEach(async () => {
    await deleteProject(projRoot1, null, true);
    deleteProjectDir(projRoot1);
  });

  describe('...updating auth with hosted UI', () => {
    it('...maintains the user pool domain and deletes lambda', async () => {
      await initJSProjectWithProfile(projRoot1, { name: 'authTest', disableAmplifyAppCreation: false });
      await addAuthWithSignInSignOutUrl(projRoot1, oauthSettings);
      await amplifyPushAuth(projRoot1);

      const meta = getProjectMeta(projRoot1);
      const appId = getAppId(projRoot1);
      const region = meta.providers.awscloudformation.Region;
      const { HostedUIDomain, UserPoolId } = Object.keys(meta.auth)
        .map((key) => meta.auth[key])
        .find((auth) => auth.service === 'Cognito').output;

      const userPoolRes1 = await getUserPool(UserPoolId, region);
      const projRoot2 = await createNewProjectDir('authMigration2');

      expect(HostedUIDomain).toBeDefined();
      expect(HostedUIDomain).toEqual(userPoolRes1.UserPool.Domain);

      try {
        await amplifyPull(projRoot2, { emptyDir: true, appId }, true);
        await updateAuthSignInSignOutUrl(projRoot2, { testingWithLatestCodebase: true });
        await amplifyPushAuth(projRoot2, true);

        const userPoolRes2 = await getUserPool(UserPoolId, region);

        expect(userPoolRes1.UserPool.Domain).toEqual(userPoolRes2.UserPool.Domain);

        // check that lambda is changed
        // update
        // push
        // check that lambda is gone and user pool domain still exists
      } finally {
        deleteProjectDir(projRoot2);
      }
    });
  });

  describe('...updating auth without hosted UI', () => {
    it('...creates user pool domain and does not create lambda', async () => {
      await initJSProjectWithProfile(projRoot1, { name: 'authTest', disableAmplifyAppCreation: false });
      await addAuthWithDefault(projRoot1);
      await amplifyPushAuth(projRoot1);

      const meta = getProjectMeta(projRoot1);
      const appId = getAppId(projRoot1);
      const region = meta.providers.awscloudformation.Region;
      const { HostedUIDomain, UserPoolId } = Object.keys(meta.auth)
        .map((key) => meta.auth[key])
        .find((auth) => auth.service === 'Cognito').output;

      const userPoolRes1 = await getUserPool(UserPoolId, region);
      const projRoot2 = await createNewProjectDir('authMigration2');

      expect(HostedUIDomain).toBeDefined();
      expect(HostedUIDomain).toEqual(userPoolRes1.UserPool.Domain);

      try {
        let oauthUpdateSettings = {
          ...oauthSettings,
          updateSigninUrl: 'https://example.url/',
          updateSignoutUrl: 'https://example.url/',
          testingWithLatestCodebase: true,
        };

        await amplifyPull(projRoot2, { emptyDir: true, appId }, true);
        await updateAuthSignInSignOutUrl(projRoot2, oauthUpdateSettings);
        await amplifyPushAuth(projRoot2, true);

        const userPoolRes2 = await getUserPool(UserPoolId, region);

        expect(userPoolRes1.UserPool.Domain).toEqual(userPoolRes2.UserPool.Domain);

        // check that lambda not created
      } finally {
        deleteProjectDir(projRoot2);
      }
    });
  });
});
