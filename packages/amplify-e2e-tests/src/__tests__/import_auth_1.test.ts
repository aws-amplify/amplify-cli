import * as path from 'path';
import * as fs from 'fs-extra';
import { v4 as uuid } from 'uuid';
import _ from 'lodash';
import { $TSObject, JSONUtilities } from 'amplify-cli-core';
import {
  nspawn as spawn,
  getCLIPath,
  addAuthUserPoolOnlyWithOAuth,
  AddAuthUserPoolOnlyWithOAuthSettings,
  AddAuthUserPoolOnlyNoOAuthSettings,
  amplifyPush,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initJSProjectWithProfile,
  getBackendAmplifyMeta,
  amplifyStatus,
  getTeamProviderInfo,
  addApiWithCognitoUserPoolAuthTypeWhenAuthExists,
  addFunction,
  getAppId,
  amplifyPull,
  getBackendConfig,
  getEnvVars,
  initProjectWithAccessKey,
} from 'amplify-e2e-core';
import { randomizedFunctionName } from '../schema-api-directives/functionTester';
import { getCognitoResourceName } from '../schema-api-directives/authHelper';
import { addEnvironmentWithImportedAuth, checkoutEnvironment, removeEnvironment } from '../environment/env';

const projectPrefix = 'authimp';
const ogProjectPrefix = 'ogauthimp';

const projectSettings = {
  name: projectPrefix,
};

const ogProjectSettings = {
  name: ogProjectPrefix,
};

const getShortId = (): string => {
  const [shortId] = uuid().split('-');

  return shortId;
};

type ProjectDetails = {
  authResourceName?: string;
  parameters?: {
    authSelections?: string;
    resourceName?: string;
    serviceType?: string;
  };
  meta?: {
    UserPoolId?: string;
    UserPoolName?: string;
    AppClientID?: string;
    AppClientSecret?: string;
    AppClientIDWeb?: string;
    HostedUIDomain?: string;
    OAuthMetadata?: $TSObject;
  };
  team?: {
    userPoolId?: string;
    userPoolName?: string;
    webClientId?: string;
    nativeClientId?: string;
    hostedUIProviderCreds?: $TSObject;
  };
};

const createNoOAuthSettings = (projectPrefix: string, shortId: string): AddAuthUserPoolOnlyNoOAuthSettings => {
  return {
    resourceName: `${projectPrefix}res${shortId}`,
    userPoolName: `${projectPrefix}up${shortId}`,
  };
};

const createWithOAuthSettings = (projectPrefix: string, shortId: string): AddAuthUserPoolOnlyWithOAuthSettings => {
  return {
    resourceName: `${projectPrefix}oares${shortId}`,
    userPoolName: `${projectPrefix}oaup${shortId}`,
    domainPrefix: `${projectPrefix}oadom${shortId}`,
    signInUrl1: 'https://sin1/',
    signInUrl2: 'https://sin2/',
    signOutUrl1: 'https://sout1/',
    signOutUrl2: 'https://sout2/',
    facebookAppId: `facebookAppId`,
    facebookAppSecret: `facebookAppSecret`,
    googleAppId: `googleAppId`,
    googleAppSecret: `googleAppSecret`,
    amazonAppId: `amazonAppId`,
    amazonAppSecret: `amazonAppSecret`,
  };
};

