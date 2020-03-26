import { initJSProjectWithProfile, deleteProject } from '../init';
import { addHosting, removeHosting, amplifyPush } from '../categories/hosting';
import { createNewProjectDir, deleteProjectDir, getProjectMeta } from '../utils';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('amplify add hosting', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('hosting');
  });

  afterEach(async () => {
    await removeHosting(projRoot);
    await amplifyPush(projRoot);
    await deleteProject(projRoot, true);
    deleteProjectDir(projRoot);
  });

  it('add hosting', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addHosting(projRoot);
    await amplifyPush(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'S3AndCloudFront'))).toBe(true);
    const projectMeta = getProjectMeta(projRoot);
    expect(projectMeta.hosting).toBeDefined();
    expect(projectMeta.hosting.S3AndCloudFront).toBeDefined();
  });
});
