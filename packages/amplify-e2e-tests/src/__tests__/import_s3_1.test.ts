import * as path from 'path';
import * as fs from 'fs-extra';
import { $TSObject, JSONUtilities } from '@aws-amplify/amplify-cli-core';
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
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import { randomizedFunctionName } from '../schema-api-directives/functionTester';
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
} from '../import-helpers';

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
  let dummyOGSettings: AddStorageSettings;

  let projectRoot: string;
  let ignoreProjectDeleteErrors = false;

  beforeAll(async () => {
    ogProjectRoot = await createNewProjectDir(ogProjectSettings.name);
    ogShortId = getShortId();
    ogSettings = createStorageSettings(ogProjectSettings.name, ogShortId);

    await initJSProjectWithProfile(ogProjectRoot, ogProjectSettings);
    await addAuthWithDefault(ogProjectRoot);
    await addS3StorageWithSettings(ogProjectRoot, ogSettings);
    await amplifyPushAuth(ogProjectRoot);

    ogProjectDetails = getOGStorageProjectDetails(ogProjectRoot);

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

  it('status should reflect correct values for imported storage', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await addAuthWithDefault(projectRoot);
    await importS3(projectRoot, ogSettings.bucketName);

    let projectDetails = getStorageProjectDetails(projectRoot);

    expectStorageProjectDetailsMatch(projectDetails, ogProjectDetails);

    await amplifyStatus(projectRoot, 'Import');
    await amplifyPushAuth(projectRoot);
    await amplifyStatus(projectRoot, 'No Change');

    expectLocalAndCloudMetaFilesMatching(projectRoot);

    projectDetails = getStorageProjectDetails(projectRoot);

    expectStorageProjectDetailsMatch(projectDetails, ogProjectDetails);

    await removeImportedS3WithDefault(projectRoot);
    await amplifyStatus(projectRoot, 'Unlink');

    await amplifyPushAuth(projectRoot);

    expectNoStorageInMeta(projectRoot);

    expectLocalTeamInfoHasOnlyAuthCategoryAndNoStorage(projectRoot);
  });

  it('imported storage with function and crud on storage should push', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await addAuthWithDefault(projectRoot);
    await importS3(projectRoot, ogSettings.bucketName);

    const functionName = randomizedFunctionName('s3impfunc');
    const storageResourceName = getS3ResourceName(projectRoot);

    await addFunction(
      projectRoot,
      {
        name: functionName,
        functionTemplate: 'Hello World',
        additionalPermissions: {
          permissions: ['storage'],
          choices: ['auth', 'storage'],
          resources: [storageResourceName],
          resourceChoices: [storageResourceName],
          operations: ['create', 'read', 'update', 'delete'],
        },
      },
      'nodejs',
    );

    await amplifyPushAuth(projectRoot);

    const projectDetails = getStorageProjectDetails(projectRoot);

    // Verify that index.js gets the userpool env var name injected
    const amplifyBackendDirPath = path.join(projectRoot, 'amplify', 'backend');
    const functionFilePath = path.join(amplifyBackendDirPath, 'function', functionName);
    const amplifyFunctionIndexFilePath = path.join(functionFilePath, 'src', 'index.js');
    const s3ResourceNameUpperCase = projectDetails.storageResourceName.toUpperCase();
    const s3EnvVarName = `STORAGE_${s3ResourceNameUpperCase}_BUCKETNAME`;

    const indexjsContents = fs.readFileSync(amplifyFunctionIndexFilePath).toString();

    expect(indexjsContents.indexOf(s3EnvVarName)).toBeGreaterThanOrEqual(0);

    // Verify bucket name in root stack
    const rootStack = readRootStack(projectRoot);
    const functionResourceName = `function${functionName}`;
    const bucketNameParameterName = `storage${projectDetails.storageResourceName}BucketName`;
    const functionResource = rootStack.Resources[functionResourceName];
    expect(functionResource.Properties?.Parameters[bucketNameParameterName]).toEqual(projectDetails.meta.BucketName);

    // Verify bucket name env var in function stack
    const functionStackFilePath = path.join(functionFilePath, `${functionName}-cloudformation-template.json`);
    const functionStack = JSONUtilities.readJson<$TSObject>(functionStackFilePath);
    expect(functionStack.Resources?.LambdaFunction?.Properties?.Environment?.Variables[s3EnvVarName].Ref).toEqual(bucketNameParameterName);

    // Verify if generated policy has the userpool id as resource
    expect(
      functionStack.Resources?.AmplifyResourcesPolicy?.Properties?.PolicyDocument?.Statement[0].Resource[0]['Fn::Join'][1][1].Ref,
    ).toEqual(bucketNameParameterName);
  });

  it('imported storage, push, pull to empty directory, files should match', async () => {
    await initJSProjectWithProfile(projectRoot, {
      ...projectSettings,
      disableAmplifyAppCreation: false,
    });
    await addAuthWithDefault(projectRoot);
    await importS3(projectRoot, ogSettings.bucketName);

    const functionName = randomizedFunctionName('s3impfunc');
    const storageResourceName = getS3ResourceName(projectRoot);

    await addFunction(
      projectRoot,
      {
        name: functionName,
        functionTemplate: 'Hello World',
        additionalPermissions: {
          permissions: ['storage'],
          choices: ['auth', 'storage'],
          resources: [storageResourceName],
          resourceChoices: [storageResourceName],
          operations: ['create', 'read', 'update', 'delete'],
        },
      },
      'nodejs',
    );

    await amplifyPushAuth(projectRoot);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    let projectRootPull;

    try {
      projectRootPull = await createNewProjectDir('s3import-pull');

      await amplifyPull(projectRootPull, { override: false, emptyDir: true, appId });

      expectLocalAndCloudMetaFilesMatching(projectRoot);
      expectLocalAndPulledBackendConfigMatching(projectRoot, projectRootPull);
      expectS3LocalAndOGMetaFilesOutputMatching(projectRoot, projectRootPull);
    } finally {
      deleteProjectDir(projectRootPull);
    }
  });
});
