/* eslint-disable jest/expect-expect */
/* eslint-disable max-lines-per-function */
import { $TSObject, JSONUtilities, stateManager } from 'amplify-cli-core';
import {
  addApi,
  addApiWithCognitoUserPoolAuthTypeWhenAuthExists,
  addAuthUserPoolOnlyWithOAuth,
  AddAuthUserPoolOnlyWithOAuthSettings,
  addFunction,
  amplifyPush,
  amplifyPushAuth,
  amplifyStatus,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  setAmplifyAppIdInBackendAmplifyMeta,
  updateApiSchema,
} from 'amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import {
  addS3WithAuthConfigurationMismatchErrorExit,
  AuthProjectDetails,
  createUserPoolOnlyWithOAuthSettings,
  expectApiHasCorrectAuthConfig,
  expectAuthParametersMatch,
  expectAuthProjectDetailsMatch,
  expectLocalAndCloudMetaFilesMatching,
  expectLocalTeamInfoHasNoCategories,
  expectNoAuthInMeta,
  getAuthProjectDetails,
  getOGAuthProjectDetails,
  getShortId,
  importUserPoolOnly,
  readRootStack,
  removeImportedAuthWithDefault,
} from '../import-helpers';
import { getCognitoResourceName } from '../schema-api-directives/authHelper';
import { randomizedFunctionName } from '../schema-api-directives/functionTester';

