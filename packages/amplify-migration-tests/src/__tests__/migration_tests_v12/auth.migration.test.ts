import {
  addAuthWithGroups,
  amplifyPull,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  getIdentityPoolRoles,
  getProjectMeta,
  initJSProjectWithProfile,
  updateAuthAddUserGroupsAfterPull,
} from '@aws-amplify/amplify-e2e-core';
import { versionCheck, allowedVersionsToMigrateFrom } from '../../migration-helpers';

describe('v12: amplify migration test auth', () => {
  let projRoot1: string;

  beforeAll(async () => {
    const migrateFromVersion = { v: '12.0.3' };
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

  describe('...uses user groups and role mappings', () => {
    it('...maintains correct role mapping when updated with latest version', async () => {
      await initJSProjectWithProfile(projRoot1, {
        name: 'authTest',
        disableAmplifyAppCreation: false,
        includeGen2RecommendationPrompt: false,
      });
      await addAuthWithGroups(projRoot1);
      await amplifyPushAuth(projRoot1);

      const meta = getProjectMeta(projRoot1);
      const region = meta.providers.awscloudformation.Region;
      const { AppClientID, AppClientIDWeb, IdentityPoolId, UserPoolId } = Object.keys(meta.auth)
        .map((key) => meta.auth[key])
        .find((auth) => auth.service === 'Cognito').output;

      const roleMapKeyClientId = `cognito-idp.${region}.amazonaws.com/${UserPoolId}:${AppClientID}`;
      const roleMapKeyWebClientId = `cognito-idp.${region}.amazonaws.com/${UserPoolId}:${AppClientIDWeb}`;
      const appId = getAppId(projRoot1);
      const projRoot2 = await createNewProjectDir('authMigration2');

      expect(appId).toBeDefined();

      const identityPoolRolesBefore = await getIdentityPoolRoles(IdentityPoolId, region);
      const roleMapKeyClientIdAmbigousRoleRes = identityPoolRolesBefore.RoleMappings[roleMapKeyClientId].AmbiguousRoleResolution;
      const roleMapKeyClientIdType = identityPoolRolesBefore.RoleMappings[roleMapKeyClientId].Type;
      const roleMapKeyWebClientIdAmbigousRoleRes = identityPoolRolesBefore.RoleMappings[roleMapKeyWebClientId].AmbiguousRoleResolution;
      const roleMapKeyWebClientIdType = identityPoolRolesBefore.RoleMappings[roleMapKeyWebClientId].Type;

      try {
        await amplifyPull(projRoot2, { emptyDir: true, appId }, true);
        await updateAuthAddUserGroupsAfterPull(projRoot2, ['SuperUsers'], { testingWithLatestCodebase: true });
        await amplifyPushAuth(projRoot2, true);

        const identityPoolRolesAfter = await getIdentityPoolRoles(IdentityPoolId, region);

        expect(identityPoolRolesAfter.RoleMappings[roleMapKeyClientId].AmbiguousRoleResolution).toEqual(roleMapKeyClientIdAmbigousRoleRes);
        expect(identityPoolRolesAfter.RoleMappings[roleMapKeyClientId].Type).toEqual(roleMapKeyClientIdType);
        expect(identityPoolRolesAfter.RoleMappings[roleMapKeyWebClientId].AmbiguousRoleResolution).toEqual(
          roleMapKeyWebClientIdAmbigousRoleRes,
        );
        expect(identityPoolRolesAfter.RoleMappings[roleMapKeyWebClientId].Type).toEqual(roleMapKeyWebClientIdType);

        expect(identityPoolRolesAfter.RoleMappings[roleMapKeyClientId].AmbiguousRoleResolution).toEqual('AuthenticatedRole');
        expect(identityPoolRolesAfter.RoleMappings[roleMapKeyClientId].Type).toEqual('Token');
        expect(identityPoolRolesAfter.RoleMappings[roleMapKeyWebClientId].AmbiguousRoleResolution).toEqual('AuthenticatedRole');
        expect(identityPoolRolesAfter.RoleMappings[roleMapKeyWebClientId].Type).toEqual('Token');
      } finally {
        deleteProjectDir(projRoot2);
      }
    });
  });
});
