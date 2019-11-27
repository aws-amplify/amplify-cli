import * as fs from 'fs-extra';
import { initJSProjectWithProfile, deleteProject, amplifyPushAuth, amplifyPush } from '../init';
import {
  addAuthWithDefault,
  addAuthWithDefaultSocial,
  addAuthWithGroupTrigger,
  addAuthWithRecaptchaTrigger,
  addAuthWithCustomTrigger,
  updateAuthWithoutCustomTrigger,
  addAuthViaAPIWithTrigger,
  addAuthWithMaxOptions,
} from '../categories/auth';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, getUserPool, getUserPoolClients, getLambdaFunction } from '../utils';

const defaultsSettings = {
  name: 'authTest',
};

describe('amplify add auth...', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('...should init a project and add auth with defaults', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();
  });

  it('...should init a project and add auth with defaultSocial', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefaultSocial(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clients = await getUserPoolClients(id, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();
    expect(clients).toHaveLength(2);
    expect(clients[0].UserPoolClient.CallbackURLs[0]).toEqual('https://www.google.com/');
    expect(clients[0].UserPoolClient.LogoutURLs[0]).toEqual('https://www.nytimes.com/');
    expect(clients[0].UserPoolClient.SupportedIdentityProviders).toHaveLength(4);
  });

  it('...should init a project and add auth a PostConfirmation: add-to-group trigger', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithGroupTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const functionName = `${Object.keys(meta.auth)[0]}PostConfirmation-integtest`;

    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clients = await getUserPoolClients(id, meta.providers.awscloudformation.Region);
    const lambdaFunction = await getLambdaFunction(functionName, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();
    expect(clients).toHaveLength(2);
    expect(lambdaFunction).toBeDefined();
    expect(lambdaFunction.Configuration.Environment.Variables.GROUP).toEqual('mygroup');
  });

  it('...should allow the user to add auth via API category, with a trigger', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthViaAPIWithTrigger(projRoot, {});
    await amplifyPush(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const functionName = `${Object.keys(meta.auth)[0]}PostConfirmation-integtest`;

    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clients = await getUserPoolClients(id, meta.providers.awscloudformation.Region);
    const lambdaFunction = await getLambdaFunction(functionName, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();
    expect(clients).toHaveLength(2);
    expect(lambdaFunction).toBeDefined();
    expect(lambdaFunction.Configuration.Environment.Variables.GROUP).toEqual('mygroup');
  });

  it('...should init a project and add 3 custom auth flow triggers for Google reCaptcha', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithRecaptchaTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const createFunctionName = `${Object.keys(meta.auth)[0]}CreateAuthChallenge-integtest`;
    const defineFunctionName = `${Object.keys(meta.auth)[0]}DefineAuthChallenge-integtest`;
    const verifyFunctionName = `${Object.keys(meta.auth)[0]}VerifyAuthChallengeResponse-integtest`;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clients = await getUserPoolClients(id, meta.providers.awscloudformation.Region);
    const createFunction = await getLambdaFunction(createFunctionName, meta.providers.awscloudformation.Region);
    const defineFunction = await getLambdaFunction(defineFunctionName, meta.providers.awscloudformation.Region);
    const verifyFunction = await getLambdaFunction(verifyFunctionName, meta.providers.awscloudformation.Region);

    expect(userPool.UserPool).toBeDefined();
    expect(clients).toHaveLength(2);
    expect(createFunction).toBeDefined();
    expect(defineFunction).toBeDefined();
    expect(verifyFunction).toBeDefined();
    expect(verifyFunction.Configuration.Environment.Variables.RECAPTCHASECRET).toEqual('dummykey');
  });

  it('...should init a project where all possible options are selected', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithMaxOptions(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[1].output.UserPoolId;
    const createFunctionName = `${Object.keys(meta.auth)[1]}CreateAuthChallenge-integtest`;
    const defineFunctionName = `${Object.keys(meta.auth)[1]}DefineAuthChallenge-integtest`;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clients = await getUserPoolClients(id, meta.providers.awscloudformation.Region);
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
  beforeEach(() => {
    projRoot = createNewProjectDir();
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('...should init a project and add auth with a custom trigger, and then update to remove the custom js while leaving the other js', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithCustomTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const functionName = `${Object.keys(meta.auth)[0]}PreSignup-integtest`;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clients = await getUserPoolClients(id, meta.providers.awscloudformation.Region);
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
});
