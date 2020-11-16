import * as fs from 'fs-extra';
import * as path from 'path';
import {
  initJSProjectWithProfile,
  initAndroidProjectWithProfile,
  initIosProjectWithProfile,
  initFlutterProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  amplifyPush,
} from 'amplify-e2e-core';
import {
  addAuthWithDefault,
  runAmplifyAuthConsole,
  removeAuthWithDefault,
  addAuthWithDefaultSocial,
  addAuthWithGroupTrigger,
  addAuthWithRecaptchaTrigger,
  addAuthViaAPIWithTrigger,
} from 'amplify-e2e-core';
import {
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
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

  it('...should init a Flutter project and add auth with defaults', async () => {
    await initFlutterProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();
    expect(fs.existsSync(path.join(projRoot, 'lib', 'amplifyconfiguration.dart'))).toBe(true);
  });

  it('...should init a project and add auth with defaults and then remove auth and add another auth and push', async () => {
    await initFlutterProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot, {});
    await amplifyPushAuth(projRoot);
    await removeAuthWithDefault(projRoot);
    await addAuthWithDefault(projRoot, {});
    await amplifyPushAuth(projRoot);
  });
});
