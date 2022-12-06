/* eslint-disable spellcheck/spell-checker */
import {
  addAuthWithDefaultSocial,
  amplifyPull,
  amplifyPush,
  amplifyPushAuth,
  addAuthWithGroupTrigger,
  addAuthViaAPIWithTrigger,
  addUserToUserPool,
  addAuthWithRecaptchaTrigger,
  addAuthwithUserPoolGroupsViaAPIWithTrigger,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  getLambdaFunction,
  getProjectMeta,
  getUserPool,
  getUserPoolClients,
  initJSProjectWithProfile,
  invokeFunction,
  isDeploymentSecretForEnvExists,
  removeAuthWithDefault,
  updateFunction,
  listUserPoolGroupsForUser,
  validateNodeModulesDirRemoval,
} from '@aws-amplify/amplify-e2e-core';

const defaultsSettings = {
  name: 'authTest',
};

describe('amplify add auth...', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('...should init a project and add auth with defaultSocial', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefaultSocial(projRoot, {});
    expect(isDeploymentSecretForEnvExists(projRoot, 'integtest')).toBeTruthy();
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    expect(isDeploymentSecretForEnvExists(projRoot, 'integtest')).toBeFalsy();
    const authMeta = Object.keys(meta.auth).map(key => meta.auth[key])[0];
    const id = authMeta.output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clientIds = [authMeta.output.AppClientIDWeb, authMeta.output.AppClientID];
    const clients = await getUserPoolClients(id, clientIds, meta.providers.awscloudformation.Region);

    expect(userPool.UserPool).toBeDefined();
    expect(clients).toHaveLength(2);
    validateNodeModulesDirRemoval(projRoot);
    expect(clients[0].UserPoolClient.CallbackURLs[0]).toEqual('https://www.google.com/');
    expect(clients[0].UserPoolClient.LogoutURLs[0]).toEqual('https://www.nytimes.com/');
    expect(clients[0].UserPoolClient.SupportedIdentityProviders).toHaveLength(5);
  });

  it('...should init a project and add auth with defaultSocial, pull into empty dir, and then remove federation', async () => {
    await initJSProjectWithProfile(projRoot, { ...defaultsSettings, envName: 'integtest', disableAmplifyAppCreation: false });
    await addAuthWithDefaultSocial(projRoot, {});
    await amplifyPushAuth(projRoot);
    const appId = getAppId(projRoot);
    const projRoot2 = await createNewProjectDir('auth2');
    await amplifyPull(projRoot2, { yesFlag: true, appId, envName: 'integtest' });
    deleteProjectDir(projRoot2);
    await removeAuthWithDefault(projRoot);
    await amplifyPushAuth(projRoot);
  });

  it('...should init a project and add auth a PostConfirmation: add-to-group trigger', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithGroupTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);

    const functionName = `${Object.keys(meta.auth)[0]}PostConfirmation-integtest`;

    const authMeta = Object.keys(meta.auth).map(key => meta.auth[key])[0];
    const id = authMeta.output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clientIds = [authMeta.output.AppClientIDWeb, authMeta.output.AppClientID];
    const clients = await getUserPoolClients(id, clientIds, meta.providers.awscloudformation.Region);

    const lambdaFunction = await getLambdaFunction(functionName, meta.providers.awscloudformation.Region);
    validateNodeModulesDirRemoval(projRoot);
    expect(userPool.UserPool).toBeDefined();
    expect(clients).toHaveLength(2);
    expect(lambdaFunction).toBeDefined();
    expect(lambdaFunction.Configuration.Environment.Variables.GROUP).toEqual('mygroup');
  });

  it('...should allow the user to add auth via API category, with a trigger', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthViaAPIWithTrigger(projRoot, { transformerVersion: 1 });
    await amplifyPush(projRoot);
    const meta = getProjectMeta(projRoot);

    const functionName = `${Object.keys(meta.auth)[0]}PostConfirmation-integtest`;
    const authMeta = Object.keys(meta.auth).map(key => meta.auth[key])[0];
    const id = authMeta.output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clientIds = [authMeta.output.AppClientIDWeb, authMeta.output.AppClientID];
    const clients = await getUserPoolClients(id, clientIds, meta.providers.awscloudformation.Region);

    const lambdaFunction = await getLambdaFunction(functionName, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();
    expect(userPool.UserPool.AliasAttributes).not.toBeDefined();
    validateNodeModulesDirRemoval(projRoot);
    expect(clients).toHaveLength(2);
    expect(lambdaFunction).toBeDefined();
    expect(lambdaFunction.Configuration.Environment.Variables.GROUP).toEqual('mygroup');
  });

  it('...should allow the user to add auth via API category, with a trigger and function dependsOn API', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthwithUserPoolGroupsViaAPIWithTrigger(projRoot, { transformerVersion: 1 });
    await updateFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        additionalPermissions: {
          permissions: ['storage'],
          choices: ['function', 'auth', 'api', 'storage'],
          resources: ['Todo:@model(appsync)'],
          resourceChoices: ['Todo:@model(appsync)'],
          operations: ['read'],
        },
      },
      'nodejs',
    );
    await amplifyPush(projRoot);
    const meta = getProjectMeta(projRoot);
    const authKey = Object.keys(meta.auth).find(key => meta.auth[key].service === 'Cognito');
    const functionName = `${authKey}PostConfirmation-integtest`;
    const authMeta = meta.auth[authKey];
    const id = authMeta.output.UserPoolId;
    const region = meta.providers.awscloudformation.Region;
    const userPool = await getUserPool(id, region);
    const clientIds = [authMeta.output.AppClientIDWeb, authMeta.output.AppClientID];
    const clients = await getUserPoolClients(id, clientIds, region);
    await addUserToUserPool(id, region);
    const lambdaEvent = {
      userPoolId: id,
      userName: 'testUser',
    };
    const result = await invokeFunction(functionName, JSON.stringify(lambdaEvent), region);
    expect(result.StatusCode).toBe(200);
    const user1Groups = await listUserPoolGroupsForUser(id, lambdaEvent.userName, region);
    expect(user1Groups).toEqual(['mygroup']);
    expect(userPool.UserPool).toBeDefined();
    expect(Object.keys(userPool.UserPool.LambdaConfig)[0]).toBe('PostConfirmation');
    expect(Object.values(userPool.UserPool.LambdaConfig)[0]).toBe(meta.function[functionName.split('-')[0]].output.Arn);
    validateNodeModulesDirRemoval(projRoot);
    expect(clients).toHaveLength(2);
  });

  it('...should init a project and add 3 custom auth flow triggers for Google reCaptcha', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithRecaptchaTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);

    const createFunctionName = `${Object.keys(meta.auth)[0]}CreateAuthChallenge-integtest`;
    const defineFunctionName = `${Object.keys(meta.auth)[0]}DefineAuthChallenge-integtest`;
    const verifyFunctionName = `${Object.keys(meta.auth)[0]}VerifyAuthChallengeResponse-integtest`;

    const authMeta = Object.keys(meta.auth).map(key => meta.auth[key])[0];
    const id = authMeta.output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clientIds = [authMeta.output.AppClientIDWeb, authMeta.output.AppClientID];
    const clients = await getUserPoolClients(id, clientIds, meta.providers.awscloudformation.Region);

    const createFunction = await getLambdaFunction(createFunctionName, meta.providers.awscloudformation.Region);
    const defineFunction = await getLambdaFunction(defineFunctionName, meta.providers.awscloudformation.Region);
    const verifyFunction = await getLambdaFunction(verifyFunctionName, meta.providers.awscloudformation.Region);

    expect(userPool.UserPool).toBeDefined();
    validateNodeModulesDirRemoval(projRoot);
    expect(clients).toHaveLength(2);
    expect(createFunction).toBeDefined();
    expect(defineFunction).toBeDefined();
    expect(verifyFunction).toBeDefined();
    expect(verifyFunction.Configuration.Environment.Variables.RECAPTCHASECRET).toEqual('dummykey');
  });
});
