import { allowedVersionsToMigrateFrom, versionCheck } from '../../migration-helpers';
import {
  addAuthUserPoolOnlyWithOAuth,
  AddAuthUserPoolOnlyWithOAuthSettings,
  amplifyPushAuth,
  amplifyPushNonInteractive,
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
  tryScheduleCredentialRefresh,
  updateAuthDomainPrefixWithAllProvidersConfigured,
  updateHeadlessAuth,
} from '@aws-amplify/amplify-e2e-core';
import { initJSProjectWithProfileV12 } from '../../migration-helpers-v12/init';
import { UpdateAuthRequest } from 'amplify-headless-interface';

describe('amplify auth hosted ui', () => {
  beforeAll(async () => {
    tryScheduleCredentialRefresh();

    const migrateFromVersion = { v: '12.0.3' };
    const migrateToVersion = { v: 'uninitialized' };

    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);

    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
  });

  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('hostedUIMigration');
  });

  afterEach(async () => {
    await deleteProject(projRoot, null, true);
    deleteProjectDir(projRoot);
  });

  describe('project with hosted ui created by old version', () => {
    let oauthSettings: AddAuthUserPoolOnlyWithOAuthSettings;
    let originalUserPoolId: string;
    let originalHostedUIDomain: string;
    let region: string;
    beforeEach(async () => {
      oauthSettings = createUserPoolOnlyWithOAuthSettings('hui', generateRandomShortId());
      await initJSProjectWithProfileV12(projRoot);
      await addAuthUserPoolOnlyWithOAuth(projRoot, oauthSettings);
      await amplifyPushAuth(projRoot);
      originalUserPoolId = getUserPoolId(projRoot);
      originalHostedUIDomain = getHostedUIDomain(projRoot);
      const meta = getProjectMeta(projRoot);
      region = meta.providers.awscloudformation.Region;
      expect(originalHostedUIDomain).toMatch(oauthSettings.domainPrefix);
    });

    it('updates hosted ui domain headless with new version and pushes', async () => {
      const updatedDomainPrefix = `new-prefix-${generateRandomShortId()}`;
      const updateAuthRequest: UpdateAuthRequest = {
        version: 2,
        serviceModification: {
          serviceName: 'Cognito',
          userPoolModification: {
            autoVerifiedAttributes: [
              {
                type: 'EMAIL',
              },
            ],
            userPoolGroups: [
              {
                groupName: 'group1',
              },
              {
                groupName: 'group2',
              },
            ],
            oAuth: {
              domainPrefix: updatedDomainPrefix,
            },
          },
          includeIdentityPool: false,
        },
      };

      await updateHeadlessAuth(projRoot, updateAuthRequest, { testingWithLatestCodebase: true });
      await amplifyPushNonInteractive(projRoot, true);

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
      expect(originalDomainRes).toEqual({ DomainDescription: {} });

      const deleteOriginalDomainRes = await deleteUserPoolDomain(originalHostedUIDomain, userPoolId, region);
      // undefined response as it throws InvalidParameterException: No such domain or user pool exists.
      expect(deleteOriginalDomainRes).toBeUndefined();
    });

    it('updates hosted ui domain with new version and pushes', async () => {
      const updatedDomainPrefix = `new-prefix-${generateRandomShortId()}`;
      await updateAuthDomainPrefixWithAllProvidersConfigured(projRoot, {
        domainPrefix: updatedDomainPrefix,
        testingWithLatestCodebase: true,
      });
      await amplifyPushAuth(projRoot, true);

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
      expect(originalDomainRes).toEqual({ DomainDescription: {} });

      const deleteOriginalDomainRes = await deleteUserPoolDomain(originalHostedUIDomain, userPoolId, region);
      // undefined response as it throws InvalidParameterException: No such domain or user pool exists.
      expect(deleteOriginalDomainRes).toBeUndefined();
    });
  });
});
