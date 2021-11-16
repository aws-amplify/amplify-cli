import { $TSObject, JSONUtilities } from 'amplify-cli-core';
import {
  addAuthWithDefault,
  AddDynamoDBSettings,
  addDynamoDBWithGSIWithSettings,
  addFunction,
  amplifyPull,
  amplifyPushAuth,
  amplifyStatus,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  initJSProjectWithProfile,
} from 'amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import {
  createDynamoDBSettings,
  DynamoDBProjectDetails,
  expectDynamoDBLocalAndOGMetaFilesOutputMatching,
  expectDynamoDBProjectDetailsMatch,
  expectLocalAndCloudMetaFilesMatching,
  expectLocalAndPulledBackendConfigMatching,
  expectLocalTeamInfoHasOnlyAuthCategoryAndNoStorage,
  expectNoStorageInMeta,
  getDynamoDBProjectDetails,
  getDynamoDBResourceName,
  getOGDynamoDBProjectDetails,
  getShortId,
  importDynamoDBTable,
  readRootStack,
  removeImportedDynamoDBWithDefault,
} from '../import-helpers';
import { randomizedFunctionName } from '../schema-api-directives/functionTester';

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

  it('status should reflect correct values for imported dynamodb table', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await addAuthWithDefault(projectRoot, {});
    await importDynamoDBTable(projectRoot, ogSettings.tableName);

    let projectDetails = getDynamoDBProjectDetails(projectRoot);

    expectDynamoDBProjectDetailsMatch(projectDetails, ogProjectDetails);

    await amplifyStatus(projectRoot, 'Import');
    await amplifyPushAuth(projectRoot);
    await amplifyStatus(projectRoot, 'No Change');

    expectLocalAndCloudMetaFilesMatching(projectRoot);

    projectDetails = getDynamoDBProjectDetails(projectRoot);

    expectDynamoDBProjectDetailsMatch(projectDetails, ogProjectDetails);

    await removeImportedDynamoDBWithDefault(projectRoot);
    await amplifyStatus(projectRoot, 'Unlink');

    await amplifyPushAuth(projectRoot);

    expectNoStorageInMeta(projectRoot);

    expectLocalTeamInfoHasOnlyAuthCategoryAndNoStorage(projectRoot);
  });

  it('imported dynamodb table with function and crud on storage should push', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await addAuthWithDefault(projectRoot, {});
    await importDynamoDBTable(projectRoot, ogSettings.tableName);

    const functionName = randomizedFunctionName('ddbimpfunc');
    const storageResourceName = getDynamoDBResourceName(projectRoot);

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

    const projectDetails = getDynamoDBProjectDetails(projectRoot);

    // Verify that index.js gets the userpool env var name injected
    const amplifyBackendDirPath = path.join(projectRoot, 'amplify', 'backend');
    const functionFilePath = path.join(amplifyBackendDirPath, 'function', functionName);
    const amplifyFunctionIndexFilePath = path.join(functionFilePath, 'src', 'index.js');
    const dynamoDBResourceNameUpperCase = projectDetails.storageResourceName.toUpperCase();
    const tableEnvVarName = `STORAGE_${dynamoDBResourceNameUpperCase}_NAME`;
    const arnEnvVarName = `STORAGE_${dynamoDBResourceNameUpperCase}_ARN`;

    const indexjsContents = fs.readFileSync(amplifyFunctionIndexFilePath).toString();

    expect(indexjsContents.indexOf(tableEnvVarName)).toBeGreaterThanOrEqual(0);
    expect(indexjsContents.indexOf(arnEnvVarName)).toBeGreaterThanOrEqual(0);

    // Verify table name in root stack
    const rootStack = readRootStack(projectRoot);
    const functionResourceName = `function${functionName}`;
    const tableNameParameterName = `storage${projectDetails.storageResourceName.replace(/[\W_]+/g, '')}Name`;
    const arnParameterName = `storage${projectDetails.storageResourceName.replace(/[\W_]+/g, '')}Arn`;
    const functionResource = rootStack.Resources[functionResourceName];
    expect(functionResource.Properties?.Parameters[tableNameParameterName]).toEqual(projectDetails.meta.Name);

    // Verify table name env var in function stack
    const functionStackFilePath = path.join(functionFilePath, `${functionName}-cloudformation-template.json`);
    const functionStack = JSONUtilities.readJson<$TSObject>(functionStackFilePath);
    expect(functionStack.Resources?.LambdaFunction?.Properties?.Environment?.Variables[tableEnvVarName].Ref).toEqual(
      tableNameParameterName,
    );
    expect(functionStack.Resources?.LambdaFunction?.Properties?.Environment?.Variables[arnEnvVarName].Ref).toEqual(arnParameterName);

    // Verify if generated policy has the userpool id as resource
    expect(functionStack.Resources?.AmplifyResourcesPolicy?.Properties?.PolicyDocument?.Statement[0].Resource[0].Ref).toEqual(
      arnParameterName,
    );
    expect(
      functionStack.Resources?.AmplifyResourcesPolicy?.Properties?.PolicyDocument?.Statement[0].Resource[1]['Fn::Join'][1][0].Ref,
    ).toEqual(arnParameterName);
  });

  it('imported dynamodb table, push, pull to empty directory, files should match', async () => {
    await initJSProjectWithProfile(projectRoot, {
      ...projectSettings,
      disableAmplifyAppCreation: false,
    });
    await addAuthWithDefault(projectRoot, {});
    await importDynamoDBTable(projectRoot, ogSettings.tableName);

    const functionName = randomizedFunctionName('ddbimpfunc');
    const storageResourceName = getDynamoDBResourceName(projectRoot);

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
      projectRootPull = await createNewProjectDir('ddbimport-pull');

      await amplifyPull(projectRootPull, { override: false, emptyDir: true, appId });

      expectLocalAndCloudMetaFilesMatching(projectRoot);
      expectLocalAndPulledBackendConfigMatching(projectRoot, projectRootPull);
      expectDynamoDBLocalAndOGMetaFilesOutputMatching(projectRoot, projectRootPull);
    } finally {
      deleteProjectDir(projectRootPull);
    }
  });
});
