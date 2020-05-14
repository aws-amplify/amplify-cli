import { initJSProjectWithProfile, deleteProject, amplifyPushAuth, amplifyPush } from 'amplify-e2e-core';
import { addFunction, addLayer, updateFunction, functionBuild, functionMockAssert, functionCloudInvoke } from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, getFunction } from 'amplify-e2e-core';
import fs from 'fs-extra';
import path from 'path';

describe('amplify add lambda layer', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('layers');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project and add simple layer', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addLayer(projRoot, {});
  });
});
