import {
  addAuthWithDefault,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getIdentityPoolRoles,
  getProjectMeta,
  getUserPool,
  initJSProjectWithProfile,
  updateAuthAddUserGroups,
} from '@aws-amplify/amplify-e2e-core';

const defaultsSettings = {
  name: 'authTest',
};

describe('user group tests', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  describe('... amplify add auth', () => {
    describe('... adding a user pool group', () => {
      it('... assigns authenticated roles for users added to user group', async () => {
        await initJSProjectWithProfile(projRoot, defaultsSettings);
        await addAuthWithDefault(projRoot);
        await updateAuthAddUserGroups(projRoot, ['mygroup']);
        await amplifyPushAuth(projRoot);

        const meta = getProjectMeta(projRoot);
        const region = meta.providers.awscloudformation.Region;
        const {
          AppClientID,
          AppClientIDWeb,
          IdentityPoolId,
          UserPoolId,
        } = Object.keys(meta.auth).map((key) => meta.auth[key])[0].output;

        const identityPoolRoles = await getIdentityPoolRoles(IdentityPoolId, region);
        const roleMapKeyClientId = `cognito-idp.${region}.amazonaws.com/${UserPoolId}:${AppClientID}`;
        const roleMapKeyWebClientId = `cognito-idp.${region}.amazonaws.com/${UserPoolId}:${AppClientIDWeb}`;

        expect(identityPoolRoles.RoleMappings[roleMapKeyClientId].AmbiguousRoleResolution).toEqual('AuthenticatedRole');
        expect(identityPoolRoles.RoleMappings[roleMapKeyClientId].Type).toEqual('Token');
        expect(identityPoolRoles.RoleMappings[roleMapKeyWebClientId].AmbiguousRoleResolution).toEqual('AuthenticatedRole');
        expect(identityPoolRoles.RoleMappings[roleMapKeyWebClientId].Type).toEqual('Token');
      });
    });
  });
});
