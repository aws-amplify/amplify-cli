import * as fs from 'fs-extra';
import * as path from 'path';
import { initJSProjectWithProfile, deleteProject, createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';
import { getProjectMeta, getBucketKeys, getHooksDirPath, getAppId } from 'amplify-e2e-core';
import { amplifyPull } from 'amplify-e2e-core';
import { amplifyPushWithNoChanges } from 'amplify-e2e-core';
import { addFunction, removeFunction } from 'amplify-e2e-core';
import { addEnvironment, checkoutEnvironment } from '../environment/env';

const checkForFiles = (toCheckFiles: string[], inFiles: string[], prefix?: string): void => {
  toCheckFiles.forEach(toCheckFile => {
    expect(inFiles).toContain(prefix ? prefix.concat(toCheckFile) : toCheckFile);
  });
};

describe('runtime hooks', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('hooks');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('test hooks manager and execution', async () => {
    const initFiles = ['Readme.md', 'pre-push.js.sample', 'post-push.sh.sample'];
    const defaultHookFiles = ['Readme.md', 'hooks-config.json', 'post-add-function.js', 'post-add.js'];
    const ignoredFileName = 'ignoredFile';
    const newFileName = 'newFile';

    // amplify init
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false, envName: 'enva' });
    const hooksDirPath = getHooksDirPath(projRoot);
    let meta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(meta.DeploymentBucketName).toBeDefined();
    expect(fs.existsSync(hooksDirPath)).toBe(true);

    // init should create hooks sample files and readme
    let hooksFiles = fs.readdirSync(hooksDirPath);
    checkForFiles(initFiles, hooksFiles);

    // adding hook scripts and removing sample scripts
    fs.removeSync(path.join(hooksDirPath, 'pre-push.js.sample'));
    fs.removeSync(path.join(hooksDirPath, 'post-push.sh.sample'));
    fs.copySync(path.join(__dirname, '..', '..', 'hooks'), hooksDirPath);

    // add function to test if hooks are recognised and executed corrrectly
    await addFunction(projRoot, { functionTemplate: 'Hello World', name: 'funcName' }, 'nodejs');
    expect(fs.existsSync(path.join(projRoot, 'ping'))).toBe(true);
    expect(fs.existsSync(path.join(projRoot, 'pong'))).toBe(true);
    await removeFunction(projRoot, 'funcName');

    // amplify push to push the hooks
    await amplifyPushWithNoChanges(projRoot);

    // check if hooks were uploaded correctly to S3
    let S3Keys = await getBucketKeys({ Bucket: meta.DeploymentBucketName, Prefix: 'hooks/' });
    checkForFiles(defaultHookFiles, S3Keys, 'hooks/');
    // check if the inored file in hooks-config.json is recognised and not uploaded
    expect(S3Keys).not.toContain('hooks/' + ignoredFileName);

    // amplify pull should get all hook scripts in the S3 bucket
    const appId = getAppId(projRoot);
    expect(appId).toBeDefined();
    const projRoot2 = await createNewProjectDir('hooks');
    await amplifyPull(projRoot2, { appId, emptyDir: true, noUpdateBackend: true });
    const hooksDirPath2 = getHooksDirPath(projRoot2);
    expect(fs.existsSync(hooksDirPath2)).toBe(true);
    const hooksFiles2 = fs.readdirSync(hooksDirPath2);
    checkForFiles(defaultHookFiles, hooksFiles2);
    expect(hooksFiles2).not.toContain(ignoredFileName);
    fs.removeSync(projRoot2);

    // amplify env add should copy all hooks to new env and upload to S3
    await addEnvironment(projRoot, { envName: 'envb' });
    meta = getProjectMeta(projRoot).providers.awscloudformation;
    hooksFiles = fs.readdirSync(hooksDirPath);
    checkForFiles(defaultHookFiles, hooksFiles);
    expect(hooksFiles).toContain(ignoredFileName);

    // check S3
    fs.writeFileSync(path.join(hooksDirPath, newFileName), 'test file in envb');
    await amplifyPushWithNoChanges(projRoot);

    S3Keys = await getBucketKeys({ Bucket: meta.DeploymentBucketName, Prefix: 'hooks/' });
    checkForFiles(defaultHookFiles, S3Keys, 'hooks/');
    expect(S3Keys).toContain('hooks/' + newFileName);
    expect(S3Keys).not.toContain('hooks/' + ignoredFileName);

    // checkout env should pull and replace hooks directory with hooks for the checked out env
    await checkoutEnvironment(projRoot, { envName: 'enva' });
    hooksFiles = fs.readdirSync(hooksDirPath);
    checkForFiles(defaultHookFiles, hooksFiles);
    expect(hooksFiles).toContain(ignoredFileName);
    expect(hooksFiles).not.toContain(newFileName);
  });

  it('test hook scripts with non zero exit code', async () => {
    await initJSProjectWithProfile(projRoot, { envName: 'enva' });
    const hooksDirPath = getHooksDirPath(projRoot);
    expect(fs.existsSync(hooksDirPath)).toBe(true);
    fs.removeSync(path.join(hooksDirPath, 'pre-push.js.sample'));
    fs.removeSync(path.join(hooksDirPath, 'post-push.sh.sample'));
    fs.writeFileSync(path.join(hooksDirPath, 'pre-add.js'), 'process.exit(1);');

    // amplify process should exit as the hook script exited with non zero exit code
    await expect(addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs')).rejects.toThrow();
    // expect function to be not created
    expect(fs.readdirSync(path.join(projRoot, 'amplify', 'backend'))).not.toContain('function');
  });
});
