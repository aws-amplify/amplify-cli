/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import {
  addAuthWithDefault,
  addS3StorageWithSettings,
  AddStorageSettings,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getTeamProviderInfo,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import { addEnvironmentWithImportedAuth, checkoutEnvironment, removeEnvironment } from '../environment/env';
import {
  createStorageSettings,
  expectLocalAndCloudMetaFilesMatching,
  expectS3LocalAndOGMetaFilesOutputMatching,
  getShortId,
  importS3,
} from '../import-helpers';

describe('s3 import a', () => {
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

  it('imported storage, create prod env, files should match', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await addAuthWithDefault(projectRoot);
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
});
