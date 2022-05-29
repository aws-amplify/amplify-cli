import * as fs from 'fs-extra';
import * as path from 'path';
import {
  initJSProjectWithProfile,
  initFlutterProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  getAwsIOSConfig,
  getUserPoolClients,
  getParameters,
  setParameters,
  initIosProjectWithProfile,
  getAwsAndroidConfig,
  initAndroidProjectWithProfile,
  getCLIInputs,
  setCLIInputs,
  getAppId,
  addAuthWithDefaultSocial,
  updateAuthSignInSignOutUrl,
  amplifyPull,
} from 'amplify-e2e-core';
import { addAuthWithDefault, runAmplifyAuthConsole, removeAuthWithDefault } from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, getUserPool } from 'amplify-e2e-core';

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

  it('...should init a project and add auth with defaults', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot, {});
    await amplifyPushAuth(projRoot);
    await runAmplifyAuthConsole(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();
  });

  it('...should init a project and add auth with defaults, pull project and push again', async () => {
    await initJSProjectWithProfile(projRoot, {
      disableAmplifyAppCreation: false,
      name: 'authtest',
    });
    await addAuthWithDefaultSocial(projRoot, {});
    await amplifyPushAuth(projRoot);
    const appId = getAppId(projRoot);
    const projRootPullAuth = await createNewProjectDir('authPullTest');
    await amplifyPull(projRootPullAuth, {
      emptyDir: true,
      noUpdateBackend: false,
      appId
    });
    await updateAuthSignInSignOutUrl(projRootPullAuth, {
      signinUrl: 'https://www.google.com/',
      signoutUrl: 'https://www.nytimes.com/',
      updatesigninUrl: 'http://localhost:3003/',
      updatesignoutUrl: 'http://localhost:3004/',
    });
    await amplifyPushAuth(projRootPullAuth);
    deleteProjectDir(projRootPullAuth);
  });

  it('...should init an IOS project and add default auth', async () => {
    await initIosProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot, {});
    await amplifyPushAuth(projRoot);
    let config = await getAwsIOSConfig(projRoot);
    expect(config.CognitoUserPool.Default.AppClientSecret).toBeUndefined();
    let meta = getProjectMeta(projRoot);
    let id = Object.keys(meta.auth)[0];
    let authMeta = meta.auth[id];
    let clientIds = [authMeta.output.AppClientID];
    let clients = await getUserPoolClients(authMeta.output.UserPoolId, clientIds, meta.providers.awscloudformation.Region);
    expect(clients[0].UserPoolClient.ClientSecret).toBeUndefined();

    //update parameter to generate client Secret
    const parameters = getCLIInputs(projRoot, 'auth', id);
    parameters.cognitoConfig.userpoolClientGenerateSecret = true;
    setCLIInputs(projRoot, 'auth', id, parameters);

    await amplifyPushAuth(projRoot);

    config = await getAwsIOSConfig(projRoot);
    expect(config.CognitoUserPool.Default.AppClientSecret).toBeDefined();
    meta = getProjectMeta(projRoot);
    id = Object.keys(meta.auth)[0];
    authMeta = meta.auth[id];
    clientIds = [authMeta.output.AppClientID];
    clients = await getUserPoolClients(authMeta.output.UserPoolId, clientIds, meta.providers.awscloudformation.Region);
    expect(clients[0].UserPoolClient.ClientSecret).toBeDefined();
  });

  it('...should init an Android project and add default auth', async () => {
    await initAndroidProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot, {});
    await amplifyPushAuth(projRoot);
    let config = await getAwsAndroidConfig(projRoot);
    expect(config.CognitoUserPool.Default.AppClientSecret).toBeUndefined();
    let meta = getProjectMeta(projRoot);
    let id = Object.keys(meta.auth)[0];
    let authMeta = meta.auth[id];
    let clientIds = [authMeta.output.AppClientID];
    let clients = await getUserPoolClients(authMeta.output.UserPoolId, clientIds, meta.providers.awscloudformation.Region);

    expect(clients[0].UserPoolClient.ClientSecret).toBeUndefined();
    const parameters = getCLIInputs(projRoot, 'auth', id);
    parameters.cognitoConfig.userpoolClientGenerateSecret = true;
    setCLIInputs(projRoot, 'auth', id, parameters);

    await amplifyPushAuth(projRoot);

    config = await getAwsAndroidConfig(projRoot);
    expect(config.CognitoUserPool.Default.AppClientSecret).toBeDefined();
    meta = getProjectMeta(projRoot);
    id = Object.keys(meta.auth)[0];
    authMeta = meta.auth[id];
    clientIds = [authMeta.output.AppClientID];
    clients = await getUserPoolClients(authMeta.output.UserPoolId, clientIds, meta.providers.awscloudformation.Region);

    expect(clients[0].UserPoolClient.ClientSecret).toBeDefined();
  });

  it('should init with a long env name and add default auth', async () => {
    await initJSProjectWithProfile(projRoot, { ...defaultsSettings, envName: 'longenviro' });
    await addAuthWithDefault(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();
  });
});
