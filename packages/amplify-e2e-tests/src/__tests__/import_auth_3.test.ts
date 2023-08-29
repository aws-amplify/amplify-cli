import {
  addAuthUserPoolOnlyWithOAuth,
  AddAuthUserPoolOnlyWithOAuthSettings,
  addFunction,
  amplifyPull,
  amplifyPushAuth,
  createNewProjectDir,
  createUserPoolOnlyWithOAuthSettings,
  deleteProject,
  deleteProjectDir,
  getAppId,
  getCognitoResourceName,
  getEnvVars,
  getTeamProviderInfo,
  initJSProjectWithProfile,
  initProjectWithAccessKey,
} from '@aws-amplify/amplify-e2e-core';
import { addEnvironmentWithImportedAuth, checkoutEnvironment, removeEnvironment } from '../environment/env';
import {
  addAppClientWithoutSecret,
  addAppClientWithSecret,
  AppClientSettings,
  AuthProjectDetails,
  deleteAppClient,
  expectAuthLocalAndOGMetaFilesOutputMatching,
  expectAuthProjectDetailsMatch,
  expectLocalAndCloudMetaFilesMatching,
  expectLocalAndPulledBackendConfigMatching,
  getAuthProjectDetails,
  getOGAuthProjectDetails,
  getShortId,
  importUserPoolOnly,
} from '../import-helpers';
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
  let dummyOGSettings: AddAuthUserPoolOnlyWithOAuthSettings;

  let projectRoot: string;
  let ignoreProjectDeleteErrors = false;

  beforeAll(async () => {
    ogProjectRoot = await createNewProjectDir(ogProjectSettings.name);
    ogShortId = getShortId();
    ogSettings = createUserPoolOnlyWithOAuthSettings(ogProjectSettings.name, ogShortId);

    await initJSProjectWithProfile(ogProjectRoot, ogProjectSettings);
    await addAuthUserPoolOnlyWithOAuth(ogProjectRoot, ogSettings);
    await amplifyPushAuth(ogProjectRoot);

    ogProjectDetails = getOGAuthProjectDetails(ogProjectRoot);

    dummyOGProjectRoot = await createNewProjectDir(dummyOGProjectSettings.name);
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
        await deleteAppClient(profileName, ogProjectRoot, appClientId);
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
        await deleteAppClient(profileName, ogProjectRoot, appClientId);
      }
    }
  });
});