describe('auth import userpool only', () => {
  // OG is the CLI project that creates the user pool to import by other test projects
  let ogProjectRoot: string;
  let ogShortId: string;
  let ogSettings: AddAuthUserPoolOnlyWithOAuthSettings;
  let ogProjectDetails: ProjectDetails;

  let projectRoot: string;
  let ignoreProjectDeleteErrors: boolean = false;

  beforeAll(async () => {
    ogProjectRoot = await createNewProjectDir(ogProjectSettings.name);
    ogShortId = getShortId();
    ogSettings = createWithOAuthSettings(ogProjectSettings.name, ogShortId);

    await initJSProjectWithProfile(ogProjectRoot, ogProjectSettings);
    await addAuthUserPoolOnlyWithOAuth(ogProjectRoot, ogSettings);
    await amplifyPushAuth(ogProjectRoot);

    ogProjectDetails = getOGProjectDetails(ogProjectRoot);
  });

  afterAll(async () => {
    await deleteProject(ogProjectRoot);
    deleteProjectDir(ogProjectRoot);
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
    await importUserPoolOnly(projectRoot, ogSettings.userPoolName);

    let projectDetails = getProjectDetails(projectRoot);

    expectProjectDetailsMatch(projectDetails, ogProjectDetails);

    await amplifyStatus(projectRoot, 'Import');
    await amplifyPushAuth(projectRoot);
    await amplifyStatus(projectRoot, 'No Change');

    expectLocalAndCloudMetaFilesMatching(projectRoot);

    projectDetails = getProjectDetails(projectRoot);

    expectProjectDetailsMatch(projectDetails, ogProjectDetails);

    await removeImportedAuthWithDefault(projectRoot);
    await amplifyStatus(projectRoot, 'Unlink');

    await amplifyPushAuth(projectRoot);

    expectNoAuthInMeta(projectRoot);

    expectLocalTeamInfoHasNoCategories(projectRoot);
  });

  it('imported auth with graphql api and cognito should push', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await importUserPoolOnly(projectRoot, ogSettings.userPoolName);
    await addApiWithCognitoUserPoolAuthTypeWhenAuthExists(projectRoot);
    await amplifyPush(projectRoot);

    const projectDetails = getProjectDetails(projectRoot);

    expectApiHasCorrectAuthConfig(projectRoot, ogProjectDetails.meta.UserPoolId);
  });

  it('imported auth with function and crud on auth should push', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await importUserPoolOnly(projectRoot, ogSettings.userPoolName);

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

    const projectDetails = getProjectDetails(projectRoot);

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
    const functionStack = JSON.parse(fs.readFileSync(functionStackFilePath).toString());
    expect(functionStack.Resources?.LambdaFunction?.Properties?.Environment?.Variables[userPoolIDEnvVarName].Ref).toEqual(
      authParameterName,
    );

    // Verify if generated policy has the userpool id as resource
    expect(functionStack.Resources?.AmplifyResourcesPolicy?.Properties?.PolicyDocument?.Statement[0].Resource[0]['Fn::Join'][1][5]).toEqual(
      projectDetails.meta.UserPoolId,
    );
  });

  it('imported auth, s3 storage add should fail with error', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await importUserPoolOnly(projectRoot, ogSettings.userPoolName);

    // Imported auth resources cannot be used together with \'storage\' category\'s authenticated and unauthenticated access.
    await expect(addS3WithAuthConfigurationMismatchErrorExit(projectRoot, {})).rejects.toThrowError(
      'Process exited with non zero exit code 1',
    );
  });

  it('imported auth, push, pull to empty directory, files should match', async () => {
    await initJSProjectWithProfile(projectRoot, {
      ...projectSettings,
      disableAmplifyAppCreation: false,
    });
    await importUserPoolOnly(projectRoot, ogSettings.userPoolName);

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
      expectLocalAndOGMetaFilesOutputMatching(projectRoot, projectRootPull);
    } finally {
      deleteProjectDir(projectRootPull);
    }
  });

  it('imported auth, create prod env, files should match', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await importUserPoolOnly(projectRoot, ogSettings.userPoolName);

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
    expectLocalAndOGMetaFilesOutputMatching(projectRoot, ogProjectRoot);

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

    const { ACCESS_KEY_ID, SECRET_ACCESS_KEY } = getEnvVars();
    if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
      throw new Error('Set AWS_ACCESS_KEY_ID and SECRET_ACCESS_KEY either in .env file or as Environment variable');
    }

    const newProjectRegion = process.env.CLI_REGION === 'us-west-2' ? 'us-east-2' : 'us-west-2';

    await initProjectWithAccessKey(projectRoot, {
      ...projectSettings,
      envName: 'integtest',
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
      region: newProjectRegion,
    } as any);

    // The previously configured Cognito User Pool: '${userPoolName}' (${userPoolId}) cannot be found.
    await expect(await importUserPoolOnly(projectRoot, ogSettings.userPoolName)).rejects.toThrowError(
      'Process exited with non zero exit code 1',
    );
  });
});

const getProjectDetails = (projectRoot: string): ProjectDetails => {
  const meta = getBackendAmplifyMeta(projectRoot);
  const team = getTeamProviderInfo(projectRoot);

  const authMetaKey = Object.keys(meta.auth)
    .filter(key => meta.auth[key].service === 'Cognito')
    .map(key => key)[0];

  const authMeta = meta.auth[authMetaKey];
  const authTeam = _.get(team, ['integtest', 'categories', 'auth', authMetaKey]);
  const parameters = readAuthParametersJson(projectRoot, authMetaKey);

  return {
    authResourceName: authMetaKey,
    parameters: {
      authSelections: parameters.authSelections,
      resourceName: parameters.userPoolName,
    },
    meta: {
      UserPoolId: authMeta.output.UserPoolId,
      UserPoolName: authMeta.output.UserPoolName,
      AppClientID: authMeta.output.AppClientID,
      AppClientSecret: authMeta.output.AppClientSecret,
      AppClientIDWeb: authMeta.output.AppClientIDWeb,
      HostedUIDomain: authMeta.output.HostedUIDomain,
      OAuthMetadata: authMeta.output.OAuthMetadata ? JSON.parse(authMeta.output.OAuthMetadata) : undefined,
    },
    team: {
      userPoolId: authTeam.userPoolId,
      userPoolName: authTeam.userPoolName,
      webClientId: authTeam.webClientId,
      nativeClientId: authTeam.nativeClientId,
      hostedUIProviderCreds: authTeam.hostedUIProviderCreds ? JSON.parse(authTeam.hostedUIProviderCreds) : undefined,
    },
  };
};

