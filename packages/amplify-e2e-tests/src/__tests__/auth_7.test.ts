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
