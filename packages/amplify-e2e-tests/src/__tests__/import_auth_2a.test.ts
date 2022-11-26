import {
  AddAuthIdentityPoolAndUserPoolWithOAuthSettings,
  addAuthIdentityPoolAndUserPoolWithOAuth,
  amplifyPull,
  amplifyPushAuth,
  amplifyStatus,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import {
  AuthProjectDetails,
  createIDPAndUserPoolWithOAuthSettings,
  expectAuthLocalAndOGMetaFilesOutputMatching,
  expectAuthProjectDetailsMatch,
  expectLocalAndCloudMetaFilesMatching,
  expectLocalAndPulledBackendConfigMatching,
  getAuthProjectDetails,
  getOGAuthProjectDetails,
  getShortId,
  headlessPullExpectError,
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
  let ogProjectDetails: AuthProjectDetails;

  // We need an extra OG project to make sure that autocomplete prompt hits in
  let dummyOGProjectRoot: string;
  let dummyOGShortId: string;
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

    ogProjectDetails = getOGAuthProjectDetails(ogProjectRoot);

    dummyOGProjectRoot = await createNewProjectDir(dummyOGProjectSettings.name);
    dummyOGShortId = getShortId();
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

  it('auth import identitypool and userpool', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await importIdentityPoolAndUserPool(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' });

    let projectDetails = getAuthProjectDetails(projectRoot);

    expectAuthProjectDetailsMatch(projectDetails, ogProjectDetails);

    await amplifyStatus(projectRoot, 'Import');
    await amplifyPushAuth(projectRoot);
    await amplifyStatus(projectRoot, 'No Change');

    expectLocalAndCloudMetaFilesMatching(projectRoot);
  });

  it('auth pull into empty directory', async () => {
    await initJSProjectWithProfile(projectRoot, {
      ...projectSettings,
      disableAmplifyAppCreation: false,
    });
    await importIdentityPoolAndUserPool(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' });

    await amplifyPushAuth(projectRoot);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    let projectRootPull;

    try {
      projectRootPull = await createNewProjectDir('authidp-pull');

      await amplifyPull(projectRootPull, { override: false, emptyDir: true, appId });

      expectLocalAndCloudMetaFilesMatching(projectRoot);
      expectLocalAndPulledBackendConfigMatching(projectRoot, projectRootPull);
      expectAuthLocalAndOGMetaFilesOutputMatching(projectRoot, projectRootPull);
    } finally {
      deleteProjectDir(projectRootPull);
    }
  });

  it('auth headless pull missing parameters', async () => {
    await initJSProjectWithProfile(projectRoot, {
      ...projectSettings,
      disableAmplifyAppCreation: false,
    });

    await importIdentityPoolAndUserPool(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' });

    await amplifyPushAuth(projectRoot);

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

      await expect(
        headlessPullExpectError(
          projectRootPull,
          { envName, appId },
          providersParam,
          'Error: auth headless is missing the following inputParams userPoolId, webClientId, nativeClientId, identityPoolId',
          {},
        ),
      ).rejects.toThrowError('Process exited with non zero exit code 1');
    } finally {
      deleteProjectDir(projectRootPull);
    }
  });
});