const getOGProjectDetails = (projectRoot: string): ProjectDetails => {
  const meta = getBackendAmplifyMeta(projectRoot);
  const team = getTeamProviderInfo(projectRoot);

  const authMetaKey = Object.keys(meta.auth)
    .filter(key => meta.auth[key].service === 'Cognito')
    .map(key => key)[0];

  const authMeta = meta.auth[authMetaKey];
  const authTeam = _.get(team, ['integtest', 'categories', 'auth', authMetaKey]);
  const parameters = readAuthParametersJson(projectRoot, authMetaKey);

  return {
    authResourceName: authMetaKey,
    parameters: {
      authSelections: parameters.authSelections,
      resourceName: parameters.userPoolName,
    },
    meta: {
      UserPoolId: authMeta.output.UserPoolId,
      UserPoolName: authMeta.output.UserPoolName,
      AppClientID: authMeta.output.AppClientID,
      AppClientSecret: authMeta.output.AppClientSecret,
      AppClientIDWeb: authMeta.output.AppClientIDWeb,
      HostedUIDomain: authMeta.output.HostedUIDomain,
      OAuthMetadata: authMeta.output.OAuthMetadata ? JSON.parse(authMeta.output.OAuthMetadata) : undefined,
    },
    team: {
      userPoolId: authMeta.output.UserPoolId,
      userPoolName: authMeta.output.UserPoolName,
      webClientId: authMeta.output.AppClientIDWeb,
      nativeClientId: authMeta.output.AppClientID,
      hostedUIProviderCreds: authTeam.hostedUIProviderCreds ? JSON.parse(authTeam.hostedUIProviderCreds) : undefined,
    },
  };
};

const expectProjectDetailsMatch = (projectDetails: ProjectDetails, ogProjectDetails: ProjectDetails) => {
  expect(projectDetails.parameters.authSelections).toEqual(ogProjectDetails.parameters.authSelections);

  expect(projectDetails.meta.UserPoolId).toEqual(ogProjectDetails.meta.UserPoolId);
  expect(projectDetails.meta.AppClientID).toEqual(ogProjectDetails.meta.AppClientID);
  expect(projectDetails.meta.AppClientSecret).toEqual(ogProjectDetails.meta.AppClientSecret);
  expect(projectDetails.meta.AppClientIDWeb).toEqual(ogProjectDetails.meta.AppClientIDWeb);
  expect(projectDetails.meta.HostedUIDomain).toEqual(ogProjectDetails.meta.HostedUIDomain);

  if (projectDetails.meta.OAuthMetadata) {
    expect(ogProjectDetails.meta.OAuthMetadata).toBeDefined();

    expect(projectDetails.meta.OAuthMetadata.AllowedOAuthFlows).toEqual(ogProjectDetails.meta.OAuthMetadata.AllowedOAuthFlows);
    expect(projectDetails.meta.OAuthMetadata.AllowedOAuthScopes.sort()).toEqual(
      ogProjectDetails.meta.OAuthMetadata.AllowedOAuthScopes.sort(),
    );
    expect(projectDetails.meta.OAuthMetadata.CallbackURLs).toEqual(ogProjectDetails.meta.OAuthMetadata.CallbackURLs);
    expect(projectDetails.meta.OAuthMetadata.LogoutURLs).toEqual(ogProjectDetails.meta.OAuthMetadata.LogoutURLs);
  }

  expect(projectDetails.team.userPoolId).toEqual(ogProjectDetails.team.userPoolId);
  expect(projectDetails.team.webClientId).toEqual(ogProjectDetails.team.webClientId);
  expect(projectDetails.team.nativeClientId).toEqual(ogProjectDetails.team.nativeClientId);
  expect(projectDetails.team.hostedUIProviderCreds).toMatchObject(ogProjectDetails.team.hostedUIProviderCreds);
};

const importUserPoolOnly = (cwd: string, autoCompletePrefix: string) => {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['auth', 'import'], { cwd, stripColors: true })
      .wait('What type of auth resource do you want to import')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Select the User Pool you want to import')
      .send(autoCompletePrefix)
      .delay(500) // Some delay required for autocomplete and terminal to catch up
      .sendCarriageReturn()
      .wait('- JavaScript: https://docs.amplify.aws/lib/auth/getting-started/q/platform/js')
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
};

