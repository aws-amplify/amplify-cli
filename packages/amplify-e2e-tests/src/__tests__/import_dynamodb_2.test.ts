import {
  addAuthWithDefault,
  AddDynamoDBSettings,
  addDynamoDBWithGSIWithSettings,
  amplifyPushAuth,
  amplifyStatus,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  getTeamProviderInfo,
  initJSProjectWithProfile,
} from 'amplify-e2e-core';
import { addEnvironmentWithImportedAuth, checkoutEnvironment, removeEnvironment } from '../environment/env';
import {
  createDynamoDBSettings,
  DynamoDBProjectDetails,
  expectDynamoDBLocalAndOGMetaFilesOutputMatching,
  expectLocalAndCloudMetaFilesMatching,
  expectLocalAndPulledBackendConfigMatching,
  getDynamoDBProjectDetails,
  getOGDynamoDBProjectDetails,
  getShortId,
  headlessPull,
  headlessPullExpectError,
  importDynamoDBTable,
} from '../import-helpers';

const profileName = 'amplify-integ-test-user';

describe('dynamodb import', () => {
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
  let ogProjectDetails: DynamoDBProjectDetails;

  // We need an extra OG project to make sure that autocomplete prompt hits in
  let dummyOGProjectRoot: string;
  let dummyOGShortId: string;
  let dummyOGSettings: AddDynamoDBSettings;

  let projectRoot: string;
  let ignoreProjectDeleteErrors: boolean = false;

  beforeAll(async () => {
    ogProjectRoot = await createNewProjectDir(ogProjectSettings.name);
    ogShortId = getShortId();
    ogSettings = createDynamoDBSettings(ogProjectSettings.name, ogShortId);

    await initJSProjectWithProfile(ogProjectRoot, ogProjectSettings);
    await addAuthWithDefault(ogProjectRoot, {});
    await addDynamoDBWithGSIWithSettings(ogProjectRoot, ogSettings);
    await amplifyPushAuth(ogProjectRoot);

    ogProjectDetails = getOGDynamoDBProjectDetails(ogProjectRoot);

    dummyOGProjectRoot = await createNewProjectDir(dummyOGProjectSettings.name);
    dummyOGShortId = getShortId();
    dummyOGSettings = createDynamoDBSettings(dummyOGProjectSettings.name, dummyOGShortId);

    await initJSProjectWithProfile(dummyOGProjectRoot, dummyOGProjectSettings);
    await addAuthWithDefault(dummyOGProjectRoot, {});
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

  it('imported dynamodb table, create prod env, files should match', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await addAuthWithDefault(projectRoot, {});
    await importDynamoDBTable(projectRoot, ogSettings.tableName);

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
    expectDynamoDBLocalAndOGMetaFilesOutputMatching(projectRoot, ogProjectRoot);

    await checkoutEnvironment(projectRoot, {
      envName: firstEnvName,
    });

    await removeEnvironment(projectRoot, {
      envName: secondEnvName,
    });

    teamInfo = getTeamProviderInfo(projectRoot);

    // No prod in team provider info
    expect(teamInfo.prod).toBeUndefined();
  });

  it('dynamodb headless pull missing parameters', async () => {
    await initJSProjectWithProfile(projectRoot, {
      ...projectSettings,
      disableAmplifyAppCreation: false,
    });
    await addAuthWithDefault(projectRoot, {});
    await importDynamoDBTable(projectRoot, ogSettings.tableName);

    await amplifyPushAuth(projectRoot);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    let projectRootPull;

    try {
      projectRootPull = await createNewProjectDir('ddbimport-pull');

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
          'Error: storage headless is missing the following inputParams tableName, region',
          {},
        ),
      ).rejects.toThrowError('Process exited with non zero exit code 1');
    } finally {
      deleteProjectDir(projectRootPull);
    }
  });

  it('dynamodb headless pull successful', async () => {
    await initJSProjectWithProfile(projectRoot, {
      ...projectSettings,
      disableAmplifyAppCreation: false,
    });
    await addAuthWithDefault(projectRoot, {});
    await importDynamoDBTable(projectRoot, ogSettings.tableName);

    await amplifyPushAuth(projectRoot);

    let projectDetails = getDynamoDBProjectDetails(projectRoot);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    let projectRootPull;

    try {
      projectRootPull = await createNewProjectDir('ddbimport-pull');

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
          region: projectDetails.team.region,
          tables: {
            [projectDetails.storageResourceName]: projectDetails.team.tableName,
          },
        },
      };

      await headlessPull(projectRootPull, { envName, appId }, providersParam, categoryConfig);

      await amplifyStatus(projectRoot, 'No Change');

      expectLocalAndCloudMetaFilesMatching(projectRoot);
      expectLocalAndPulledBackendConfigMatching(projectRoot, projectRootPull);
      expectDynamoDBLocalAndOGMetaFilesOutputMatching(projectRoot, projectRootPull);
    } finally {
      deleteProjectDir(projectRootPull);
    }
  });
});
