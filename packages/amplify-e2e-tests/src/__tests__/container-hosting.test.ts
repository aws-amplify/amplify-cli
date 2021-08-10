import {
  addDevContainerHosting,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  enableContainerHosting,
  getBackendAmplifyMeta,
  initJSProjectWithProfile,
  removeHosting,
  amplifyConfigureProject,
} from 'amplify-e2e-core';

import * as fs from 'fs-extra';
import * as path from 'path';

describe('amplify add hosting - container', () => {
  let projRoot: string;

  beforeAll(async () => {
    projRoot = await createNewProjectDir('container-hosting');
    await initJSProjectWithProfile(projRoot, {});
    await amplifyConfigureProject({
      cwd: projRoot,
      enableContainers: true,
    });
    // TODO: This needs attention. Need to force circle ci to run this test in us-east-1
    // await addDevContainerHosting(projRoot);
  });

  afterAll(async () => {
    // TODO: This needs attention. Need to force circle ci to run this test in us-east-1
    // await removeHosting(projRoot);
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it.skip('add container hosting works', async () => {
    // TODO: This needs attention. Need to force circle ci to run this test in us-east-1
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'ElasticContainer'))).toBe(true);
    const projectMeta = getBackendAmplifyMeta(projRoot);
    expect(projectMeta.hosting).toBeDefined();
    expect(projectMeta.hosting.ElasticContainer).toBeDefined();
  });
});