const removeImportedAuthWithDefault = (cwd: string) => {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['auth', 'remove'], { cwd, stripColors: true })
      .wait('Choose the resource you would want to remove')
      .sendCarriageReturn()
      .wait('Are you sure you want to unlink this imported resource')
      .sendConfirmYes()
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
};

const expectLocalAndCloudMetaFilesMatching = (projectRoot: string) => {
  const cloudMeta = getProjectMeta(projectRoot);
  const meta = getBackendAmplifyMeta(projectRoot);

  expect(cloudMeta).toMatchObject(meta);
};

const expectLocalAndOGMetaFilesOutputMatching = (projectRoot: string, ogProjectRoot: string) => {
  const meta = getBackendAmplifyMeta(projectRoot);
  const ogMeta = getBackendAmplifyMeta(ogProjectRoot);

  const authMeta = Object.keys(meta.auth)
    .filter(key => meta.auth[key].service === 'Cognito')
    .map(key => meta.auth[key])[0];

  const ogAuthMeta = Object.keys(ogMeta.auth)
    .filter(key => ogMeta.auth[key].service === 'Cognito')
    .map(key => ogMeta.auth[key])[0];

  expect(authMeta.output.AppClientID).toEqual(ogAuthMeta.output.AppClientID);
  expect(authMeta.output.AppClientIDWeb).toEqual(ogAuthMeta.output.AppClientIDWeb);
  expect(authMeta.output.AppClientSecret).toEqual(ogAuthMeta.output.AppClientSecret);
  expect(authMeta.output.HostedUIDomain).toEqual(ogAuthMeta.output.HostedUIDomain);
  expect(authMeta.output.UserPoolId).toEqual(ogAuthMeta.output.UserPoolId);
};

const expectNoAuthInMeta = (projectRoot: string) => {
  const meta = getBackendAmplifyMeta(projectRoot);

  expect(meta.auth).toBeDefined();
  expect(meta.auth).toMatchObject({});
};

const expectLocalTeamInfoHasNoCategories = (projectRoot: string) => {
  const team = getTeamProviderInfo(projectRoot);

  expect(team.integtest.categories).toBeUndefined();
};

const readApiParametersJson = (projectRoot: string): $TSObject => {
  const parametersFilePath = path.join(projectRoot, 'amplify', 'backend', 'api', projectPrefix, 'parameters.json');
  const parameters = JSONUtilities.readJson(parametersFilePath);

  return parameters;
};

const readAuthParametersJson = (projectRoot: string, resourceName: string): $TSObject => {
  const parametersFilePath = path.join(projectRoot, 'amplify', 'backend', 'auth', resourceName, 'parameters.json');
  const parameters = JSONUtilities.readJson(parametersFilePath);

  return parameters;
};

const readRootStack = (projectRoot: string): $TSObject => {
  const rootStackFilePath = path.join(projectRoot, 'amplify', 'backend', 'awscloudformation', 'nested-cloudformation-stack.yml');
  const rootStack = JSONUtilities.readJson(rootStackFilePath);

  return rootStack;
};

const expectApiHasCorrectAuthConfig = (projectRoot: string, userPoolId: string) => {
  const meta = getBackendAmplifyMeta(projectRoot);

  const authConfig = meta.api?.authimp?.output?.authConfig;

  expect(authConfig).toBeDefined();

  expect(authConfig.defaultAuthentication?.authenticationType).toEqual('AMAZON_COGNITO_USER_POOLS');
  expect(authConfig.defaultAuthentication?.userPoolConfig?.userPoolId).toEqual(userPoolId);

  const parameters = readApiParametersJson(projectRoot);

  expect(parameters?.AuthCognitoUserPoolId).toEqual(userPoolId);

  const rootStack = readRootStack(projectRoot);

  expect(rootStack.Resources?.apiauthimp?.Properties?.Parameters?.AuthCognitoUserPoolId).toEqual(userPoolId);
};

const addS3WithAuthConfigurationMismatchErrorExit = (cwd: string, settings: any) => {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services')
      .sendCarriageReturn()
      .wait('Please provide a friendly name')
      .sendCarriageReturn()
      .wait('Please provide bucket name')
      .sendCarriageReturn()
      .wait('Who should have access')
      .sendCarriageReturn()
      .wait('What kind of access do you want')
      .sendLine(' ')
      .wait('Do you want to add a Lambda Trigger for your S3 Bucket')
      .sendConfirmNo()
      .wait('Current auth configuration is: userPoolOnly, but identityPoolAndUserPool was required.')
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
};

const expectLocalAndPulledBackendConfigMatching = (projectRoot: string, projectRootPull: string) => {
  const backendConfig = getBackendConfig(projectRoot);
  const backendConfigPull = getBackendConfig(projectRootPull);

  expect(backendConfig).toMatchObject(backendConfigPull);
};
