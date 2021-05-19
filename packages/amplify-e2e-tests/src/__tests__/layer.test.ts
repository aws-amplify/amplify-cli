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
} from 'amplify-e2e-core';
import { v4 as uuid } from 'uuid';
import { addEnvironment, checkoutEnvironment, listEnvironment } from '../environment/env';

describe('amplify add lambda layer', () => {
  let projRoot: string;
  let projName: string;
  const envName = 'integtest';

  beforeEach(async () => {
    projRoot = await createNewProjectDir('layers');
    await initJSProjectWithProfile(projRoot, { envName });
    const { projectName } = getProjectConfig(projRoot);
    projName = projectName;
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project and add simple layer', async () => {
    const [shortId] = uuid().split('-');
    const layerName = `simplelayer${shortId}`;

    const settings: { layerName: string; runtimes: LayerRuntimes[]; projName: string; usePreviousPermissions: boolean } = {
      runtimes: ['nodejs'],
      layerName,
      usePreviousPermissions: true,
      projName,
    };
    const arns: string[] = [];
    await addLayer(projRoot, settings);
    expect(validateLayerDir(projRoot, { projName, layerName: settings.layerName }, settings.runtimes)).toBe(true);
    await amplifyPushAuth(projRoot);
    arns.push(getCurrentLayerArnFromMeta(projRoot, settings));
    addOptData(projRoot, settings);
    await amplifyPushLayer(projRoot, true);
    arns.push(getCurrentLayerArnFromMeta(projRoot, settings));
    await validateLayerMetadata(projRoot, settings, getProjectMeta(projRoot), envName, arns);
    await removeLayer(projRoot, [1, 2], [1, 2]);
    expect(validateLayerDir(projRoot, settings, settings.runtimes)).toBe(false);
  });

  it('init a project add 4 layers and delete first 3 of them and push and verify', async () => {
    const [shortId] = uuid().split('-');
    const layerName = `simplelayer${shortId}`;

    const settings: { layerName: string; runtimes: LayerRuntimes[]; projName: string; usePreviousPermissions: boolean } = {
      runtimes: ['nodejs'],
      layerName,
      usePreviousPermissions: true,
      projName,
    };
    const arns: string[] = [];
    await addLayer(projRoot, settings);
    expect(validateLayerDir(projRoot, { projName, layerName: settings.layerName }, settings.runtimes)).toBe(true);
    await amplifyPushAuth(projRoot);
    arns.push(getCurrentLayerArnFromMeta(projRoot, settings));
    for (const i in [1, 2, 3]) {
      updateOptData(projRoot, settings, i);
      await amplifyPushLayer(projRoot, true);
      arns.push(getCurrentLayerArnFromMeta(projRoot, settings));
    }
    const removeVersion = [1, 2, 3];
    await removeLayerVersion(projRoot, removeVersion, [1, 2, 3, 4]);
    updateOptData(projRoot, settings, 'end');
    await amplifyPushLayer(projRoot);
    arns.push(getCurrentLayerArnFromMeta(projRoot, settings));
    arns.splice(0, 3);
    validateLayerMetadata(projRoot, settings, getProjectMeta(projRoot), envName, arns);
  });

  it('init a project and add/update simple layer and push', async () => {
    const [shortId] = uuid().split('-');
    const layerName = `testlayer${shortId}`;
    const settingsAdd = {
      runtimes: ['nodejs'],
      layerName: layerName,
      projName,
    };
    const settingsUpdate = {
      runtimes: ['nodejs'],
      layerName: layerName,
      versionChanged: true,
      versions: 0, // no versions since it it's not pushed
      permissions: ['Public (Anyone on AWS can use this layer)'],
      numLayers: 0,
      projName,
    };
    await addLayer(projRoot, settingsAdd);
    await updateLayer(projRoot, settingsUpdate);
    await amplifyPushAuth(projRoot);
    const arns: string[] = [getCurrentLayerArnFromMeta(projRoot, settingsAdd)];
    await validateLayerMetadata(projRoot, settingsUpdate, getProjectMeta(projRoot), envName, arns);
  });

  it('init a project and add/push and update/push updating version', async () => {
    const [shortId] = uuid().split('-');
    const layerName = `testlayer${shortId}`;
    const settingsAdd = {
      runtimes: ['nodejs'],
      layerName: layerName,
      projName,
    };
    const settingsUpdate = {
      runtimes: ['nodejs'],
      layerName: layerName,
      versionChanged: true,
      permissions: ['Public (Anyone on AWS can use this layer)'],
      numLayers: 1,
      versions: 1,
      projName,
    };
    const arns: string[] = [];
    await addLayer(projRoot, settingsAdd);
    await amplifyPushAuth(projRoot);
    arns.push(getCurrentLayerArnFromMeta(projRoot, settingsAdd));

    await updateLayer(projRoot, settingsUpdate);
    await amplifyPushAuth(projRoot);

    await validateLayerMetadata(projRoot, settingsUpdate, getProjectMeta(projRoot), envName, arns);
  });

  it('init a project and add/push and update/push without updating version', async () => {
    const [shortId] = uuid().split('-');
    const settings: any = {
      runtimes: ['nodejs'],
      layerName: `testlayer${shortId}`,
      numLayers: 1,
      versions: 1,
      projName,
    };
    const arns: string[] = [];
    await addLayer(projRoot, settings);
    await amplifyPushAuth(projRoot);
    settings.permissions = ['Public (Anyone on AWS can use this layer)'];
    await updateLayer(projRoot, settings);
    await amplifyPushAuth(projRoot);
    arns.push(getCurrentLayerArnFromMeta(projRoot, settings));
    await validateLayerMetadata(projRoot, settings, getProjectMeta(projRoot), envName, arns);
  });

  it('init a project, add/push layer, change layer content, push layer using previous permissions, test env add and env checkout', async () => {
    const [shortId] = uuid().split('-');
    const settings = {
      runtimes: ['nodejs'],
      layerName: `testlayer${shortId}`,
      permissions: ['Public (Anyone on AWS can use this layer)'],
      versionChanged: false,
      numLayers: 1,
      projName,
    };
    const integtestArns: string[] = [];
    const expectedPerms: LayerPermission[] = [{ type: LayerPermissionName.public }];
    await addLayer(projRoot, settings);
    await amplifyPushAuth(projRoot);
    integtestArns.push(getCurrentLayerArnFromMeta(projRoot, settings));
    await validatePushedVersion(projRoot, settings, expectedPerms);
    addOptData(projRoot, settings);
    await amplifyPushLayer(projRoot, true);
    integtestArns.push(getCurrentLayerArnFromMeta(projRoot, settings));
    await validatePushedVersion(projRoot, settings, expectedPerms);
    await validateLayerMetadata(projRoot, settings, getProjectMeta(projRoot), envName, integtestArns);

    const layerTestArns: string[] = [];
    const newEnvName = 'layertest';
    await addEnvironment(projRoot, { envName: newEnvName, numLayers: 1 });
    await listEnvironment(projRoot, { numEnv: 2 });
    await amplifyPushAuth(projRoot);
    layerTestArns.push(getCurrentLayerArnFromMeta(projRoot, settings));
    await validatePushedVersion(projRoot, settings, expectedPerms);
    await validateLayerMetadata(projRoot, settings, getProjectMeta(projRoot), newEnvName, layerTestArns);

    await checkoutEnvironment(projRoot, { envName });
    await validatePushedVersion(projRoot, settings, expectedPerms);
    await validateLayerMetadata(projRoot, settings, getProjectMeta(projRoot), envName, integtestArns);
  });
});

