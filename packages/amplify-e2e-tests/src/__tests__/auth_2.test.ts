import * as fs from 'fs-extra';
import {
  initJSProjectWithProfile,
  initAndroidProjectWithProfile,
  initIosProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  amplifyPush,
} from 'amplify-e2e-core';
import {
  addAuthWithDefault,
  removeAuthWithDefault,
  addAuthWithDefaultSocial,
  addAuthWithGroupTrigger,
  addAuthWithRecaptchaTrigger,
  addAuthWithCustomTrigger,
  addAuthWithSignInSignOutUrl,
  updateAuthWithoutCustomTrigger,
  updateAuthRemoveRecaptchaTrigger,
  updateAuthSignInSignOutUrl,
  addAuthViaAPIWithTrigger,
  addAuthWithMaxOptions,
  addAuthUserPoolOnly,
} from 'amplify-e2e-core';
import {
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
  getAwsAndroidConfig,
  getAwsIOSConfig,
  getUserPool,
  getUserPoolClients,
  getLambdaFunction,
} from 'amplify-e2e-core';

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

  it('...should init a project with only user pool and no identity pool', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthUserPoolOnly(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[1].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);

    expect(userPool.UserPool).toBeDefined();
  });

  it('...should init a project where all possible options are selected', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithMaxOptions(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);

    const createFunctionName = `${Object.keys(meta.auth)[1]}CreateAuthChallenge-integtest`;
    const defineFunctionName = `${Object.keys(meta.auth)[1]}DefineAuthChallenge-integtest`;

    const authMeta = Object.keys(meta.auth).map(key => meta.auth[key])[1];
    const id = authMeta.output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clientIds = [authMeta.output.AppClientIDWeb, authMeta.output.AppClientID];
    const clients = await getUserPoolClients(id, clientIds, meta.providers.awscloudformation.Region);

    const createFunction = await getLambdaFunction(createFunctionName, meta.providers.awscloudformation.Region);
    const defineFunction = await getLambdaFunction(defineFunctionName, meta.providers.awscloudformation.Region);

    expect(userPool.UserPool).toBeDefined();
    expect(clients).toHaveLength(2);
    expect(createFunction).toBeDefined();
    expect(defineFunction).toBeDefined();

    expect(createFunction.Configuration.Environment.Variables.MODULES).toEqual('custom');
    expect(defineFunction.Configuration.Environment.Variables.MODULES).toEqual('custom');
  });
});

describe('amplify updating auth...', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth-update');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('...should edit signin url on update', async () => {
    const settings = {
      signinUrl: 'http://localhost:3001/',
      signoutUrl: 'http://localhost:3002/',
      updatesigninUrl: 'http://localhost:3003/',
      updatesignoutUrl: 'http://localhost:3004/',
    };
    await initAndroidProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithSignInSignOutUrl(projRoot, settings);
    await updateAuthSignInSignOutUrl(projRoot, settings);
  });

  it('...should init a project and add auth with a custom trigger, and then update to remove the custom js while leaving the other js', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithCustomTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);

    const functionName = `${Object.keys(meta.auth)[0]}PreSignup-integtest`;

    const authMeta = Object.keys(meta.auth).map(key => meta.auth[key])[0];
    const id = authMeta.output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clientIds = [authMeta.output.AppClientIDWeb, authMeta.output.AppClientID];
    const clients = await getUserPoolClients(id, clientIds, meta.providers.awscloudformation.Region);

    const lambdaFunction = await getLambdaFunction(functionName, meta.providers.awscloudformation.Region);
    const dirContents = fs.readdirSync(`${projRoot}/amplify/backend/function/${Object.keys(meta.auth)[0]}PreSignup/src`);
    expect(dirContents.includes('custom.js')).toBeTruthy();
    expect(userPool.UserPool).toBeDefined();
    expect(clients).toHaveLength(2);
    expect(lambdaFunction).toBeDefined();
    expect(lambdaFunction.Configuration.Environment.Variables.MODULES).toEqual('email-filter-blacklist,custom');

    await updateAuthWithoutCustomTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    const updatedFunction = await getLambdaFunction(functionName, meta.providers.awscloudformation.Region);
    const updatedDirContents = fs.readdirSync(`${projRoot}/amplify/backend/function/${Object.keys(meta.auth)[0]}PreSignup/src`);
    expect(updatedDirContents.includes('custom.js')).toBeFalsy();
    expect(updatedDirContents.includes('email-filter-blacklist.js')).toBeTruthy();
    expect(updatedFunction.Configuration.Environment.Variables.MODULES).toEqual('email-filter-blacklist');
  });

  it('...should init an android project and add customAuth flag, and remove flag when custom auth triggers are removed upon update ', async () => {
    await initAndroidProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithRecaptchaTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    let meta = getAwsAndroidConfig(projRoot);
    expect(meta.Auth.Default.authenticationFlowType).toBeDefined();
    expect(meta.Auth.Default.authenticationFlowType).toEqual('CUSTOM_AUTH');
    await updateAuthRemoveRecaptchaTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    meta = getAwsAndroidConfig(projRoot);
    expect(meta.Auth.Default.authenticationFlowType).toBeDefined();
    expect(meta.Auth.Default.authenticationFlowType).toEqual('USER_SRP_AUTH');
  });

  it('...should init an ios project and add customAuth flag, and remove the flag when custom auth triggers are removed upon update', async () => {
    await initIosProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithRecaptchaTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    let meta = getAwsIOSConfig(projRoot);
    expect(meta.Auth.Default.authenticationFlowType).toBeDefined();
    expect(meta.Auth.Default.authenticationFlowType).toEqual('CUSTOM_AUTH');
    await updateAuthRemoveRecaptchaTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    meta = getAwsIOSConfig(projRoot);
    expect(meta.Auth.Default.authenticationFlowType).toBeDefined();
    expect(meta.Auth.Default.authenticationFlowType).toEqual('USER_SRP_AUTH');
  });
});
