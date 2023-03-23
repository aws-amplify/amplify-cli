import {
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
  updateAuthSignInSignOutUrlAfterPull,
  addAuthWithDefault,
} from '@aws-amplify/amplify-e2e-core';
import { versionCheck, allowedVersionsToMigrateFrom } from '../../migration-helpers';
import { JSONUtilities, pathManager } from '@aws-amplify/amplify-cli-core';
import Template from 'cloudform-types/types/template';

const oauthSettings = {
  signinUrl: 'https://danielle.lol/',
  signoutUrl: 'https://danielle.lol/',
};

const { getResourceCfnTemplatePath, getBackendDirPath } = pathManager;
const { readJson } = JSONUtilities;

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
      const authName = Object.keys(meta.auth).find((authProvider) => meta.auth[authProvider]?.service === 'Cognito');
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
        await updateAuthSignInSignOutUrlAfterPull(projRoot2, oauthUpdateSettings);
        await amplifyPushAuth(projRoot2, true);

        const userPoolRes2 = await getUserPool(UserPoolId, region);
        const authCfnTemplatePath = getResourceCfnTemplatePath(getBackendDirPath(), 'auth', authName);
        let authCfnTemplate: Template | undefined = readJson(authCfnTemplatePath, { throwIfNotExist: false });

        expect(userPoolRes1.UserPool.Domain).toEqual(userPoolRes2.UserPool.Domain);

        expect(authCfnTemplate.Resources.HostedUICustomResource.Properties.Code.ZipFile).toEqual(`const response = require('cfn-response');
const aws = require('aws-sdk');
const identity = new aws.CognitoIdentityServiceProvider();
exports.handler = (event, context, callback) => {
  const userPoolId = event.ResourceProperties.userPoolId;
  const inputDomainName = event.ResourceProperties.hostedUIDomainName;

  let deleteUserPoolDomain = (domainName) => {
    let params = { Domain: domainName, UserPoolId: userPoolId };
    return identity.deleteUserPoolDomain(params).promise();
  };

  deleteUserPoolDomain(inputDomainName)
    .then(() => {
      response.send(event, context, response.SUCCESS, {});
    })
    .catch((err) => {
      console.log(err);
      response.send(event, context, response.FAILED, { err });
    });
};`);

        oauthUpdateSettings = {
          ...oauthUpdateSettings,
          signinUrl: 'https://example.url/',
          signoutUrl: 'https://example.url/',
          updateSigninUrl: 'https://example.url/',
          updateSignoutUrl: 'https://example.url/',
          testingWithLatestCodebase: true,
        };

        await updateAuthSignInSignOutUrlAfterPull(projRoot2, oauthUpdateSettings);
        await amplifyPushAuth(projRoot2, true);

        const userPoolRes3 = await getUserPool(UserPoolId, region);
        authCfnTemplate = readJson(authCfnTemplatePath, { throwIfNotExist: false });

        expect(userPoolRes1.UserPool.Domain).toEqual(userPoolRes3.UserPool.Domain);
        expect(authCfnTemplate.Resources.HostedUICustomResource).toBeUndefined();
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
        await updateAuthSignInSignOutUrlAfterPull(projRoot2, oauthUpdateSettings);
        await amplifyPushAuth(projRoot2, true);

        const userPoolRes2 = await getUserPool(UserPoolId, region);
        const authName = Object.keys(meta.auth).find((authProvider) => meta.auth[authProvider]?.service === 'Cognito');
        const authCfnTemplatePath = getResourceCfnTemplatePath(getBackendDirPath(), 'auth', authName);
        const authCfnTemplate: Template | undefined = readJson(authCfnTemplatePath, { throwIfNotExist: false });

        expect(userPoolRes1.UserPool.Domain).toEqual(userPoolRes2.UserPool.Domain);
        expect(authCfnTemplate.Resources.HostedUICustomResource).toBeUndefined();
      } finally {
        deleteProjectDir(projRoot2);
      }
    });
  });
});
