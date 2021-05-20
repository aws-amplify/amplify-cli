import {
  addLayer,
  addFunction,
  addOptData,
  amplifyPull,
  amplifyPushAuth,
  amplifyPushLayer,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  getAppId,
  getProjectMeta,
  LayerPermission,
  LayerPermissionName,
  LayerRuntimes,
  removeLayer,
  updateLayer,
  updateOptData,
  validateLayerDir,
  validateLayerMetadata,
  validatePushedVersion,
  getCurrentLayerArnFromMeta,
  getProjectConfig,
  removeLayerVersion,
  amplifyStatus,
  expectEphemeralPermissions,
  expectEphemeralDataIsUndefined,
  expectDeployedLayerDescription,
} from 'amplify-e2e-core';
import { v4 as uuid } from 'uuid';
import { addEnvironment, checkoutEnvironment, listEnvironment } from '../environment/env';

describe('amplify add lambda layer with changes', () => {
  let projRoot: string;
  let projName: string;
  const envName = 'integtest';

  beforeEach(async () => {
    projRoot = await createNewProjectDir('layers');
    projRoot = '/Users/attila/workspaces/amplify-projects/layers/deb';
    // await initJSProjectWithProfile(projRoot, { envName });
    const { projectName } = getProjectConfig(projRoot);
    projName = projectName;
  });

  afterEach(async () => {
    // await deleteProject(projRoot);
    // deleteProjectDir(projRoot);
  });

  it('simple layer, change future permission, no changes', async () => {
    const [shortId] = uuid().split('-');
    const layerName = `simplelayer${shortId}`;

    const settings: { layerName: string; runtimes: LayerRuntimes[]; projName: string; usePreviousPermissions: boolean } = {
      runtimes: ['nodejs'],
      layerName,
      usePreviousPermissions: true,
      projName,
    };
    const settingsUpdate = {
      runtimes: ['nodejs'],
      layerName: layerName,
      changePermissionOnFutureVersion: true,
      permissions: ['Public (Anyone on AWS can use this layer)'],
      numLayers: 1,
      projName,
    };

    await addLayer(projRoot, settings);
    await amplifyPushLayer(projRoot, {
      acceptSuggestedLayerVersionConfigurations: true,
    });

    await updateLayer(projRoot, settingsUpdate);

    const expectedPerms: LayerPermission[] = [{ type: LayerPermissionName.public }];
    validatePushedVersion(projRoot, settingsUpdate, expectedPerms);

    await amplifyStatus(projRoot, 'No Change');
  });

  it('simple layer, change latest permission, update status, no new layer version', async () => {
    const [shortId] = uuid().split('-');
    const layerName = `simplelayer${shortId}`;

    const settings: { layerName: string; runtimes: LayerRuntimes[]; projName: string; usePreviousPermissions: boolean } = {
      runtimes: ['nodejs'],
      layerName,
      usePreviousPermissions: true,
      projName,
    };
    const settingsUpdate = {
      runtimes: ['nodejs'],
      layerName: layerName,
      changePermissionOnLatestVersion: true,
      permissions: ['Public (Anyone on AWS can use this layer)'],
      numLayers: 1,
      projName,
    };

    await addLayer(projRoot, settings);
    await amplifyPushLayer(projRoot, {
      acceptSuggestedLayerVersionConfigurations: true,
    });

    const firstArn = getCurrentLayerArnFromMeta(projRoot, settingsUpdate);

    await updateLayer(projRoot, settingsUpdate);

    const expectedPerms: LayerPermission[] = [{ type: LayerPermissionName.public }];
    expectEphemeralPermissions(projRoot, settingsUpdate, envName, 1, expectedPerms);

    await amplifyStatus(projRoot, 'Update');

    await amplifyPushAuth(projRoot);

    expectEphemeralDataIsUndefined(projRoot, settingsUpdate);

    const secondArn = getCurrentLayerArnFromMeta(projRoot, settings);

    // Layer ARNs must match as no new version should have been deployed
    expect(firstArn).toEqual(secondArn);
  });

  it('simple layer, change update layer, select NO to permissions, no changes', async () => {
    const [shortId] = uuid().split('-');
    const layerName = `simplelayer${shortId}`;

    const settings: { layerName: string; runtimes: LayerRuntimes[]; projName: string; usePreviousPermissions: boolean } = {
      runtimes: ['nodejs'],
      layerName,
      usePreviousPermissions: true,
      projName,
    };
    const settingsUpdate = {
      runtimes: ['nodejs'],
      layerName: layerName,
      dontChangePermissions: true,
      numLayers: 1,
      projName,
    };

    await addLayer(projRoot, settings);
    await amplifyPushLayer(projRoot, {
      acceptSuggestedLayerVersionConfigurations: true,
    });

    await updateLayer(projRoot, settingsUpdate);

    await amplifyStatus(projRoot, 'No Change');
  });

  it('simple layer, update description during push', async () => {
    const [shortId] = uuid().split('-');
    const layerName = `simplelayer${shortId}`;

    const settings: { layerName: string; runtimes: LayerRuntimes[]; projName: string; usePreviousPermissions: boolean } = {
      runtimes: ['nodejs'],
      layerName,
      usePreviousPermissions: true,
      projName,
    };

    const layerDescription = 'Custom Description from E2E';

    await addLayer(projRoot, settings);
    await amplifyPushLayer(projRoot, {
      acceptSuggestedLayerVersionConfigurations: false,
      usePreviousPermissions: true,
      layerDescription,
    });

    await expectDeployedLayerDescription(projRoot, settings, getProjectMeta(projRoot), envName, layerDescription);
  });
});