describe('amplify add lambda layer - with amplify console app', () => {
  let projRoot: string;
  const envName = 'integtest';
  let projName: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('layers');
    await initJSProjectWithProfile(projRoot, { envName, disableAmplifyAppCreation: false });
    const { projectName } = getProjectConfig(projRoot);
    projName = projectName;
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('tests amplify pull on project with layer', async () => {
    const [shortId] = uuid().split('-');
    const settings = {
      runtimes: ['nodejs'],
      layerName: `testlayer${shortId}`,
      versionChanged: false,
      numLayers: 1,
      projName,
    };
    const expectedPerms: LayerPermission[] = [{ type: LayerPermissionName.private }];
    await addLayer(projRoot, settings);
    await amplifyPushAuth(projRoot);
    await validatePushedVersion(projRoot, settings, expectedPerms);
    const appId = getAppId(projRoot);
    expect(appId).toBeDefined();
    let projRoot2;
    try {
      projRoot2 = await createNewProjectDir('import-env-test2');
      await amplifyPull(projRoot2, { override: false, emptyDir: true, appId });
      await validatePushedVersion(projRoot2, settings, expectedPerms);

      // Push new resource with no change to the layer
      await addFunction(projRoot2, { functionTemplate: 'Hello World' }, 'nodejs');
      await amplifyPushAuth(projRoot2);

      // Push a new layer version
      addOptData(projRoot2, settings);
      await amplifyPushAuth(projRoot2);
      await validatePushedVersion(projRoot2, settings, expectedPerms);
    } catch (e) {
      throw e;
    } finally {
      deleteProjectDir(projRoot2);
    }
    await amplifyPull(projRoot, {});
    await validatePushedVersion(projRoot, settings, expectedPerms);
  });
});
