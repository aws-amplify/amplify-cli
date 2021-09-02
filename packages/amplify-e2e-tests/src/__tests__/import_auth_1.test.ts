import * as fs from 'fs-extra';
import * as path from 'path';

import { $TSObject, JSONUtilities } from 'amplify-cli-core';
import {
  AddAuthUserPoolOnlyWithOAuthSettings,
  addApiWithCognitoUserPoolAuthTypeWhenAuthExists,
  addAuthUserPoolOnlyWithOAuth,
  addFunction,
  amplifyPull,
  amplifyPush,
  amplifyPushAuth,
  amplifyStatus,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  getEnvVars,
  getTeamProviderInfo,
  initJSProjectWithProfile,
  initProjectWithAccessKey,
  addApi,
  updateApiSchema,
} from 'amplify-e2e-core';
import {
  AppClientSettings,
  AuthProjectDetails,
  addAppClientWithSecret,
  addAppClientWithoutSecret,
  addS3WithAuthConfigurationMismatchErrorExit,
  createUserPoolOnlyWithOAuthSettings,
  deleteAppClient,
  expectApiHasCorrectAuthConfig,
  expectAuthLocalAndOGMetaFilesOutputMatching,
  expectAuthProjectDetailsMatch,
  expectLocalAndCloudMetaFilesMatching,
  expectLocalAndPulledBackendConfigMatching,
  expectLocalTeamInfoHasNoCategories,
  expectNoAuthInMeta,
  getAuthProjectDetails,
  getOGAuthProjectDetails,
  getShortId,
  importIdentityPoolAndUserPool,
  importUserPoolOnly,
  readRootStack,
  removeImportedAuthWithDefault,
} from '../import-helpers';
import { addEnvironmentWithImportedAuth, checkoutEnvironment, removeEnvironment } from '../environment/env';

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
  let ignoreProjectDeleteErrors: boolean = false;

  beforeAll(async () => {
    ogProjectRoot = await createNewProjectDir(ogProjectSettings.name);
    ogShortId = getShortId();
    ogSettings = createUserPoolOnlyWithOAuthSettings(ogProjectSettings.name, ogShortId);

    await initJSProjectWithProfile(ogProjectRoot, ogProjectSettings);
    await addAuthUserPoolOnlyWithOAuth(ogProjectRoot, ogSettings);
    await amplifyPushAuth(ogProjectRoot);

    ogProjectDetails = getOGAuthProjectDetails(ogProjectRoot);

    dummyOGProjectRoot = await createNewProjectDir(dummyOGProjectSettings.name);
    dummyOGShortId = getShortId();
    dummyOGSettings = createUserPoolOnlyWithOAuthSettings(dummyOGProjectSettings.name, ogShortId);

    await initJSProjectWithProfile(dummyOGProjectRoot, dummyOGProjectSettings);
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
    await addApiWithCognitoUserPoolAuthTypeWhenAuthExists(projectRoot);
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
    });
    await updateApiSchema(projectRoot, projectPrefix, 'model_with_iam_auth.graphql');
    await amplifyPush(projectRoot);
    // successful push indicates iam auth works when only importing user pool
  });

  it('imported auth, push, pull to empty directory, files should match', async () => {
    await initJSProjectWithProfile(projectRoot, {
      ...projectSettings,
      disableAmplifyAppCreation: false,
    });
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

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    let projectRootPull;

    try {
      projectRootPull = await createNewProjectDir('authimport-pull');

      await amplifyPull(projectRootPull, { override: false, emptyDir: true, appId });

      expectLocalAndCloudMetaFilesMatching(projectRoot);
      expectLocalAndPulledBackendConfigMatching(projectRoot, projectRootPull);
      expectAuthLocalAndOGMetaFilesOutputMatching(projectRoot, projectRootPull);
    } finally {
      deleteProjectDir(projectRootPull);
    }
  });

  it('imported auth, create prod env, files should match', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await importUserPoolOnly(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' });

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

    // Verify that same auth resource object is present (second does not have hostedUIProviderCreds until push)
    expect(Object.keys(env1)[0]).toEqual(Object.keys(env2)[0]);

    await amplifyPushAuth(projectRoot);

    // Meta is matching the data with the OG project's resources
    expectLocalAndCloudMetaFilesMatching(projectRoot);
    expectAuthLocalAndOGMetaFilesOutputMatching(projectRoot, ogProjectRoot);

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

  // Disable as credentials are correctly not listing any UserPools with OG prefix
  it.skip('init project in different region, import auth, should fail with error', async () => {
    // Set it to make sure deleteProject error will be ignored
    ignoreProjectDeleteErrors = true;

    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = getEnvVars();
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new Error('Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY either in .env file or as Environment variable');
    }

    const newProjectRegion = process.env.CLI_REGION === 'us-west-2' ? 'us-east-2' : 'us-west-2';

    await initProjectWithAccessKey(projectRoot, {
      ...projectSettings,
      envName: 'integtest',
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      region: newProjectRegion,
    } as any);

    // The previously configured Cognito User Pool: '${userPoolName}' (${userPoolId}) cannot be found.
    await expect(
      await importUserPoolOnly(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' }),
    ).rejects.toThrowError('Process exited with non zero exit code 1');
  });

  // Used for creating custom app clients. This should match with web app client setting for import to work
  const customAppClientSettings: AppClientSettings = {
    supportedIdentityProviders: ['COGNITO', 'Facebook', 'Google', 'LoginWithAmazon', 'SignInWithApple'],
    allowedOAuthFlowsUserPoolClient: true,
    callbackURLs: ['https://sin1/', 'https://sin2/'],
    logoutURLs: ['https://sout1/', 'https://sout2/'],
    allowedOAuthFlows: ['code'],
    allowedScopes: ['aws.cognito.signin.user.admin', 'email', 'openid', 'phone', 'profile'],
  };

  it('should support importing AppClient with secret', async () => {
    const nativeAppClientName = 'nativeClientWithSecret';
    let appClientId;
    let appclientSecret;
    try {
      await initJSProjectWithProfile(projectRoot, projectSettings);
      ({ appClientId, appclientSecret } = await addAppClientWithSecret(
        profileName,
        ogProjectRoot,
        nativeAppClientName,
        customAppClientSettings,
      ));
      await await importUserPoolOnly(projectRoot, ogSettings.userPoolName, { native: nativeAppClientName, web: '_app_clientWeb' });
      await amplifyPushAuth(projectRoot);
      expectLocalAndCloudMetaFilesMatching(projectRoot);
      const projectDetails = getAuthProjectDetails(projectRoot);
      expectAuthProjectDetailsMatch(projectDetails, {
        ...ogProjectDetails,
        meta: { ...ogProjectDetails.meta, AppClientID: appClientId, AppClientSecret: appclientSecret },
        team: { ...ogProjectDetails.team, nativeClientId: appClientId },
      });
    } finally {
      // delete the app client
      if (appClientId) {
        deleteAppClient(profileName, ogProjectRoot, appClientId);
      }
    }
  });

  it('should support importing AppClient with out secret', async () => {
    const nativeAppClientName = 'nativeClientWithOutSecret';
    let appClientId;
    let appclientSecret;

    try {
      await initJSProjectWithProfile(projectRoot, projectSettings);

      ({ appClientId, appclientSecret } = await addAppClientWithoutSecret(
        profileName,
        ogProjectRoot,
        nativeAppClientName,
        customAppClientSettings,
      ));

      await await importUserPoolOnly(projectRoot, ogSettings.userPoolName, { native: nativeAppClientName, web: '_app_clientWeb' });

      await amplifyPushAuth(projectRoot);

      expectLocalAndCloudMetaFilesMatching(projectRoot);

      const projectDetails = getAuthProjectDetails(projectRoot);

      expectAuthProjectDetailsMatch(projectDetails, {
        ...ogProjectDetails,
        meta: { ...ogProjectDetails.meta, AppClientID: appClientId, AppClientSecret: appclientSecret },
        team: { ...ogProjectDetails.team, nativeClientId: appClientId },
      });
    } finally {
      // delete the app client
      if (appClientId) {
        deleteAppClient(profileName, ogProjectRoot, appClientId);
      }
    }
  });
});
