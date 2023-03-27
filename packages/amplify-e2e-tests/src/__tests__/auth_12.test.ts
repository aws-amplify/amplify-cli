/* eslint-disable spellcheck/spell-checker */
import {
  amplifyPushAuth,
  amplifyStudioHeadlessPull,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  headlessAuthImport,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import { ImportAuthRequest } from 'amplify-headless-interface';
import {
  expectAuthProjectDetailsMatch,
  expectLocalAndCloudMetaFilesMatching,
  expectLocalTeamInfoHasNoCategories,
  expectNoAuthInMeta,
  getAuthProjectDetails,
  removeImportedAuthHeadless,
  setupOgProjectWithAuth,
} from '../import-helpers';

const profileName = 'amplify-integ-test-user';

const PROJECT_NAME = 'authTest';
const defaultsSettings = {
  name: PROJECT_NAME,
  disableAmplifyAppCreation: false,
};

describe('import cases when userPool is deleted', () => {
  let projRoot: string;
  let projRoot2: string;
  let ogProjectSettings;
  let ogProjectRoot: string;

  beforeEach(async () => {
    const ogProjectPrefix1 = 'ogauimphea';
    ogProjectSettings = {
      name: ogProjectPrefix1,
      disableAmplifyAppCreation: false,
    };
    ogProjectRoot = await createNewProjectDir(ogProjectSettings.name);
    await initJSProjectWithProfile(ogProjectRoot, ogProjectSettings);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
    deleteProjectDir(projRoot2);
  });

  it('check headless case if imported userPool is deleted', async () => {
    // create original auth with amplify
    const ogProjectDetails = await setupOgProjectWithAuth(ogProjectRoot, ogProjectSettings, false);
    const importAuthRequest: ImportAuthRequest = {
      version: 1,
      userPoolId: ogProjectDetails.meta.UserPoolId,
      nativeClientId: ogProjectDetails.meta.AppClientID,
      webClientId: ogProjectDetails.meta.AppClientIDWeb,
    };
    // create another app whch import previous app userpool
    projRoot = await createNewProjectDir('auth-import-delete');
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await headlessAuthImport(projRoot, importAuthRequest);
    await amplifyPushAuth(projRoot);

    const projectDetails = getAuthProjectDetails(projRoot);
    expectAuthProjectDetailsMatch(projectDetails, ogProjectDetails);
    expectLocalAndCloudMetaFilesMatching(projRoot);
    // deleting App and userPool
    await deleteProject(ogProjectRoot);
    deleteProjectDir(ogProjectRoot);
    // this block simulates studio behavior of unlinking user pool ( headless pull -> amplify remove auth -yes -> amplify push)
    const ogProjectPrefix2 = 'removeuserPool2';
    ogProjectSettings = {
      name: ogProjectPrefix2,
    };
    projRoot2 = await createNewProjectDir(ogProjectSettings.name);
    const appId = getAppId(projRoot);
    // should succeed and removes auth from local state
    await amplifyStudioHeadlessPull(projRoot2, {
      appId,
      envName: 'integtest',
      profileName,
      useDevCLI: true,
    });
    // should succeed
    await removeImportedAuthHeadless(projRoot2);
    await amplifyPushAuth(projRoot2);
    expectNoAuthInMeta(projRoot2);
    expectLocalTeamInfoHasNoCategories(projRoot2);
  });
});
