import {
  addFunction,
  addLayer,
  amplifyPushAuth,
  amplifyPushLayer,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  ExecutionContext,
  getCurrentLayerArnFromMeta,
  getProjectConfig,
  getProjectMeta,
  initJSProjectWithProfile,
  LayerRuntime,
  removeFunction,
  removeLayerVersion,
  updateOptData,
  validateLayerDir,
  validateLayerMetadata,
} from '@aws-amplify/amplify-e2e-core';
import { v4 as uuid } from 'uuid';

describe('test amplify remove function', () => {
  let projRoot: string;
  let projName: string;
  const envName = 'integtest';

  beforeEach(async () => {
    projRoot = await createNewProjectDir('layers');
    await initJSProjectWithProfile(projRoot, { envName });
    ({ projectName: projName } = getProjectConfig(projRoot));
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project, add layer, push 4 layer versions and delete first 3 of them, then push and verify', async () => {
    const [shortId] = uuid().split('-');
    const layerName = `simplelayer${shortId}`;
    const runtime: LayerRuntime = 'nodejs';

    const settings = {
      runtimes: [runtime],
      layerName,
      projName,
    };
    const arns: string[] = [];
    await addLayer(projRoot, settings);
    expect(validateLayerDir(projRoot, { projName, layerName: settings.layerName }, settings.runtimes)).toBe(true);
    await amplifyPushLayer(projRoot, {
      acceptSuggestedLayerVersionConfigurations: true,
    });
    arns.push(getCurrentLayerArnFromMeta(projRoot, settings));
    for (const i in [1, 2, 3]) {
      updateOptData(projRoot, settings, i);
      await amplifyPushLayer(projRoot, {
        acceptSuggestedLayerVersionConfigurations: true,
      });
      arns.push(getCurrentLayerArnFromMeta(projRoot, settings));
    }
    const removeVersion = [1, 2, 3];
    await removeLayerVersion(projRoot, {}, removeVersion, [1, 2, 3, 4]);
    updateOptData(projRoot, settings, 'end');
    await amplifyPushLayer(projRoot, {
      acceptSuggestedLayerVersionConfigurations: true,
    });
    arns.push(getCurrentLayerArnFromMeta(projRoot, settings));
    arns.splice(0, 3);
    await validateLayerMetadata(projRoot, settings, getProjectMeta(projRoot), envName, arns);
  });

  it('init a project, add layer, push 2 layer versions, add 2 dependent functions, check that removal is blocked', async () => {
    const [shortId] = uuid().split('-');
    const layerName = `simplelayer${shortId}`;
    const runtime: LayerRuntime = 'nodejs';

    const settings = {
      runtimes: [runtime],
      layerName,
      projName,
    };
    const arns: string[] = [];
    await addLayer(projRoot, settings);
    expect(validateLayerDir(projRoot, { projName, layerName: settings.layerName }, settings.runtimes)).toBe(true);
    await amplifyPushLayer(projRoot, { acceptSuggestedLayerVersionConfigurations: true });
    arns.push(getCurrentLayerArnFromMeta(projRoot, settings));
    updateOptData(projRoot, settings, 'update');
    await amplifyPushLayer(projRoot, { acceptSuggestedLayerVersionConfigurations: true });
    arns.push(getCurrentLayerArnFromMeta(projRoot, settings));

    const fnName1 = `integtestFn1${shortId}`;
    const fnName2 = `integtestFn2${shortId}`;

    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        name: fnName1,
        layerOptions: {
          layerWalkthrough: (chain: ExecutionContext): void => {
            chain
              .wait('Provide existing layers')
              .sendKeyDown()
              .send(' ')
              .sendCarriageReturn()
              .wait(`Select a version for ${projName + layerName}`)
              .sendKeyDown(2) // Move from Always choose latest version to version 1
              .sendCarriageReturn();
          },
        },
      },
      runtime,
    );
    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        name: fnName2,
        layerOptions: {
          layerWalkthrough: (chain: ExecutionContext): void => {
            chain
              .wait('Provide existing layers')
              .sendKeyDown()
              .send(' ')
              .sendCarriageReturn()
              .wait(`Select a version for ${projName + layerName}`)
              .sendKeyDown() // Move from Always choose latest version to version 2
              .sendCarriageReturn();
          },
        },
      },
      runtime,
    );

    await removeLayerVersion(projRoot, { removeNoLayerVersions: true, multipleResources: true }, [1, 2], [1, 2]);
    await validateLayerMetadata(projRoot, settings, getProjectMeta(projRoot), envName, arns);

    await removeFunction(projRoot, fnName1);
    await removeFunction(projRoot, fnName2);

    await removeLayerVersion(projRoot, {}, [1], [1, 2]);
    await amplifyPushAuth(projRoot);
    await validateLayerMetadata(projRoot, settings, getProjectMeta(projRoot), envName, arns.splice(1));
  });
});
