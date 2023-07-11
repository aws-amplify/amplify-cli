import {
  addAuthWithMaxOptions,
  amplifyPull,
  amplifyPushAuth,
  amplifyPushForce,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  deleteSocialIdpProviders,
  deleteUserPoolDomain,
  getAppId,
  getProjectMeta,
  getUserPool,
  listSocialIdpProviders,
} from '@aws-amplify/amplify-e2e-core';
import { allowedVersionsToMigrateFrom, versionCheck } from '../../migration-helpers';
import { initJSProjectWithProfileV12 } from '../../migration-helpers-v12/init';

describe('amplify migration test auth', () => {
  let projRoot1: string;

  beforeAll(async () => {
    const migrateFromVersion = { v: 'uninitialized' };
    const migrateToVersion = { v: 'uninitialized' };
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
    console.log(`Test migration from: ${migrateFromVersion.v} to ${migrateToVersion.v}`);
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
  });

  beforeEach(async () => {
    projRoot1 = await createNewProjectDir('authMigration1');
  });

  afterEach(async () => {
    await deleteProject(projRoot1, null, true);
    deleteProjectDir(projRoot1);
  });

  it('should pass if the resources created by the Lambda callouts are deleted and trying to recreate resources with CFN code', async () => {
    await initJSProjectWithProfileV12(projRoot1, { name: 'authTest', disableAmplifyAppCreation: false });

    await addAuthWithMaxOptions(projRoot1, {});
    await amplifyPushAuth(projRoot1);

    const appId = getAppId(projRoot1);
    expect(appId).toBeDefined();
    const projRoot2 = await createNewProjectDir('authMigration2');

    try {
      await amplifyPull(projRoot2, { emptyDir: true, appId }, true);
      const meta = getProjectMeta(projRoot1);
      const region = meta.providers.awscloudformation.Region;
      const { HostedUIDomain, UserPoolId } = Object.keys(meta.auth)
        .map((key) => meta.auth[key])
        .find((auth) => auth.service === 'Cognito').output;
      const userPoolRes1 = await getUserPool(UserPoolId, region);
      const userPoolDomainV12 = userPoolRes1.UserPool.Domain;
      const socialIdpProvidersV12 = await listSocialIdpProviders(UserPoolId, region);

      // delete domain manually
      await deleteUserPoolDomain(HostedUIDomain, UserPoolId, region);
      // delete providers manually
      const socialProviders = ['Facebook', 'Google', 'LoginWithAmazon', 'SignInWithApple'];
      await deleteSocialIdpProviders(socialProviders, UserPoolId, region);
      await amplifyPushForce(projRoot2, true);
      const userPoolRes2 = await getUserPool(UserPoolId, region);
      const userPoolDomainLatest = userPoolRes2.UserPool.Domain;
      const socialIdpProvidersLatest = await listSocialIdpProviders(UserPoolId, region);
      // check same domain should exist
      expect(userPoolDomainV12).toEqual(userPoolDomainLatest);
      // check the Social Idp Provider exists
      expect(socialIdpProvidersV12).toMatchObject(socialIdpProvidersLatest);
    } finally {
      deleteProjectDir(projRoot2);
    }
  });
});
