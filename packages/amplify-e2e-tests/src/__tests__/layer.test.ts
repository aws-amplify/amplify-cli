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
  LayerPermission,
  LayerPermissionName,
  LayerRuntimes,
  listVersions,
  removeLayer,
  updateLayer,
  validateLayerDir,
  validateLayerMetadata,
  validatePushedVersion,
} from 'amplify-e2e-core';
import { v4 as uuid } from 'uuid';
import { addEnvironment, checkoutEnvironment, listEnvironment } from '../environment/env';

describe('amplify add lambda layer', () => {
  let projRoot: string;
  const envName = 'integtest';

  beforeEach(async () => {
    projRoot = await createNewProjectDir('layers');
    await initJSProjectWithProfile(projRoot, { envName });
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project and add simple layer', async () => {
    const [shortId] = uuid().split('-');
    const settings: { layerName: string; runtimes: LayerRuntimes[] } = {
      layerName: `simplelayer${shortId}`,
      runtimes: ['nodejs'],
    };
    await addLayer(projRoot, settings);
    expect(validateLayerDir(projRoot, settings.layerName, settings.runtimes)).toBe(true);
    await amplifyPushAuth(projRoot);
    addOptData(projRoot, settings.layerName);
    await amplifyPushAuth(projRoot);
    await validateLayerMetadata(projRoot, settings.layerName, getProjectMeta(projRoot), envName);
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
    };
    await addLayer(projRoot, settingsAdd);
    await updateLayer(projRoot, settingsUpdate);
    await amplifyPushAuth(projRoot);
    await validateLayerMetadata(projRoot, settingsUpdate.layerName, getProjectMeta(projRoot), envName);
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
    };
    await addLayer(projRoot, settingsAdd);
    await amplifyPushAuth(projRoot);
    await updateLayer(projRoot, settingsUpdate);
    await amplifyPushAuth(projRoot);
    await validateLayerMetadata(projRoot, settingsUpdate.layerName, getProjectMeta(projRoot), envName);
  });

  it('init a project and add/push and update/push without updating version', async () => {
    const [shortId] = uuid().split('-');
    const settings: any = {
      runtimes: ['nodejs'],
      layerName: `testlayer${shortId}`,
      numLayers: 1,
    };
    await addLayer(projRoot, settings);
    await amplifyPushAuth(projRoot);
    settings.permissions = ['Public (Anyone on AWS can use this layer)'];
    await updateLayer(projRoot, settings);
    await amplifyPushAuth(projRoot);
    await validateLayerMetadata(projRoot, settings.layerName, getProjectMeta(projRoot), envName);
  });

  it('init a project, add/push layer, change layer content, push layer using previous permissions, test env add and env checkout', async () => {
    const [shortId] = uuid().split('-');
    const settings = {
      runtimes: ['nodejs'],
      layerName: `testlayer${shortId}`,
      permissions: ['Public (Anyone on AWS can use this layer)'],
      versionChanged: false,
      numLayers: 1,
    };
    const expectedPerms: LayerPermission[] = [{ type: LayerPermissionName.private }, { type: LayerPermissionName.public }];
    await addLayer(projRoot, settings);
    await amplifyPushAuth(projRoot);
    await validatePushedVersion(projRoot, settings.layerName, envName, 1, expectedPerms);
    addOptData(projRoot, settings.layerName);
    await amplifyPushLayer(projRoot);
    await validatePushedVersion(projRoot, settings.layerName, envName, 2, expectedPerms);
    await validateLayerMetadata(projRoot, settings.layerName, getProjectMeta(projRoot), envName);

    const newEnvName = 'layertest';
    await addEnvironment(projRoot, { envName: newEnvName, numLayers: 1 });
    await listEnvironment(projRoot, { numEnv: 2 });
    await amplifyPushAuth(projRoot);
    await validatePushedVersion(projRoot, settings.layerName, newEnvName, 1, expectedPerms);
    await validateLayerMetadata(projRoot, settings.layerName, getProjectMeta(projRoot), newEnvName);

    await checkoutEnvironment(projRoot, { envName });
    await validatePushedVersion(projRoot, settings.layerName, envName, 1, expectedPerms);
    await validateLayerMetadata(projRoot, settings.layerName, getProjectMeta(projRoot), newEnvName);
  });
});
