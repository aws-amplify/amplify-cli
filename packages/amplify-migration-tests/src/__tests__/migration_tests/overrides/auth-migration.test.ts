import { $TSAny, JSONUtilities } from 'amplify-cli-core';
import {
  addAuthWithCustomTrigger,
  addAuthWithDefault,
  addAuthWithRecaptchaTrigger,
  addAuthWithSignInSignOutUrl,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAwsAndroidConfig,
  getBackendAmplifyMeta,
  getLambdaFunction,
  getProjectMeta,
  getUserPool,
  getUserPoolClients,
  initAndroidProjectWithProfile,
  initJSProjectWithProfile,
  updateAuthRemoveRecaptchaTrigger,
  updateAuthSignInSignOutUrl,
  updateAuthWithoutCustomTrigger,
  updateAuthWithoutTrigger,
  updateHeadlessAuth,
} from 'amplify-e2e-core';
import { UpdateAuthRequest } from 'amplify-headless-interface';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import { versionCheck, allowedVersionsToMigrateFrom } from '../../../migration-helpers';

const defaultSettings = {
  name: 'authMigration',
};
describe('amplify auth migration', () => {
  let projRoot: string;

  beforeAll(async () => {
    const migrateFromVersion = { v: 'unintialized' };
    const migrateToVersion = { v: 'unintialized' };
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
  });

  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth_migration');
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (fs.existsSync(metaFilePath)) {
      await deleteProject(projRoot, undefined, true);
    }
    deleteProjectDir(projRoot);
  });
  it('...should init a project and add auth with a custom trigger, and then update to remove the custom js while leaving the other js', async () => {
    // init, add and push auth with installed cli
    await initJSProjectWithProfile(projRoot, defaultSettings);
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
    await initJSProjectWithProfile(projRoot, defaultSettings);
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

  it('...should init an android project and add customAuth flag, and remove flag when custom auth triggers are removed upon update ', async () => {
    await initAndroidProjectWithProfile(projRoot, defaultSettings);
    await addAuthWithRecaptchaTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    let meta = getAwsAndroidConfig(projRoot);
    expect(meta.Auth.Default.authenticationFlowType).toBeDefined();
    expect(meta.Auth.Default.authenticationFlowType).toEqual('CUSTOM_AUTH');
    const amplifyMeta = getProjectMeta(projRoot);
    const authResourceName = Object.keys(amplifyMeta.auth).filter(resourceName => amplifyMeta.auth[resourceName].service === 'Cognito')[0];
    // update and push with codebase
    const overridesObj: $TSAny = {
      resourceName: authResourceName,
      category: 'auth',
      service: 'cognito',
    };

    await updateAuthRemoveRecaptchaTrigger(projRoot, { testingWithLatestCodebase: true, overrides: overridesObj });
    await amplifyPushAuth(projRoot, true);
    meta = getAwsAndroidConfig(projRoot);
    expect(meta.Auth.Default.authenticationFlowType).toBeDefined();
    expect(meta.Auth.Default.authenticationFlowType).toEqual('USER_SRP_AUTH');
  });

  it('...should edit signin url on update', async () => {
    let settings = {
      signinUrl: 'http://localhost:3001/',
      signoutUrl: 'http://localhost:3002/',
      updatesigninUrl: 'http://localhost:3003/',
      updatesignoutUrl: 'http://localhost:3004/',
    };
    await initAndroidProjectWithProfile(projRoot, defaultSettings);
    await addAuthWithSignInSignOutUrl(projRoot, settings);
    const amplifyMeta = getBackendAmplifyMeta(projRoot);
    const authResourceName = Object.keys(amplifyMeta.auth).filter(resourceName => amplifyMeta.auth[resourceName].service === 'Cognito')[0];
    // update and push with codebase
    const overridesObj: $TSAny = {
      resourceName: authResourceName,
      category: 'auth',
      service: 'cognito',
    };
    await updateAuthSignInSignOutUrl(projRoot, { ...settings, testingWithLatestCodebase: true, overrides: overridesObj });
  });

  it('updates existing auth resource', async () => {
    const updateAuthRequest: UpdateAuthRequest = {
      version: 1,
      serviceModification: {
        serviceName: 'Cognito',
        userPoolModification: {
          userPoolGroups: [
            {
              groupName: 'group1',
            },
            {
              groupName: 'group2',
            },
          ],
        },
        includeIdentityPool: true,
        identityPoolModification: {
          unauthenticatedLogin: true,
        },
      },
    };

    await initJSProjectWithProfile(projRoot, defaultSettings);
    await addAuthWithDefault(projRoot, {});
    await updateHeadlessAuth(projRoot, updateAuthRequest, {});
    await amplifyPushAuth(projRoot, true);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();
    expect(_.get(meta, ['auth', 'userPoolGroups'])).toBeDefined();
  });
});
