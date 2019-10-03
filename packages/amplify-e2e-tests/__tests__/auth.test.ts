require('../src/aws-matchers/'); // custom matcher for assertion
const fs = require('fs');
import {
  initProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  amplifyPush
} from '../src/init';
import {
  addAuthWithDefault,
  addAuthWithDefaultSocial,
  addAuthWithGroupTrigger,
  addAuthWithRecaptchaTrigger,
  addAuthWithCustomTrigger,
  updateAuthWithoutCustomTrigger,
  addAuthViaAPIWithTrigger,
  addAuthWithMaxOptions
} from '../src/categories/auth';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, getUserPool, getUserPoolClients, getLambdaFunction } from '../src/utils';

const defaultsSettings = {
  name: 'authTest',
}

describe('amplify add auth...', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
    jest.setTimeout(1000 * 60 * 60); // 1 hour
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('...should init a project and add auth with defaults', async () => {
    await initProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    await expect(userPool.UserPool).toBeDefined()
  });

  it('...should init a project and add auth with defaultSocial', async () => {
    await initProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefaultSocial(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clients = await getUserPoolClients(id, meta.providers.awscloudformation.Region);
    await expect(userPool.UserPool).toBeDefined();
    await expect(clients).toHaveLength(2);
    await expect(clients[0].UserPoolClient.CallbackURLs[0]).toEqual('https://www.google.com/');
    await expect(clients[0].UserPoolClient.LogoutURLs[0]).toEqual('https://www.nytimes.com/');
    await expect(clients[0].UserPoolClient.SupportedIdentityProviders).toHaveLength(4);
  });

  it('...should init a project and add auth a PostConfirmation: add-to-group trigger', async () => {
    await initProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithGroupTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const functionName = `${Object.keys(meta.auth)[0]}PostConfirmation-integtest`;

    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clients = await getUserPoolClients(id, meta.providers.awscloudformation.Region);
    const lambdaFunction =  await getLambdaFunction(functionName, meta.providers.awscloudformation.Region)
    await expect(userPool.UserPool).toBeDefined();
    await expect(clients).toHaveLength(2);
    await expect(lambdaFunction).toBeDefined();
    await expect(lambdaFunction.Configuration.Environment.Variables.GROUP).toEqual('mygroup');
  });

  it('...should allow the user to add auth via API category, with a trigger', async () => {
    await initProjectWithProfile(projRoot, defaultsSettings);
    await addAuthViaAPIWithTrigger(projRoot, {});
    await amplifyPush(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const functionName = `${Object.keys(meta.auth)[0]}PostConfirmation-integtest`;

    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clients = await getUserPoolClients(id, meta.providers.awscloudformation.Region);
    const lambdaFunction =  await getLambdaFunction(functionName, meta.providers.awscloudformation.Region)
    await expect(userPool.UserPool).toBeDefined();
    await expect(clients).toHaveLength(2);
    await expect(lambdaFunction).toBeDefined();
    await expect(lambdaFunction.Configuration.Environment.Variables.GROUP).toEqual('mygroup');
  });

  it('...should init a project and add 3 custom auth flow triggers for Google reCaptcha', async () => {
    await initProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithRecaptchaTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const createFunctionName = `${Object.keys(meta.auth)[0]}CreateAuthChallenge-integtest`;
    const defineFunctionName = `${Object.keys(meta.auth)[0]}DefineAuthChallenge-integtest`;
    const verifyFunctionName = `${Object.keys(meta.auth)[0]}VerifyAuthChallengeResponse-integtest`;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clients = await getUserPoolClients(id, meta.providers.awscloudformation.Region);
    const createFunction =  await getLambdaFunction(createFunctionName, meta.providers.awscloudformation.Region)
    const defineFunction =  await getLambdaFunction(defineFunctionName, meta.providers.awscloudformation.Region)
    const verifyFunction =  await getLambdaFunction(verifyFunctionName, meta.providers.awscloudformation.Region)

    await expect(userPool.UserPool).toBeDefined();
    await expect(clients).toHaveLength(2);
    await expect(createFunction).toBeDefined();
    await expect(defineFunction).toBeDefined();
    await expect(verifyFunction).toBeDefined();
    await expect(verifyFunction.Configuration.Environment.Variables.RECAPTCHASECRET).toEqual('dummykey');
  });

  it('...should init a project where all possible options are selected', async () => {
    await initProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithMaxOptions(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const createFunctionName = `${Object.keys(meta.auth)[0]}CreateAuthChallenge-integtest`;
    const defineFunctionName = `${Object.keys(meta.auth)[0]}DefineAuthChallenge-integtest`;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clients = await getUserPoolClients(id, meta.providers.awscloudformation.Region);
    const createFunction =  await getLambdaFunction(createFunctionName, meta.providers.awscloudformation.Region)
    const defineFunction =  await getLambdaFunction(defineFunctionName, meta.providers.awscloudformation.Region)

    await expect(userPool.UserPool).toBeDefined();
    await expect(clients).toHaveLength(2);
    await expect(createFunction).toBeDefined();
    await expect(defineFunction).toBeDefined();

    await expect(createFunction.Configuration.Environment.Variables.MODULES).toEqual('custom');
    await expect(defineFunction.Configuration.Environment.Variables.MODULES).toEqual('custom');
  })

});

describe('amplify updating auth...', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
    jest.setTimeout(1000 * 60 * 60); // 1 hour
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('...should init a project and add auth with a custom trigger, and then update to remove the custom js while leaving the other js', async () => {
    await initProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithCustomTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const functionName = `${Object.keys(meta.auth)[0]}PreSignup-integtest`;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clients = await getUserPoolClients(id, meta.providers.awscloudformation.Region);
    const lambdaFunction =  await getLambdaFunction(functionName, meta.providers.awscloudformation.Region)
    const dirContents = fs.readdirSync(`${projRoot}/amplify/backend/function/${Object.keys(meta.auth)[0]}PreSignup/src`)
    await expect(dirContents.includes('custom.js')).toBeTruthy();
    await expect(userPool.UserPool).toBeDefined();
    await expect(clients).toHaveLength(2);
    await expect(lambdaFunction).toBeDefined();
    await expect(lambdaFunction.Configuration.Environment.Variables.MODULES).toEqual('email-filter-blacklist,custom');

    await updateAuthWithoutCustomTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    const updatedFunction = await getLambdaFunction(functionName, meta.providers.awscloudformation.Region)
    const updatedDirContents = fs.readdirSync(`${projRoot}/amplify/backend/function/${Object.keys(meta.auth)[0]}PreSignup/src`)
    await expect(updatedDirContents.includes('custom.js')).toBeFalsy();
    await expect(updatedDirContents.includes('email-filter-blacklist.js')).toBeTruthy();
    await expect(updatedFunction.Configuration.Environment.Variables.MODULES).toEqual('email-filter-blacklist');
  });
});
