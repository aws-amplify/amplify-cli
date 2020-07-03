import {
  addLayer,
  addOptData,
  amplifyPushAuth,
  amplifyPushLayer,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  getLayerVersion,
  getProjectMeta,
  listVersions,
  removeLayer,
  updateLayer,
  validateLayerDir,
  validateLayerMetadata,
  validatePushedVersion,
} from 'amplify-e2e-core';
import { v4 as uuid } from 'uuid';

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
    const [shortId] = uuid().split('-');
    const settings = {
      layerName: `simplelayer${shortId}`,
      runtimes: ['nodejs'],
    };
    await initJSProjectWithProfile(projRoot, {});
    await addLayer(projRoot, settings);
    expect(validateLayerDir(projRoot, settings.layerName, settings.runtimes)).toBe(true);
    await amplifyPushAuth(projRoot);
    addOptData(projRoot, settings.layerName);
    await amplifyPushAuth(projRoot);
    await validateLayerMetadata(settings.layerName, getProjectMeta(projRoot));
    await removeLayer(projRoot);
    expect(validateLayerDir(projRoot, settings.layerName, settings.runtimes)).toBe(false);
  });

  it('init a project and add/update simple layer and push', async () => {
    const [shortId] = uuid().split('-');
    const layerName = `testlayer${shortId}`;
    const settingsAdd = {
      runtimes: ['nodejs'],
      layerName: layerName,
    };
    const settingsUpdate = {
      runtimes: ['python'],
      layerName: layerName,
      versionChanged: true,
      numLayers: 1,
      isPushed: false,
    };
    await initJSProjectWithProfile(projRoot, {});
    await addLayer(projRoot, settingsAdd);
    await updateLayer(projRoot, settingsUpdate);
    await amplifyPushAuth(projRoot);
    await validateLayerMetadata(settingsUpdate.layerName, getProjectMeta(projRoot));
  });

  it('init a project and add/push and update/push updating version', async () => {
    const [shortId] = uuid().split('-');
    const layerName = `testlayer${shortId}`;
    const settingsAdd = {
      runtimes: ['nodejs'],
      layerName: layerName,
    };
    const settingsUpdate = {
      runtimes: ['python'],
      layerName: layerName,
      versionChanged: true,
      numLayers: 1,
      isPushed: false,
    };
    await initJSProjectWithProfile(projRoot, {});
    await addLayer(projRoot, settingsAdd);
    await amplifyPushAuth(projRoot);
    await updateLayer(projRoot, settingsUpdate);
    await amplifyPushAuth(projRoot);
    await validateLayerMetadata(settingsUpdate.layerName, getProjectMeta(projRoot));
  });

  it('init a project and add/push and update/push without updating version', async () => {
    const [shortId] = uuid().split('-');
    const settings: any = {
      runtimes: ['nodejs'],
      layerName: `testlayer${shortId}`,
      numLayers: 1,
      isPushed: false,
    };
    await initJSProjectWithProfile(projRoot, {});
    await addLayer(projRoot, settings);
    await amplifyPushAuth(projRoot);
    settings.permissions = ['Public (Anyone on AWS can use this layer)'];
    await updateLayer(projRoot, settings);
    await amplifyPushAuth(projRoot);
    await validateLayerMetadata(settings.layerName, getProjectMeta(projRoot));
  });

  it('init a project, add/push layer, change layer content, push layer using previous permissions', async () => {
    const [shortId] = uuid().split('-');
    const settings = {
      runtimes: ['nodejs'],
      layerName: `testlayer${shortId}`,
      permissions: ['Public (Anyone on AWS can use this layer)'],
      versionChanged: false,
      numLayers: 1,
      isPushed: false,
    };
    const expectedPerms = [{ type: 'private' }, { type: 'public' }];
    await initJSProjectWithProfile(projRoot, {});
    await addLayer(projRoot, settings);
    await amplifyPushAuth(projRoot);
    validatePushedVersion(projRoot, settings.layerName, 1, expectedPerms);
    addOptData(projRoot, settings.layerName);
    await amplifyPushLayer(projRoot);
    validatePushedVersion(projRoot, settings.layerName, 2, expectedPerms);
    await validateLayerMetadata(settings.layerName, getProjectMeta(projRoot));
  });
});
