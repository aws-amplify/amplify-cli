require('../src/aws-matchers/'); // custom matcher for assertion
import { initJSProjectWithProfile } from '../src/init';
import { addHosting, removeHosting, amplifyPush } from '../src/categories/hosting';
import { createNewProjectDir, deleteProjectDir } from '../src/utils';
import * as fs from 'fs';
import * as path from 'path';

describe('amplify add hosting', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
    jest.setTimeout(1000 * 60 * 60); // 1 hour
  });

  afterEach(async () => {
    await removeHosting(projRoot);
    await amplifyPush(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add hosting', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addHosting(projRoot);
    await amplifyPush(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'S3AndCloudFront'))).toBe(true);
  });
});
