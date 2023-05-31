import {
  addFunction,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAmplifyInitConfig,
  getHooksDirPath,
  gitCleanFdX,
  gitCommitAll,
  gitInit,
  initJSProjectWithProfile,
  nonInteractiveInitWithForcePushAttach,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';

const appendHook = (pathToFile: string) =>
  `const fs = require('fs');
fs.appendFileSync('${pathToFile}', 'a');
`;

describe('runtime hooks', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('hooks');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('hooks should execute a single time on push and init --forcePush', async () => {
    const prePushOutputFilename = 'pre-push-count.txt';
    const postPushOutputFilename = 'post-push-count.txt';

    await initJSProjectWithProfile(projRoot, { envName: 'integtest' });
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');

    const hooksDirPath = getHooksDirPath(projRoot);
    expect(fs.existsSync(hooksDirPath)).toBe(true);
    fs.removeSync(path.join(hooksDirPath, 'pre-push.js.sample'));
    fs.removeSync(path.join(hooksDirPath, 'post-push.sh.sample'));
    const prePushOutputFilePath = path.join(hooksDirPath, prePushOutputFilename);
    const postPushOutputFilePath = path.join(hooksDirPath, postPushOutputFilename);
    fs.writeFileSync(path.join(hooksDirPath, 'pre-push.js'), appendHook(prePushOutputFilePath));
    fs.writeFileSync(path.join(hooksDirPath, 'post-push.js'), appendHook(postPushOutputFilePath));
    await amplifyPushAuth(projRoot);
    expect(fs.existsSync(prePushOutputFilePath)).toBe(true);
    expect(fs.existsSync(postPushOutputFilePath)).toBe(true);
    expect(fs.readFileSync(prePushOutputFilePath, 'utf-8').length).toEqual(1);
    expect(fs.readFileSync(postPushOutputFilePath, 'utf-8').length).toEqual(1);

    // remove the output files
    fs.removeSync(prePushOutputFilePath);
    fs.removeSync(postPushOutputFilePath);
    expect(fs.existsSync(prePushOutputFilePath)).toBe(false);
    expect(fs.existsSync(postPushOutputFilePath)).toBe(false);

    // init and commit to repository, remove files ignored by git
    await gitInit(projRoot);
    await gitCommitAll(projRoot);
    await gitCleanFdX(projRoot);

    // simulate hosting deployment
    await nonInteractiveInitWithForcePushAttach(projRoot, getAmplifyInitConfig(projRoot, 'integtest'));
    expect(fs.existsSync(hooksDirPath)).toBe(true);
    expect(fs.existsSync(prePushOutputFilePath)).toBe(true);
    expect(fs.existsSync(postPushOutputFilePath)).toBe(true);
    expect(fs.readFileSync(prePushOutputFilePath, 'utf-8').length).toEqual(1);
    expect(fs.readFileSync(postPushOutputFilePath, 'utf-8').length).toEqual(1);
  });
});
