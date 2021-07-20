import { createReactTestProject } from 'amplify-e2e-core';

import { initJSProjectWithProfile, deleteProject } from 'amplify-e2e-core';
import { enableContainerHosting, addDevContainerHosting, removeHosting } from 'amplify-e2e-core';
import { deleteProjectDir, getBackendAmplifyMeta } from 'amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('amplify add hosting - container', () => {
  let projRoot: string;

  beforeAll(async () => {
    projRoot = await createReactTestProject();
    await initJSProjectWithProfile(projRoot, {});
    await enableContainerHosting(projRoot);
    await addDevContainerHosting(projRoot);
  });

  afterAll(async () => {
    await removeHosting(projRoot);
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add container hosting works', async () => {
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'ElasticContainer'))).toBe(true);
    const projectMeta = getBackendAmplifyMeta(projRoot);
    expect(projectMeta.hosting).toBeDefined();
    expect(projectMeta.hosting.ElasticContainer).toBeDefined();
  });
});
