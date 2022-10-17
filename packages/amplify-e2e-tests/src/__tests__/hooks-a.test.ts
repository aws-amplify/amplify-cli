import {
  addFunction, amplifyPullNonInteractive, amplifyPushAuth, createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getBackendAmplifyMeta, getHooksDirPath, initJSProjectWithProfile, transformCurrentProjectToGitPulledProject,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('runtime hooks', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('hooks');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('hooks should not get deleted when pulling a project from git and running amplify pull', async () => {
    await initJSProjectWithProfile(projRoot, { envName: 'staging', disableAmplifyAppCreation: false });
    const appId = getBackendAmplifyMeta(projRoot)?.providers?.awscloudformation?.AmplifyAppId;
    expect(appId).toBeDefined();
    const hooksDirPath = getHooksDirPath(projRoot);
    expect(fs.existsSync(hooksDirPath)).toBe(true);
    fs.removeSync(path.join(hooksDirPath, 'pre-push.js.sample'));
    fs.removeSync(path.join(hooksDirPath, 'post-push.sh.sample'));
    fs.writeFileSync(path.join(hooksDirPath, 'pre-push.js'), `console.log('hello');`);
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await amplifyPushAuth(projRoot);
    // grab the appId from the meta file
    transformCurrentProjectToGitPulledProject(projRoot);
    await amplifyPullNonInteractive(projRoot, { appId, envName: 'staging' });
    expect(fs.existsSync(hooksDirPath)).toBe(true);
  });
});
