import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  addHeadlessAuth,
  updateHeadlessAuth,
  removeHeadlessAuth,
  getCloudBackendConfig,
  headlessAuthImport,
} from 'amplify-e2e-core';
import { addAuthWithDefault, getBackendAmplifyMeta } from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, getUserPool } from 'amplify-e2e-core';
import {
  AddAuthRequest,
  CognitoUserPoolSigninMethod,
  CognitoUserProperty,
  ImportAuthRequest,
  UpdateAuthRequest,
} from 'amplify-headless-interface';
import _ from 'lodash';
import {
  expectAuthProjectDetailsMatch,
  expectLocalAndCloudMetaFilesMatching,
  expectLocalTeamInfoHasNoCategories,
  expectNoAuthInMeta,
  getAuthProjectDetails,
  removeImportedAuthWithDefault,
  setupOgProjectWithAuth,
} from '../import-helpers';

const PROJECT_NAME = 'authTest';
const defaultsSettings = {
  name: PROJECT_NAME,
};

describe('headless auth', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth-update');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });
  it('adds auth resource', async () => {
    const addAuthRequest: AddAuthRequest = {
      version: 1,
      resourceName: 'myAuthResource',
      serviceConfiguration: {
        serviceName: 'Cognito',
        includeIdentityPool: false,
        userPoolConfiguration: {
          requiredSignupAttributes: [CognitoUserProperty.EMAIL, CognitoUserProperty.PHONE_NUMBER],
          signinMethod: CognitoUserPoolSigninMethod.USERNAME,
        },
      },
    };

    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addHeadlessAuth(projRoot, addAuthRequest);
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();
  });

  it('updates existing auth resource', async () => {
    const updateAuthRequest: UpdateAuthRequest = {
      version: 1,
      serviceModification: {
        serviceName: 'Cognito',
        userPoolModification: {
          userPoolGroups: [
            {
              groupName: 'group1',
            },
            {
              groupName: 'group2',
            },
          ],
        },
        includeIdentityPool: true,
        identityPoolModification: {
          unauthenticatedLogin: true,
        },
      },
    };

    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot, {});
    await updateHeadlessAuth(projRoot, updateAuthRequest);
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();
    expect(_.get(meta, ['auth', 'userPoolGroups'])).toBeDefined();
  });

  it('removes auth resource', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot, {});
    await amplifyPushAuth(projRoot);
    const { auth: authBefore } = getBackendAmplifyMeta(projRoot);
    const authResourceName = _.keys(authBefore).find(() => true); // first element or undefined
    expect(authResourceName).toBeDefined();
    const { auth: authBackendConfigBefore } = getCloudBackendConfig(projRoot);
    expect(_.isEmpty(authBackendConfigBefore)).toBe(false);
    await removeHeadlessAuth(projRoot, authResourceName);
    await amplifyPushAuth(projRoot);
    const { auth: authAfter } = getBackendAmplifyMeta(projRoot);
    expect(_.isEmpty(authAfter)).toBe(true);
    const { auth: authBackendConfigAfter } = getCloudBackendConfig(projRoot);
    expect(_.isEmpty(authBackendConfigAfter)).toBe(true);
  });

  describe(' import', () => {
    let ogProjectSettings: {name: string};
    let ogProjectRoot: string;

    beforeEach(async () => {
      const ogProjectPrefix = 'ogauimphea';
      ogProjectSettings = {
        name: ogProjectPrefix,
      };
      ogProjectRoot = await createNewProjectDir(ogProjectSettings.name);
      await initJSProjectWithProfile(ogProjectRoot, ogProjectSettings);
    });

    afterEach(async () => {
      await deleteProject(ogProjectRoot);
      deleteProjectDir(ogProjectRoot);
    });

    test.each([
      ['userpool only', false],
      ['userpool with identitypool', true],
    ])(' cognito userpool %s', async (_: string, withIdentityPool: boolean) => {
      const ogProjectDetails = await setupOgProjectWithAuth(ogProjectRoot, ogProjectSettings, withIdentityPool);

      const importAuthRequest: ImportAuthRequest = {
        version: 1,
        userPoolId: ogProjectDetails.meta.UserPoolId,
        nativeClientId: ogProjectDetails.meta.AppClientID,
        webClientId: ogProjectDetails.meta.AppClientIDWeb,
      };
      if (withIdentityPool) {
        importAuthRequest.identityPoolId = ogProjectDetails.meta.IdentityPoolId;
      }

      await initJSProjectWithProfile(projRoot, defaultsSettings);
      await headlessAuthImport(projRoot, importAuthRequest);
      await amplifyPushAuth(projRoot);

      let projectDetails = getAuthProjectDetails(projRoot);
      expectAuthProjectDetailsMatch(projectDetails, ogProjectDetails);
      expectLocalAndCloudMetaFilesMatching(projRoot);

      await removeImportedAuthWithDefault(projRoot);
      await amplifyPushAuth(projRoot);

      expectNoAuthInMeta(projRoot);
      expectLocalTeamInfoHasNoCategories(projRoot);
    });
  });
});
