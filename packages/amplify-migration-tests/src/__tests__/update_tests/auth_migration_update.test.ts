import { $TSAny } from 'amplify-cli-core';
import {
  addAuthWithCustomTrigger,
  addAuthWithDefault,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getLambdaFunction,
  getProjectMeta,
  getUserPool,
  getUserPoolClients,
  updateAuthWithoutCustomTrigger,
  updateAuthWithoutTrigger,
} from 'amplify-e2e-core';
import * as fs from 'fs-extra';
import { join } from 'path';
import { initJSProjectWithProfile } from '../../migration-helpers';

describe('amplify auth migration', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth migration');
  });

  afterEach(async () => {
    const metaFilePath = join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (fs.existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });
  it('...should init a project and add auth with a custom trigger, and then update to remove the custom js while leaving the other js', async () => {
    // init, add and push auth with installed cli
    await initJSProjectWithProfile(projRoot, { name: 'authMigration' });
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
    expect(lambdaFunction.Configuration.Environment.Variables.MODULES).toEqual('email-filter-denylist,custom');

    // update and push with codebase
    const authResourceName = Object.keys(meta.auth).filter(resourceName => meta.auth[resourceName].service === 'Cognito')[0];
    // update and push with codebase
    const overridesObj: $TSAny = {
      resourceName: authResourceName,
      category: 'auth',
      service: 'cognito',
    };
    await updateAuthWithoutCustomTrigger(projRoot, { testingWithLatestCodebase: true, overrides: overridesObj });
    await amplifyPushAuth(projRoot, true);
    const updatedFunction = await getLambdaFunction(functionName, meta.providers.awscloudformation.Region);
    const updatedDirContents = fs.readdirSync(`${projRoot}/amplify/backend/function/${Object.keys(meta.auth)[0]}PreSignup/src`);
    expect(updatedDirContents.includes('custom.js')).toBeFalsy();
    expect(updatedDirContents.includes('email-filter-denylist.js')).toBeTruthy();
    expect(updatedFunction.Configuration.Environment.Variables.MODULES).toEqual('email-filter-denylist');
  });

  it('...should init a project and add auth with default, and then update with latest and push', async () => {
    // init, add and push auth with installed cli
    await initJSProjectWithProfile(projRoot, { name: 'authMigration' });
    await addAuthWithDefault(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const authResourceName = Object.keys(meta.auth).filter(resourceName => meta.auth[resourceName].service === 'Cognito')[0];
    // update and push with codebase
    const overridesObj: $TSAny = {
      resourceName: authResourceName,
      category: 'auth',
      service: 'cognito',
    };
    await updateAuthWithoutTrigger(projRoot, { testingWithLatestCodebase: true, overrides: overridesObj });
    await amplifyPushAuth(projRoot, true);
  });
});
