import {
  addFunction,
  addLayer,
  addOptFile,
  amplifyPushAuth,
  amplifyPushLayer,
  amplifyStatus,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  ExecutionContext,
  expectDeployedLayerDescription,
  expectEphemeralDataIsUndefined,
  expectEphemeralPermissions,
  functionCloudInvoke,
  getCurrentLayerArnFromMeta,
  getProjectConfig,
  getProjectMeta,
  initJSProjectWithProfile,
  LayerOptions,
  LayerPermission,
  LayerPermissionName,
  LayerRuntimes,
  loadFunctionTestFile,
  overrideFunctionSrcNode,
  overrideLayerCodeNode,
  updateFunction,
  updateLayer,
  validatePushedVersion,
} from 'amplify-e2e-core';
import { v4 as uuid } from 'uuid';

describe('amplify add lambda layer with changes', () => {
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

    const settings: { layerName: string; runtimes: LayerRuntimes[]; projName: string } = {
      runtimes: ['nodejs'],
      layerName,
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

    const settings: { layerName: string; runtimes: LayerRuntimes[]; projName: string } = {
      runtimes: ['nodejs'],
      layerName,
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

  it('function with layer reference, change version, test invocation', async () => {
    const lambdaTestString = 'Hello from Lambda!';
    const helloWorldUpperCaseOutput = 'HELLO FROM LAMBDA!';
    const helloWorldTitleCaseOutput = 'Hello From Lambda!';
    const [shortId] = uuid().split('-');
    const layerName = `reflayer${shortId}`;

    // 1. Step
    // - Create a layer
    // - Create a function, referencing the layer
    // - Add package.json and casing.js to layer code
    // - Override function code to invoke the layer
    // - Push
    // - Invoke function, check result (upper cased)

    const settings: { layerName: string; runtimes: LayerRuntimes[]; projName: string } = {
      runtimes: ['nodejs'],
      layerName,
      projName,
    };

    const functionName = `nodetestfunction${shortId}`;

    await addLayer(projRoot, settings);

    const packageJsonContent = loadFunctionTestFile('case-layer-package.json');
    const caseLayerIndexV1 = loadFunctionTestFile('case-layer-v1.js');
    const caseLayerIndexV2 = loadFunctionTestFile('case-layer-v2.js');

    let functionCode = loadFunctionTestFile('case-function-for-layer.js');

    functionCode = functionCode.replace('{{testString}}', lambdaTestString);

    overrideLayerCodeNode(projRoot, settings.projName, settings.layerName, packageJsonContent, 'package.json');

    addOptFile(projRoot, settings.projName, settings.layerName, caseLayerIndexV1, 'casing.js');

    const layerOptions: LayerOptions = {
      select: [`${settings.projName}${settings.layerName}`],
      expectedListOptions: [`${settings.projName}${settings.layerName}`],
    };

    await addFunction(projRoot, { functionTemplate: 'Hello World', layerOptions, name: functionName }, 'nodejs');

    overrideFunctionSrcNode(projRoot, functionName, functionCode);

    await amplifyPushLayer(projRoot, {
      acceptSuggestedLayerVersionConfigurations: true,
    });

    const payload = '{}';
    let response = await functionCloudInvoke(projRoot, { funcName: functionName, payload: payload });
    expect(JSON.parse(JSON.parse(response.Payload.toString()).body)).toEqual(helloWorldUpperCaseOutput);

    // 2. Step
    // - Update casing.js in layer
    // - Update function to use V1 of the layer
    // - Push
    // - Invoke function, result must be the same as first time (upper cased)

    addOptFile(projRoot, settings.projName, settings.layerName, caseLayerIndexV2, 'casing.js');

    const fullLayerName = `${settings.projName}${settings.layerName}`;

    const settingsUpdate = {
      runtimes: ['nodejs'],
      layerName,
      projName,
      layerOptions: {
        select: [fullLayerName],
        expectedListOptions: [fullLayerName],
        versions: { [fullLayerName]: { version: 1, expectedVersionOptions: [1] } },
        skipLayerAssignment: true,
      },
    };

    await updateFunction(projRoot, settingsUpdate, 'nodejs');

    await amplifyPushLayer(projRoot, {
      acceptSuggestedLayerVersionConfigurations: true,
    });

    response = await functionCloudInvoke(projRoot, { funcName: functionName, payload: payload });

    expect(JSON.parse(JSON.parse(response.Payload.toString()).body)).toEqual(helloWorldUpperCaseOutput);

    // 3. Step
    // - Update function to use latest version of the layer
    // - Push
    // - Invoke function, result must be the different (title cased)

    const settingsUpdateToLatestVersion = {
      runtimes: ['nodejs'],
      layerName,
      projName,
      layerOptions: {
        layerWalkthrough: (chain: ExecutionContext): void => {
          chain
            .wait('Provide existing layers')
            .sendCarriageReturn()
            .wait(`Select a version for ${fullLayerName}`)
            .sendKeyUp(2) // Move from version 1 to Always choose latest version
            .sendCarriageReturn();
        },
      },
    };

    await updateFunction(projRoot, settingsUpdateToLatestVersion, 'nodejs');

    await amplifyPushAuth(projRoot);

    response = await functionCloudInvoke(projRoot, { funcName: functionName, payload: payload });

    expect(JSON.parse(JSON.parse(response.Payload.toString()).body)).toEqual(helloWorldTitleCaseOutput);
  });
});