describe('auth import userpool only', () => {
  const profileName = 'amplify-integ-test-user';

  const projectPrefix = 'auimpup';
  const ogProjectPrefix = 'ogauimpup';

  const projectSettings = {
    name: projectPrefix,
  };

  const ogProjectSettings = {
    name: ogProjectPrefix,
  };

  const dummyOGProjectSettings = {
    name: 'dummyog1',
  };

  // OG is the CLI project that creates the user pool to import by other test projects
  let ogProjectRoot: string;
  let ogShortId: string;
  let ogSettings: AddAuthUserPoolOnlyWithOAuthSettings;
  let ogProjectDetails: AuthProjectDetails;

  // We need an extra OG project to make sure that autocomplete prompt hits in
  let dummyOGProjectRoot: string;
  let dummyOGShortId: string;
  let dummyOGSettings: AddAuthUserPoolOnlyWithOAuthSettings;

  let projectRoot: string;
  let ignoreProjectDeleteErrors = false;

  beforeAll(async () => {
    ogProjectRoot = await createNewProjectDir(ogProjectSettings.name);
    ogShortId = getShortId();
    ogSettings = createUserPoolOnlyWithOAuthSettings(ogProjectSettings.name, ogShortId);

    await initJSProjectWithProfile(ogProjectRoot, { ...ogProjectSettings, disableAmplifyAppCreation: false });
    //setAmplifyAppIdInBackendAmplifyMeta(ogProjectRoot);

    await addAuthUserPoolOnlyWithOAuth(ogProjectRoot, ogSettings);
    await amplifyPushAuth(ogProjectRoot);

    ogProjectDetails = getOGAuthProjectDetails(ogProjectRoot);

    dummyOGProjectRoot = await createNewProjectDir(dummyOGProjectSettings.name);
    dummyOGShortId = getShortId();
    dummyOGSettings = createUserPoolOnlyWithOAuthSettings(dummyOGProjectSettings.name, ogShortId);

    await initJSProjectWithProfile(dummyOGProjectRoot, { ...dummyOGProjectSettings, disableAmplifyAppCreation: false });
    //setAmplifyAppIdInBackendAmplifyMeta(dummyOGProjectRoot);
    await addAuthUserPoolOnlyWithOAuth(dummyOGProjectRoot, dummyOGSettings);
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

  it('status should reflect correct values for imported auth', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await importUserPoolOnly(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' });

    let projectDetails = getAuthProjectDetails(projectRoot);

    expectAuthProjectDetailsMatch(projectDetails, ogProjectDetails);

    await amplifyStatus(projectRoot, 'Import');
    await amplifyPushAuth(projectRoot);
    await amplifyStatus(projectRoot, 'No Change');

    expectLocalAndCloudMetaFilesMatching(projectRoot);

    projectDetails = getAuthProjectDetails(projectRoot);

    expectAuthProjectDetailsMatch(projectDetails, ogProjectDetails);

    await removeImportedAuthWithDefault(projectRoot);
    await amplifyStatus(projectRoot, 'Unlink');

    await amplifyPushAuth(projectRoot);

    expectNoAuthInMeta(projectRoot);

    expectLocalTeamInfoHasNoCategories(projectRoot);
  });

  it('imported auth with graphql api and cognito should push', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await importUserPoolOnly(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' }); // space at to make sure its not web client
    await addApiWithCognitoUserPoolAuthTypeWhenAuthExists(projectRoot, { transformerVersion: 1 });
    await amplifyPush(projectRoot);

    expectApiHasCorrectAuthConfig(projectRoot, projectPrefix, ogProjectDetails.meta.UserPoolId);
  });

  it('imported auth with function and crud on auth should push', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await importUserPoolOnly(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' });

    const functionName = randomizedFunctionName('authimpfunc');
    const authResourceName = getCognitoResourceName(projectRoot);

    await addFunction(
      projectRoot,
      {
        name: functionName,
        functionTemplate: 'Hello World',
        additionalPermissions: {
          permissions: ['auth'],
          choices: ['auth'],
          resources: [authResourceName],
          resourceChoices: [authResourceName],
          operations: ['create', 'read', 'update', 'delete'],
        },
      },
      'nodejs',
    );

    await amplifyPushAuth(projectRoot);

    const projectDetails = getAuthProjectDetails(projectRoot);

    // Verify that index.js gets the userpool env var name injected
    const amplifyBackendDirPath = path.join(projectRoot, 'amplify', 'backend');
    const functionFilePath = path.join(amplifyBackendDirPath, 'function', functionName);
    const amplifyFunctionIndexFilePath = path.join(functionFilePath, 'src', 'index.js');
    const cognitoResourceNameUpperCase = projectDetails.authResourceName.toUpperCase();
    const userPoolIDEnvVarName = `AUTH_${cognitoResourceNameUpperCase}_USERPOOLID`;

    const indexjsContents = fs.readFileSync(amplifyFunctionIndexFilePath).toString();

    expect(indexjsContents.indexOf(userPoolIDEnvVarName)).toBeGreaterThanOrEqual(0);

    // Verify userpool id in root stack
    const rootStack = readRootStack(projectRoot);
    const functionResourceName = `function${functionName}`;
    const authParameterName = `auth${projectDetails.authResourceName}UserPoolId`;
    const functionResource = rootStack.Resources[functionResourceName];
    expect(functionResource.Properties?.Parameters[authParameterName]).toEqual(projectDetails.meta.UserPoolId);

    // Verify userpool env var in function stack
    const functionStackFilePath = path.join(functionFilePath, `${functionName}-cloudformation-template.json`);
    const functionStack = JSONUtilities.readJson<$TSObject>(functionStackFilePath);
    expect(functionStack.Resources?.LambdaFunction?.Properties?.Environment?.Variables[userPoolIDEnvVarName].Ref).toEqual(
      authParameterName,
    );

    // Verify if generated policy has the userpool id as resource
    expect(functionStack.Resources?.AmplifyResourcesPolicy?.Properties?.PolicyDocument?.Statement[0].Resource[0]['Fn::Join'][1][5]).toEqual(
      projectDetails.meta.UserPoolId,
    );
  });

  it('imported userpool only auth, s3 storage add should fail with error', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await importUserPoolOnly(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' });

    // Imported auth resources cannot be used together with \'storage\' category\'s authenticated and unauthenticated access.
    await expect(addS3WithAuthConfigurationMismatchErrorExit(projectRoot, {})).rejects.toThrowError(
      'Process exited with non zero exit code 1',
    );
  });

  it('imported user pool only should allow iam auth in graphql api', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await importUserPoolOnly(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' });
    await addApi(projectRoot, {
      IAM: {},
      transformerVersion: 1,
    });
    await updateApiSchema(projectRoot, projectPrefix, 'model_with_iam_auth.graphql');
    await amplifyPush(projectRoot);
    // successful push indicates iam auth works when only importing user pool
  });

  it('should update parameters.json with auth configuration', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await importUserPoolOnly(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' });

    const ogProjectAuthParameters = stateManager.getResourceParametersJson(ogProjectRoot, 'auth', ogProjectDetails.authResourceName);

    let projectDetails = getAuthProjectDetails(projectRoot);
    let projectAuthParameters = stateManager.getResourceParametersJson(projectRoot, 'auth', projectDetails.authResourceName);
    expectAuthParametersMatch(projectAuthParameters, ogProjectAuthParameters);

    await amplifyStatus(projectRoot, 'Import');
    await amplifyPushAuth(projectRoot);
    await amplifyStatus(projectRoot, 'No Change');

    expectLocalAndCloudMetaFilesMatching(projectRoot);

    projectDetails = getAuthProjectDetails(projectRoot);
    projectAuthParameters = stateManager.getResourceParametersJson(projectRoot, 'auth', projectDetails.authResourceName);
    expectAuthParametersMatch(projectAuthParameters, ogProjectAuthParameters);
  });
});
