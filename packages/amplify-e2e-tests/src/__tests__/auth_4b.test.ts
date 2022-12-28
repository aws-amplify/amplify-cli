import * as fs from 'fs-extra';
import {
  initJSProjectWithProfile,
  initAndroidProjectWithProfile,
  initIosProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  addFeatureFlag,
  addAuthWithRecaptchaTrigger,
  addAuthWithCustomTrigger,
  addAuthWithSignInSignOutUrl,
  updateAuthWithoutCustomTrigger,
  updateAuthRemoveRecaptchaTrigger,
  updateAuthSignInSignOutUrl,
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
  getAwsAndroidConfig,
  getAwsIOSConfig,
  getUserPool,
  getUserPoolClients,
  getLambdaFunction,
  getFunction,
} from '@aws-amplify/amplify-e2e-core';
import _ from 'lodash';

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


  it('...should init a project and add auth with a custom trigger using legacy language', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    addFeatureFlag(projRoot, 'auth', 'useinclusiveterminology', false);
    await addAuthWithCustomTrigger(projRoot, { useInclusiveTerminology: false });
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const authName = Object.keys(meta.auth)[0];
    const functionName = `${authName}PreSignup-integtest`;
    const lambdaFunction = await getFunction(functionName, meta.providers.awscloudformation.Region);
    const dirContents = fs.readdirSync(`${projRoot}/amplify/backend/function/${authName}PreSignup/src`);
    expect(lambdaFunction).toBeDefined();
    expect(lambdaFunction.Configuration.Environment.Variables.MODULES).toEqual('email-filter-denylist-legacy,custom');
    expect(lambdaFunction.Configuration.Environment.Variables.DOMAINBLACKLIST).toEqual('amazon.com');
    expect(dirContents.includes('email-filter-denylist-legacy.js')).toBeTruthy();
  });

  it('...should init an android project and add customAuth flag, and remove flag when custom auth triggers are removed upon update', async () => {
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
});
