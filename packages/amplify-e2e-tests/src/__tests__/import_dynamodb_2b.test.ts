/* eslint-disable spellcheck/spell-checker */

import {
  addAuthWithDefault,
  AddDynamoDBSettings,
  addDynamoDBWithGSIWithSettings,
  amplifyPull,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  getTeamProviderInfo,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import { createDynamoDBSettings, getShortId, importDynamoDBTable } from '../import-helpers';

describe('dynamodb import 2b', () => {
  const projectPrefix = 'ddbimp';
  const ogProjectPrefix = 'ogddbimp';

  const projectSettings = {
    name: projectPrefix,
  };

  const ogProjectSettings = {
    name: ogProjectPrefix,
  };

  const dummyOGProjectSettings = {
    name: 'dummyog1',
  };

  // OG is the CLI project that creates the dynamodb tables to import by other test projects
  let ogProjectRoot: string;
  let ogShortId: string;
  let ogSettings: AddDynamoDBSettings;

  // We need an extra OG project to make sure that autocomplete prompt hits in
  let dummyOGProjectRoot: string;
  let dummyOGShortId: string;
  let dummyOGSettings: AddDynamoDBSettings;

  let projectRoot: string;
  let ignoreProjectDeleteErrors = false;

  beforeAll(async () => {
    ogProjectRoot = await createNewProjectDir(ogProjectSettings.name);
    ogShortId = getShortId();
    ogSettings = createDynamoDBSettings(ogProjectSettings.name, ogShortId);

    await initJSProjectWithProfile(ogProjectRoot, ogProjectSettings);
    await addAuthWithDefault(ogProjectRoot);
    await addDynamoDBWithGSIWithSettings(ogProjectRoot, ogSettings);
    await amplifyPushAuth(ogProjectRoot);

    dummyOGProjectRoot = await createNewProjectDir(dummyOGProjectSettings.name);
    dummyOGShortId = getShortId();
    dummyOGSettings = createDynamoDBSettings(dummyOGProjectSettings.name, dummyOGShortId);

    await initJSProjectWithProfile(dummyOGProjectRoot, dummyOGProjectSettings);
    await addAuthWithDefault(dummyOGProjectRoot);
    await addDynamoDBWithGSIWithSettings(dummyOGProjectRoot, dummyOGSettings);
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

  it('dynamodb headless pull in empty dir', async () => {
    const envName = 'integtest';

    await initJSProjectWithProfile(projectRoot, {
      ...projectSettings,
      disableAmplifyAppCreation: false,
      envName,
    });
    await addAuthWithDefault(projectRoot);
    await importDynamoDBTable(projectRoot, ogSettings.tableName);

    await amplifyPushAuth(projectRoot);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    const storageParams1 = getTeamProviderInfo(projectRoot)?.[envName]?.categories?.storage;
    expect(storageParams1).toBeDefined();

    let projectRootPull;
    try {
      projectRootPull = await createNewProjectDir('ddbimport-pull');

      await amplifyPull(projectRootPull, { appId, emptyDir: true, envName, yesFlag: true });
      const storageParams2 = getTeamProviderInfo(projectRootPull)?.[envName]?.categories?.storage;
      expect(storageParams1).toEqual(storageParams2);
    } finally {
      deleteProjectDir(projectRootPull);
    }
  });
});
