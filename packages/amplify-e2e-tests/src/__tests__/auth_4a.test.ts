import * as fs from 'fs-extra';
import {
  initJSProjectWithProfile,
  initAndroidProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  addAuthWithCustomTrigger,
  addAuthWithSignInSignOutUrl,
  updateAuthWithoutCustomTrigger,
  updateAuthSignInSignOutUrl,
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
  getUserPool,
  getUserPoolClients,
  getLambdaFunction,
} from '@aws-amplify/amplify-e2e-core';

const defaultsSettings = {
  name: 'authTest',
};

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

    const authMeta = Object.keys(meta.auth).map((key) => meta.auth[key])[0];
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
    expect(lambdaFunction.Configuration.Environment.Variables.MODULES).toEqual('email-filter-denylist,custom');

    await updateAuthWithoutCustomTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    const updatedFunction = await getLambdaFunction(functionName, meta.providers.awscloudformation.Region);
    const updatedDirContents = fs.readdirSync(`${projRoot}/amplify/backend/function/${Object.keys(meta.auth)[0]}PreSignup/src`);
    expect(updatedDirContents.includes('custom.js')).toBeFalsy();
    expect(updatedDirContents.includes('email-filter-denylist.js')).toBeTruthy();
    expect(updatedFunction.Configuration.Environment.Variables.MODULES).toEqual('email-filter-denylist');
    expect(lambdaFunction.Configuration.Environment.Variables.DOMAINDENYLIST).toEqual('amazon.com');
  });
});
