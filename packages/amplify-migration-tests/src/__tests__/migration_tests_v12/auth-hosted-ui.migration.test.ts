import {
  addAuthWithDefault,
  addAuthWithDefaultSocial,
  amplifyPull,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  getUserPool,
  getProjectMeta,
  initJSProjectWithProfile,
  listSocialIdpProviders,
  updateAuthToAddOauthProviders,
  updateAuthToUpdateUrls,
  updateAuthToAddSignInSignOutUrlAfterPull,
} from '@aws-amplify/amplify-e2e-core';
import { versionCheck, allowedVersionsToMigrateFrom } from '../../migration-helpers';
import { JSONUtilities, pathManager } from '@aws-amplify/amplify-cli-core';
import Template from 'cloudform-types/types/template';

const oauthSettings = {
  signinUrl: 'https://amplify.lol/',
  signoutUrl: 'https://amplify.lol/',
};

const { getResourceCfnTemplatePath, getBackendDirPath } = pathManager;
const { readJson } = JSONUtilities;

describe('v12: hosted UI migration', () => {
  let projRoot1: string;

  beforeAll(async () => {
    const migrateFromVersion = { v: 'uninitialized' };
    const migrateToVersion = { v: 'uninitialized' };

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
    it('...maintains the user pool domain and idps, and deletes lambda', async () => {
      await initJSProjectWithProfile(projRoot1, { name: 'authTest', disableAmplifyAppCreation: false });
      await addAuthWithDefaultSocial(projRoot1);
      await amplifyPushAuth(projRoot1);

      const meta = getProjectMeta(projRoot1);
      const appId = getAppId(projRoot1);
      const region = meta.providers.awscloudformation.Region;
      const authName = Object.keys(meta.auth).find((authProvider) => meta.auth[authProvider]?.service === 'Cognito');
      const { HostedUIDomain, UserPoolId } = meta.auth[authName].output;

      const userPoolRes1 = await getUserPool(UserPoolId, region);
      const idpsRes1 = await listSocialIdpProviders(UserPoolId, region);
      const projRoot2 = await createNewProjectDir('authMigration2');

      expect(HostedUIDomain).toBeDefined();
      expect(HostedUIDomain).toEqual(userPoolRes1.UserPool.Domain);
      expect(idpsRes1.Providers.length).toEqual(4);

      try {
        let oauthUpdateSettings = {
          ...oauthSettings,
          updateSigninUrl: 'https://example.url/',
          updateSignoutUrl: 'https://example.url/',
          testingWithLatestCodebase: true,
        };

        // Does not update idps
        await amplifyPull(projRoot2, { emptyDir: true, appId }, true);
        await updateAuthToUpdateUrls(projRoot2, oauthUpdateSettings);
        await amplifyPushAuth(projRoot2, true);

        const meta2 = getProjectMeta(projRoot2);
        const output2 = meta2.auth[authName].output;
        const userPoolRes2 = await getUserPool(UserPoolId, region);
        const idpsRes2 = await listSocialIdpProviders(output2.UserPoolId, region);
        const authCfnTemplatePath = getResourceCfnTemplatePath(projRoot2, 'auth', authName);
        let authCfnTemplate: Template | undefined = readJson(authCfnTemplatePath, { throwIfNotExist: false });

        expect(userPoolRes1.UserPool.Domain).toEqual(userPoolRes2.UserPool.Domain);
        expect(idpsRes2.Providers.length).toEqual(4);
        expect(authCfnTemplate.Resources.HostedUICustomResource.Properties.Code.ZipFile).toMatchSnapshot();

        oauthUpdateSettings = {
          ...oauthUpdateSettings,
          signinUrl: 'https://example.url/',
          signoutUrl: 'https://example.url/',
          updateSigninUrl: 'https://example.info/',
          updateSignoutUrl: 'https://example.info/',
          testingWithLatestCodebase: true,
        };

        // Updates idps
        await updateAuthToUpdateUrls(projRoot2, oauthUpdateSettings);
        await updateAuthToAddOauthProviders(projRoot2, { testingWithLatestCodebase: true });
        await amplifyPushAuth(projRoot2, true);

        const userPoolRes3 = await getUserPool(UserPoolId, region);
        const idpsRes3 = await listSocialIdpProviders(output2.UserPoolId, region);
        authCfnTemplate = readJson(authCfnTemplatePath, { throwIfNotExist: false });

        expect(userPoolRes1.UserPool.Domain).toEqual(userPoolRes3.UserPool.Domain);
        expect(idpsRes3.Providers.length).toEqual(4);
        expect(authCfnTemplate.Resources.HostedUICustomResource).toBeUndefined();
        expect(authCfnTemplate.Resources.hostedUIProvidersCustomResource).toMatchSnapshot();

        // Updates idps
        await updateAuthToAddOauthProviders(projRoot2, { testingWithLatestCodebase: true });
        await amplifyPushAuth(projRoot2, true);

        expect(idpsRes3.Providers.length).toEqual(4);
        expect(authCfnTemplate.Resources.HostedUICustomResource?.Properties?.Code?.ZipFile).toBeUndefined();
      } finally {
        deleteProjectDir(projRoot2);
      }
    });
  });

  describe('...updating auth without hosted UI and providers', () => {
    it('...creates user pool domain and idps, and does not create lambdas', async () => {
      await initJSProjectWithProfile(projRoot1, { name: 'authTest', disableAmplifyAppCreation: false });
      await addAuthWithDefault(projRoot1);
      await amplifyPushAuth(projRoot1);

      const meta = getProjectMeta(projRoot1);
      const appId = getAppId(projRoot1);
      const region = meta.providers.awscloudformation.Region;
      const authName = Object.keys(meta.auth).find((authProvider) => meta.auth[authProvider]?.service === 'Cognito');
      const output1 = meta.auth[authName].output;
      const userPoolRes1 = await getUserPool(output1.UserPoolId, region);
      const idpsRes1 = await listSocialIdpProviders(output1.UserPoolId, region);

      expect(output1.HostedUIDomain).not.toBeDefined();
      expect(userPoolRes1.UserPool.Domain).not.toBeDefined();
      expect(idpsRes1.Providers.length).toEqual(0);

      const projRoot2 = await createNewProjectDir('authMigration2');

      try {
        let oauthUpdateSettings = {
          ...oauthSettings,
          updateSigninUrl: 'https://example.url/',
          updateSignoutUrl: 'https://example.url/',
          testingWithLatestCodebase: true,
        };

        await amplifyPull(projRoot2, { emptyDir: true, appId }, true);
        await updateAuthToAddSignInSignOutUrlAfterPull(projRoot2, oauthUpdateSettings);

        const authCfnTemplatePath = getResourceCfnTemplatePath(projRoot2, 'auth', authName);
        let authCfnTemplate: Template | undefined = readJson(authCfnTemplatePath, { throwIfNotExist: false });

        expect(authCfnTemplate?.Resources?.HostedUICustomResource).toBeUndefined();
        expect(authCfnTemplate?.Resources?.hostedUIProvidersCustomResource).toBeUndefined();

        await amplifyPushAuth(projRoot2, true);

        const meta2 = getProjectMeta(projRoot2);
        const output2 = meta2.auth[authName].output;
        const userPoolRes2 = await getUserPool(output2.UserPoolId, region);
        const idpsRes2 = await listSocialIdpProviders(output2.UserPoolId, region);
        authCfnTemplate = readJson(authCfnTemplatePath, { throwIfNotExist: false });

        expect(userPoolRes2.UserPool.Domain).toBeDefined();
        expect(userPoolRes2.UserPool.Domain).toEqual(output2.HostedUIDomain);
        expect(idpsRes2.Providers.length).toEqual(4);
        expect(authCfnTemplate?.Resources?.HostedUICustomResource).toBeUndefined();
        expect(authCfnTemplate?.Resources?.hostedUIProvidersCustomResource).toBeUndefined();
      } finally {
        deleteProjectDir(projRoot2);
      }
    });
  });
});
