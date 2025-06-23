import {
  addAuthWithDefault,
  addAuthWithGroups,
  amplifyPushAuth,
  amplifyPushNonInteractive,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getIdentityPoolRoles,
  getProjectMeta,
  initJSProjectWithProfile,
  updateAuthAddUserGroups,
  updateHeadlessAuth,
} from '@aws-amplify/amplify-e2e-core';
import { UpdateAuthRequest } from 'amplify-headless-interface';

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

  describe('...amplify add auth', () => {
    describe('...creating with a user pool group', () => {
      it('...assigns authenticated roles for users added to user group', async () => {
        await initJSProjectWithProfile(projRoot, defaultsSettings);
        await addAuthWithGroups(projRoot);
        await amplifyPushAuth(projRoot);

        const meta = getProjectMeta(projRoot);
        const region = meta.providers.awscloudformation.Region;
        const { AppClientID, AppClientIDWeb, IdentityPoolId, UserPoolId } = Object.keys(meta.auth)
          .map((key) => meta.auth[key])
          .find((auth) => auth.service === 'Cognito').output;

        const identityPoolRoles = await getIdentityPoolRoles(IdentityPoolId);
        const roleMapKeyClientId = `cognito-idp.${region}.amazonaws.com/${UserPoolId}:${AppClientID}`;
        const roleMapKeyWebClientId = `cognito-idp.${region}.amazonaws.com/${UserPoolId}:${AppClientIDWeb}`;

        expect(identityPoolRoles.RoleMappings[roleMapKeyClientId].AmbiguousRoleResolution).toEqual('AuthenticatedRole');
        expect(identityPoolRoles.RoleMappings[roleMapKeyClientId].Type).toEqual('Token');
        expect(identityPoolRoles.RoleMappings[roleMapKeyWebClientId].AmbiguousRoleResolution).toEqual('AuthenticatedRole');
        expect(identityPoolRoles.RoleMappings[roleMapKeyWebClientId].Type).toEqual('Token');
      });
    });
  });

  describe('...amplify update auth', () => {
    describe('...updating to add a user pool group', () => {
      it('...assigns authenticated roles for users added to user group', async () => {
        await initJSProjectWithProfile(projRoot, defaultsSettings);
        await addAuthWithDefault(projRoot);
        await amplifyPushAuth(projRoot);

        await updateAuthAddUserGroups(projRoot, ['mygroup']);
        await amplifyPushAuth(projRoot);

        const meta = getProjectMeta(projRoot);
        const region = meta.providers.awscloudformation.Region;
        const { AppClientID, AppClientIDWeb, IdentityPoolId, UserPoolId } = Object.keys(meta.auth)
          .map((key) => meta.auth[key])
          .find((auth) => auth.service === 'Cognito').output;

        const identityPoolRoles = await getIdentityPoolRoles(IdentityPoolId);
        const roleMapKeyClientId = `cognito-idp.${region}.amazonaws.com/${UserPoolId}:${AppClientID}`;
        const roleMapKeyWebClientId = `cognito-idp.${region}.amazonaws.com/${UserPoolId}:${AppClientIDWeb}`;

        expect(identityPoolRoles.RoleMappings[roleMapKeyClientId].AmbiguousRoleResolution).toEqual('AuthenticatedRole');
        expect(identityPoolRoles.RoleMappings[roleMapKeyClientId].Type).toEqual('Token');
        expect(identityPoolRoles.RoleMappings[roleMapKeyWebClientId].AmbiguousRoleResolution).toEqual('AuthenticatedRole');
        expect(identityPoolRoles.RoleMappings[roleMapKeyWebClientId].Type).toEqual('Token');
      });
    });

    describe('...updating to add a user pool group after create', () => {
      it('...assigns authenticated roles for users added to user group', async () => {
        await initJSProjectWithProfile(projRoot, defaultsSettings);
        await addAuthWithDefault(projRoot);
        await updateAuthAddUserGroups(projRoot, ['mygroup']);
        await amplifyPushAuth(projRoot);

        const meta = getProjectMeta(projRoot);
        const region = meta.providers.awscloudformation.Region;
        const { AppClientID, AppClientIDWeb, IdentityPoolId, UserPoolId } = Object.keys(meta.auth)
          .map((key) => meta.auth[key])
          .find((auth) => auth.service === 'Cognito').output;

        const identityPoolRoles = await getIdentityPoolRoles(IdentityPoolId);
        const roleMapKeyClientId = `cognito-idp.${region}.amazonaws.com/${UserPoolId}:${AppClientID}`;
        const roleMapKeyWebClientId = `cognito-idp.${region}.amazonaws.com/${UserPoolId}:${AppClientIDWeb}`;

        expect(identityPoolRoles.RoleMappings[roleMapKeyClientId].AmbiguousRoleResolution).toEqual('AuthenticatedRole');
        expect(identityPoolRoles.RoleMappings[roleMapKeyClientId].Type).toEqual('Token');
        expect(identityPoolRoles.RoleMappings[roleMapKeyWebClientId].AmbiguousRoleResolution).toEqual('AuthenticatedRole');
        expect(identityPoolRoles.RoleMappings[roleMapKeyWebClientId].Type).toEqual('Token');
      });
    });

    describe('...updating headless to add a user pool group', () => {
      it('...assigns authenticated roles for users added to user group', async () => {
        await initJSProjectWithProfile(projRoot, defaultsSettings);
        await addAuthWithDefault(projRoot);
        await amplifyPushNonInteractive(projRoot);
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
                  groupName: 'Admins',
                },
                {
                  groupName: 'Users',
                },
              ],
            },
            includeIdentityPool: true,
            identityPoolModification: {},
          },
        };

        await updateHeadlessAuth(projRoot, updateAuthRequest);
        await amplifyPushNonInteractive(projRoot);

        const meta = getProjectMeta(projRoot);
        const region = meta.providers.awscloudformation.Region;
        const { AppClientID, AppClientIDWeb, IdentityPoolId, UserPoolId } = Object.keys(meta.auth)
          .map((key) => meta.auth[key])
          .find((auth) => auth.service === 'Cognito').output;

        const identityPoolRoles = await getIdentityPoolRoles(IdentityPoolId);
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
