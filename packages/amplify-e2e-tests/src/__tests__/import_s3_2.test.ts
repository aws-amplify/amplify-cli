import * as path from 'path';
import * as fs from 'fs-extra';
import { $TSObject, JSONUtilities } from 'amplify-cli-core';
import {
  addAuthWithDefault,
  addFunction,
  addS3StorageWithSettings,
  AddStorageSettings,
  amplifyPull,
  amplifyPushAuth,
  amplifyStatus,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  getTeamProviderInfo,
  initJSProjectWithProfile,
} from 'amplify-e2e-core';
import { randomizedFunctionName } from '../schema-api-directives/functionTester';
import { addEnvironmentWithImportedAuth, checkoutEnvironment, removeEnvironment } from '../environment/env';
import {
  expectLocalAndCloudMetaFilesMatching,
  expectLocalAndPulledBackendConfigMatching,
  getShortId,
  readRootStack,
  createStorageSettings,
  StorageProjectDetails,
  getOGStorageProjectDetails,
  importS3,
  getStorageProjectDetails,
  expectStorageProjectDetailsMatch,
  removeImportedS3WithDefault,
  expectNoStorageInMeta,
  expectLocalTeamInfoHasOnlyAuthCategoryAndNoStorage,
  getS3ResourceName,
  expectS3LocalAndOGMetaFilesOutputMatching,
  headlessPullExpectError,
  headlessPull,
} from '../import-helpers';

const profileName = 'amplify-integ-test-user';

describe('s3 import', () => {
  const projectPrefix = 'sssimp';
  const ogProjectPrefix = 'ogsssimp';

  const projectSettings = {
    name: projectPrefix,
  };

  const ogProjectSettings = {
    name: ogProjectPrefix,
  };

  const dummyOGProjectSettings = {
    name: 'dummyog1',
  };

  // OG is the CLI project that creates the s3 bucket to import by other test projects
  let ogProjectRoot: string;
  let ogShortId: string;
  let ogSettings: AddStorageSettings;
  let ogProjectDetails: StorageProjectDetails;

  // We need an extra OG project to make sure that autocomplete prompt hits in
  let dummyOGProjectRoot: string;
  let dummyOGShortId: string;
  let dummyOGSettings: AddStorageSettings;

  let projectRoot: string;
  let ignoreProjectDeleteErrors: boolean = false;

  beforeAll(async () => {
    ogProjectRoot = await createNewProjectDir(ogProjectSettings.name);
    ogShortId = getShortId();
    ogSettings = createStorageSettings(ogProjectSettings.name, ogShortId);

    await initJSProjectWithProfile(ogProjectRoot, ogProjectSettings);
    await addAuthWithDefault(ogProjectRoot, {});
    await addS3StorageWithSettings(ogProjectRoot, ogSettings);
    await amplifyPushAuth(ogProjectRoot);

    ogProjectDetails = getOGStorageProjectDetails(ogProjectRoot);

    dummyOGProjectRoot = await createNewProjectDir(dummyOGProjectSettings.name);
    dummyOGShortId = getShortId();
    dummyOGSettings = createStorageSettings(dummyOGProjectSettings.name, ogShortId);

    await initJSProjectWithProfile(dummyOGProjectRoot, dummyOGProjectSettings);
    await addAuthWithDefault(dummyOGProjectRoot, {});
    await addS3StorageWithSettings(dummyOGProjectRoot, dummyOGSettings);
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

  it('imported storage, create prod env, files should match', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await addAuthWithDefault(projectRoot, {});
    await importS3(projectRoot, ogSettings.bucketName);

    await amplifyPushAuth(projectRoot);

    const firstEnvName = 'integtest';
    const secondEnvName = 'prod';

    await addEnvironmentWithImportedAuth(projectRoot, {
      envName: secondEnvName,
      currentEnvName: firstEnvName,
    });

    let teamInfo = getTeamProviderInfo(projectRoot);
    const env1 = teamInfo[firstEnvName];
    const env2 = teamInfo[secondEnvName];

    // Verify that same storage resource object is present
    expect(Object.keys(env1)[0]).toEqual(Object.keys(env2)[0]);

    await amplifyPushAuth(projectRoot);

    // Meta is matching the data with the OG project's resources
    expectLocalAndCloudMetaFilesMatching(projectRoot);
    expectS3LocalAndOGMetaFilesOutputMatching(projectRoot, ogProjectRoot);

    await checkoutEnvironment(projectRoot, {
      envName: firstEnvName,
    });

    await removeEnvironment(projectRoot, {
      envName: secondEnvName,
    });

    teamInfo = getTeamProviderInfo(projectRoot);

    // No prod in team proovider info
    expect(teamInfo.prod).toBeUndefined();
  });

  it('storage headless pull missing parameters', async () => {
    await initJSProjectWithProfile(projectRoot, {
      ...projectSettings,
      disableAmplifyAppCreation: false,
    });
    await addAuthWithDefault(projectRoot, {});
    await importS3(projectRoot, ogSettings.bucketName);

    await amplifyPushAuth(projectRoot);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    let projectRootPull;

    try {
      projectRootPull = await createNewProjectDir('s3import-pull');

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
          'Error: storage headless is missing the following inputParams bucketName, region',
          {},
        ),
      ).rejects.toThrowError('Process exited with non zero exit code 1');
    } finally {
      deleteProjectDir(projectRootPull);
    }
  });

  it('storage headless pull successful', async () => {
    await initJSProjectWithProfile(projectRoot, {
      ...projectSettings,
      disableAmplifyAppCreation: false,
    });
    await addAuthWithDefault(projectRoot, {});
    await importS3(projectRoot, ogSettings.bucketName);

    await amplifyPushAuth(projectRoot);

    let projectDetails = getStorageProjectDetails(projectRoot);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    let projectRootPull;

    try {
      projectRootPull = await createNewProjectDir('s3import-pull');

      const envName = 'integtest';
      const providersParam = {
        awscloudformation: {
          configLevel: 'project',
          useProfile: true,
          profileName,
        },
      };

      const categoryConfig = {
        storage: {
          bucketName: projectDetails.team.bucketName,
          region: projectDetails.team.region,
        },
      };

      await headlessPull(projectRootPull, { envName, appId }, providersParam, categoryConfig);

      await amplifyStatus(projectRoot, 'No Change');

      expectLocalAndCloudMetaFilesMatching(projectRoot);
      expectLocalAndPulledBackendConfigMatching(projectRoot, projectRootPull);
      expectS3LocalAndOGMetaFilesOutputMatching(projectRoot, projectRootPull);
    } finally {
      deleteProjectDir(projectRootPull);
    }
  });
});
