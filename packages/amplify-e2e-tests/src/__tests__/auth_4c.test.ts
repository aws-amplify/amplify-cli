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
