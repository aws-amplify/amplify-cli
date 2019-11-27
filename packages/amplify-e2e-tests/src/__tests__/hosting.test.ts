import { initJSProjectWithProfile } from '../init';
import { addHosting, removeHosting, amplifyPush } from '../categories/hosting';
import { createNewProjectDir, deleteProjectDir } from '../utils';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('amplify add hosting', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
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
