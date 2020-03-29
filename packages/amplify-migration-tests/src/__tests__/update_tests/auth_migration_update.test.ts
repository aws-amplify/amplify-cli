import { initJSProjectWithProfile, deleteProject, amplifyPushAuth, amplifyPushUpdate } from '../../../../amplify-e2e-tests/src/init';
import * as path from 'path';
import * as fs from 'fs-extra';
import { getUserPool, getUserPoolClients, getLambdaFunction } from '../../../../amplify-e2e-tests/src/utils';
import { addAuthWithCustomTrigger, updateAuthWithoutCustomTrigger } from '../../../../amplify-e2e-tests/src/categories/auth';
import { createNewProjectDir, deleteProjectDir, getProjectMeta } from '../../utils';

describe('amplify add auth migration', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir('auth migration');
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (fs.existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });
  it('...should init a project and add auth with a custom trigger, and then update to remove the custom js while leaving the other js', async () => {
    // init, add and push auth with installed cli
    await initJSProjectWithProfile(projRoot, { name: 'authMigrationTest', local: true });
    await addAuthWithCustomTrigger(projRoot, { local: true });
    await amplifyPushAuth(projRoot, true);
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

    // update and push with codebase
    await updateAuthWithoutCustomTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    const updatedFunction = await getLambdaFunction(functionName, meta.providers.awscloudformation.Region);
    const updatedDirContents = fs.readdirSync(`${projRoot}/amplify/backend/function/${Object.keys(meta.auth)[0]}PreSignup/src`);
    expect(updatedDirContents.includes('custom.js')).toBeFalsy();
    expect(updatedDirContents.includes('email-filter-blacklist.js')).toBeTruthy();
    expect(updatedFunction.Configuration.Environment.Variables.MODULES).toEqual('email-filter-blacklist');
  });
});
