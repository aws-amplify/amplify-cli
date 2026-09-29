import * as fs from 'fs';
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
  initJSProjectWithProfile,
  LayerRuntime,
  removeFunction,
  removeLayer,
  updateOptData,
  validateLayerDir,
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

  it('init a project, add layer, add 2 dependent functions, remove functions and layers', async () => {
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

    await removeFunction(projRoot, fnName1);
    await removeFunction(projRoot, fnName2);

    const stackBuildDir = `${projRoot}/amplify/backend/awscloudformation`;
    const backendDir = `${projRoot}/amplify/backend`;
    const layerCreatedStack = fs.readdirSync(`${stackBuildDir}/build/function/`).join('');
    const layerCreated = fs.readdirSync(`${backendDir}/function/`).join('');

    expect(layerCreatedStack).toEqual(projName + layerName);
    expect(layerCreated).toEqual(projName + layerName);

    await removeLayer(projRoot, [1, 2], [1, 2]);

    const layerLeftStack = fs.readdirSync(`${stackBuildDir}/build/function/`).join('');
    const layerLeft = fs.readdirSync(`${backendDir}/function/`).join('');
    expect(layerLeftStack).toEqual('');
    expect(layerLeft).toEqual('');

    await amplifyPushAuth(projRoot);
  });
});
