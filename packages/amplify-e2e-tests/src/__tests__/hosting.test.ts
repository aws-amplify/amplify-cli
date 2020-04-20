import { initJSProjectWithProfile, deleteProject } from 'amplify-e2e-core';
import { addHosting, removeHosting, amplifyPushWithoutCodegen } from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir, getProjectMeta } from 'amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('amplify add hosting', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('hosting');
  });

  afterEach(async () => {
    await removeHosting(projRoot);
    await amplifyPushWithoutCodegen(projRoot);
    await deleteProject(projRoot, true);
    deleteProjectDir(projRoot);
  });

  it('add hosting', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addHosting(projRoot);
    await amplifyPushWithoutCodegen(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'S3AndCloudFront'))).toBe(true);
    const projectMeta = getProjectMeta(projRoot);
    expect(projectMeta.hosting).toBeDefined();
    expect(projectMeta.hosting.S3AndCloudFront).toBeDefined();
  });
});
