import {
  addLayer,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  removeLayer,
  validateLayerDir,
} from 'amplify-e2e-core';
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
    const layerName = 'simple-layer';
    await initJSProjectWithProfile(projRoot, {});
    await addLayer(projRoot, { layerName });
    expect(validateLayerDir(projRoot, layerName, true)).toBeTruthy();
    await removeLayer(projRoot);
    expect(validateLayerDir(projRoot, layerName, false)).toBeTruthy();
  });
});
