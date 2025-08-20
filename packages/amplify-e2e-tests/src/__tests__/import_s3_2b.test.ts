/* eslint-disable spellcheck/spell-checker */

import {
  addAuthWithDefault,
  addS3StorageWithSettings,
  AddStorageSettings,
  amplifyPull,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  getTeamProviderInfo,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import { createStorageSettings, getShortId, importS3 } from '../import-helpers';

describe('s3 import b', () => {
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

  // We need an extra OG project to make sure that autocomplete prompt hits in
  let dummyOGProjectRoot: string;
  let dummyOGSettings: AddStorageSettings;

  let projectRoot: string;
  let ignoreProjectDeleteErrors = false;

  beforeAll(async () => {
    process.env.AMPLIFY_ENABLE_DEBUG_OUTPUT = 'true';
    ogProjectRoot = await createNewProjectDir(ogProjectSettings.name);
    ogShortId = getShortId();
    ogSettings = createStorageSettings(ogProjectSettings.name, ogShortId);

    await initJSProjectWithProfile(ogProjectRoot, ogProjectSettings);
    await addAuthWithDefault(ogProjectRoot);
    await addS3StorageWithSettings(ogProjectRoot, ogSettings);
    await amplifyPushAuth(ogProjectRoot);

    dummyOGProjectRoot = await createNewProjectDir(dummyOGProjectSettings.name);
    dummyOGSettings = createStorageSettings(dummyOGProjectSettings.name, ogShortId);

    await initJSProjectWithProfile(dummyOGProjectRoot, dummyOGProjectSettings);
    await addAuthWithDefault(dummyOGProjectRoot);
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

  it('storage headless pull in empty dir', async () => {
    const envName = 'integtest';
    await initJSProjectWithProfile(projectRoot, {
      ...projectSettings,
      disableAmplifyAppCreation: false,
      envName,
    });
    await addAuthWithDefault(projectRoot);
    await importS3(projectRoot, ogSettings.bucketName);

    await amplifyPushAuth(projectRoot);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    const storageParams1 = getTeamProviderInfo(projectRoot)?.[envName]?.categories?.storage;
    expect(storageParams1).toBeDefined();

    let projectRootPull;
    try {
      projectRootPull = await createNewProjectDir('s3import-pull');

      await amplifyPull(projectRootPull, { appId, emptyDir: true, envName, yesFlag: true });
      const storageParams2 = getTeamProviderInfo(projectRootPull)?.[envName]?.categories?.storage;
      expect(storageParams1).toEqual(storageParams2);
    } finally {
      deleteProjectDir(projectRootPull);
    }
  });
});
