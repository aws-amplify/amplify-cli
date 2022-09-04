import {
  addFunction,
  amplifyPull,
  amplifyPushWithNoChanges,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  getBucketKeys,
  getHooksDirPath,
  getProjectMeta,
  initJSProjectWithProfile,
  removeFunction,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';
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
