import {
  AddAuthIdentityPoolAndUserPoolWithOAuthSettings,
  addAuthIdentityPoolAndUserPoolWithOAuth,
  amplifyPushAuth,
  amplifyStatus,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  initJSProjectWithProfile,
  addS3StorageWithSettings,
} from '@aws-amplify/amplify-e2e-core';
import {
  createIDPAndUserPoolWithOAuthSettings,
  expectAuthLocalAndOGMetaFilesOutputMatching,
  expectLocalAndCloudMetaFilesMatching,
  expectLocalAndPulledBackendConfigMatching,
  getAuthProjectDetails,
  getShortId,
  headlessPull,
  importIdentityPoolAndUserPool,
} from '../import-helpers';

const profileName = 'amplify-integ-test-user';

describe('auth import identity pool and userpool', () => {
  const projectPrefix = 'auimpidup';
  const ogProjectPrefix = 'ogauimpidup';

  const projectSettings = {
    name: projectPrefix,
  };

  const ogProjectSettings = {
    name: ogProjectPrefix,
  };

  const dummyOGProjectSettings = {
    name: 'dummyog2',
  };

  // OG is the CLI project that creates the user pool to import by other test projects
  let ogProjectRoot: string;
  let ogShortId: string;
  let ogSettings: AddAuthIdentityPoolAndUserPoolWithOAuthSettings;

  // We need an extra OG project to make sure that autocomplete prompt hits in
  let dummyOGProjectRoot: string;
  let dummyOGSettings: AddAuthIdentityPoolAndUserPoolWithOAuthSettings;

  let projectRoot: string;
  let ignoreProjectDeleteErrors: boolean = false;

  beforeAll(async () => {
    ogProjectRoot = await createNewProjectDir(ogProjectSettings.name);
    ogShortId = getShortId();
    ogSettings = createIDPAndUserPoolWithOAuthSettings(ogProjectSettings.name, ogShortId);

    await initJSProjectWithProfile(ogProjectRoot, ogProjectSettings);
    await addAuthIdentityPoolAndUserPoolWithOAuth(ogProjectRoot, ogSettings);
    await amplifyPushAuth(ogProjectRoot);

    dummyOGProjectRoot = await createNewProjectDir(dummyOGProjectSettings.name);
    dummyOGSettings = createIDPAndUserPoolWithOAuthSettings(dummyOGProjectSettings.name, ogShortId);

    await initJSProjectWithProfile(dummyOGProjectRoot, dummyOGProjectSettings);
    await addAuthIdentityPoolAndUserPoolWithOAuth(dummyOGProjectRoot, dummyOGSettings);
    await amplifyPushAuth(dummyOGProjectRoot);
  });

  afterAll(async () => {
    await deleteProject(ogProjectRoot);
    deleteProjectDir(ogProjectRoot);

    await deleteProject(dummyOGProjectRoot);
    deleteProjectDir(dummyOGProjectRoot);
  });

  beforeEach(async () => {
    projectRoot = await createNewProjectDir(projectPrefix);
    ignoreProjectDeleteErrors = false;
  });

  afterEach(async () => {
    try {
      await deleteProject(projectRoot);
    } catch (error) {
      // In some tests where project initialization fails it can lead to errors on cleanup which we
      // can ignore if set by the test
      if (!ignoreProjectDeleteErrors) {
        throw error;
      }
    }

    deleteProjectDir(projectRoot);
  });

  it('auth headless pull successful', async () => {
    await initJSProjectWithProfile(projectRoot, {
      ...projectSettings,
      disableAmplifyAppCreation: false,
    });

    await importIdentityPoolAndUserPool(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' });

    await amplifyPushAuth(projectRoot);

    const projectDetails = getAuthProjectDetails(projectRoot);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    let projectRootPull;

    try {
      projectRootPull = await createNewProjectDir('authidp-pull');

      const envName = 'integtest';
      const providersParam = {
        awscloudformation: {
          configLevel: 'project',
          useProfile: true,
          profileName,
        },
      };

      const categoryConfig = {
        auth: {
          userPoolId: projectDetails.team.userPoolId,
          webClientId: projectDetails.team.webClientId,
          nativeClientId: projectDetails.team.nativeClientId,
          identityPoolId: projectDetails.team.identityPoolId,
        },
      };

      await headlessPull(projectRootPull, { envName, appId }, providersParam, categoryConfig);

      await amplifyStatus(projectRoot, 'No Change');

      expectLocalAndCloudMetaFilesMatching(projectRoot);
      expectLocalAndPulledBackendConfigMatching(projectRoot, projectRootPull);
      expectAuthLocalAndOGMetaFilesOutputMatching(projectRoot, projectRootPull);
    } finally {
      deleteProjectDir(projectRootPull);
    }
  });

  it('auth import, storage auth/guest access, push successful', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await importIdentityPoolAndUserPool(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' });
    await addS3StorageWithSettings(projectRoot, {});
    await amplifyPushAuth(projectRoot);

    await amplifyStatus(projectRoot, 'No Change');
  });
});
