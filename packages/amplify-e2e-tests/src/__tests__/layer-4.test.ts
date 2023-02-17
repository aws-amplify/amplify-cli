import {
  addFunction,
  addLayer,
  addOptData,
  amplifyPull,
  amplifyPushAuth,
  amplifyPushLayer,
  amplifyStatus,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  ExecutionContext,
  getAppId,
  getCurrentLayerArnFromMeta,
  getProjectConfig,
  getProjectMeta,
  initJSProjectWithProfile,
  LayerPermission,
  LayerPermissionChoice,
  LayerPermissionName,
  LayerRuntime,
  removeFunction,
  removeLayer,
  removeLayerVersion,
  updateLayer,
  updateOptData,
  validateLayerDir,
  validateLayerMetadata,
  validatePushedVersion,
} from 'amplify-e2e-core';
import { v4 as uuid } from 'uuid';
import { addEnvironment, checkoutEnvironment, listEnvironment } from '../environment/env';

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
    const layerName = `testlayer${shortId}`;
    const runtime: LayerRuntime = 'nodejs';
    const settings = {
      runtimes: [runtime],
      layerName,
      projName,
    };
    const expectedPerms: LayerPermission[] = [{ type: LayerPermissionName.private }];

    await addLayer(projRoot, settings);
    await amplifyPushLayer(projRoot, {
      acceptSuggestedLayerVersionConfigurations: true,
    });

    validatePushedVersion(projRoot, { layerName, projName }, expectedPerms);

    const appId = getAppId(projRoot);
    expect(appId).toBeDefined();

    let projRoot2;

    try {
      projRoot2 = await createNewProjectDir('layer-pull-test');
      await amplifyPull(projRoot2, { override: false, emptyDir: true, appId });

      validatePushedVersion(projRoot2, { layerName, projName }, expectedPerms);

      // Push new resource with no change to the layer
      await addFunction(projRoot2, { functionTemplate: 'Hello World' }, runtime);
      await amplifyPushAuth(projRoot2);

      // Push a new layer version
      addOptData(projRoot2, settings);

      await amplifyPushLayer(projRoot2, {
        acceptSuggestedLayerVersionConfigurations: true,
      });

      validatePushedVersion(projRoot2, settings, expectedPerms);
    } finally {
      deleteProjectDir(projRoot2);
    }

    await amplifyPull(projRoot, {});
    await amplifyStatus(projRoot, 'No Change');

    validatePushedVersion(projRoot, settings, expectedPerms);
  });
});
