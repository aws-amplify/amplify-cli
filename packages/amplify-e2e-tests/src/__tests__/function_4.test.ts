import {
  addFunction,
  addLayer,
  addOptData,
  amplifyPushLayer,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  functionCloudInvoke,
  getProjectConfig,
  initJSProjectWithProfile,
  LayerOptions,
  LayerRuntime,
  loadFunctionTestFile,
  overrideFunctionSrcNode,
  overrideFunctionSrcPython,
  overrideLayerCodeNode,
  overrideLayerCodePython,
} from '@aws-amplify/amplify-e2e-core';
import { v4 as uuid } from 'uuid';
import { execSync } from 'child_process';

describe('add function with layers for runtime nodeJS', () => {
  let projRoot: string;
  let projName: string;
  const lambdaTestString = 'Hello from Lambda!';
  const helloWorldSuccessOutput = 'HELLO FROM LAMBDA! data';
  let functionName: string;
  const runtimes: LayerRuntime[] = ['nodejs'];

  // Install Python 3.13 if not available
  beforeAll(async () => {
    try {
      execSync('python3.13 --version', { stdio: 'ignore' });
    } catch {
      console.log('Installing Python 3.13...');
      execSync(
        `
        wget -q https://www.python.org/ftp/python/3.13.0/Python-3.13.0.tgz &&
        tar xzf Python-3.13.0.tgz &&
        cd Python-3.13.0 &&
        ./configure --enable-optimizations --quiet &&
        make -j$(nproc) --quiet &&
        sudo make altinstall --quiet &&
        cd .. &&
        rm -rf Python-3.13.0*
      `,
        { stdio: 'inherit' },
      );
    }
  });

  beforeEach(async () => {
    projRoot = await createNewProjectDir('functions');
    await initJSProjectWithProfile(projRoot, {});
    ({ projectName: projName } = getProjectConfig(projRoot));
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('can add project layers and external layers for nodejs', async () => {
    const [shortId] = uuid().split('-');
    const settings = {
      layerName: `nodetestlayer${shortId}`,
      projName,
      runtimes,
    };

    await addLayer(projRoot, settings);

    addOptData(projRoot, {
      layerName: settings.layerName,
      projName,
    });

    const packageJsonContent = loadFunctionTestFile('case-layer-package.json');
    let functionCode = loadFunctionTestFile('case-function.js');

    functionCode = functionCode.replace('{{testString}}', lambdaTestString);

    overrideLayerCodeNode(projRoot, projName, settings.layerName, packageJsonContent, 'package.json');

    const layerOptions: LayerOptions = {
      select: [`${settings.layerName}`],
      expectedListOptions: [`${settings.layerName}`],
    };

    functionName = `nodetestfunction${shortId}`;
    await addFunction(projRoot, { functionTemplate: 'Hello World', layerOptions, name: functionName }, 'nodejs');

    overrideFunctionSrcNode(projRoot, functionName, functionCode);

    await amplifyPushLayer(projRoot, {
      acceptSuggestedLayerVersionConfigurations: true,
    });

    const payload = '{}';
    const response = await functionCloudInvoke(projRoot, { funcName: functionName, payload });

    expect(JSON.parse(JSON.parse(response.Payload.toString()).body)).toEqual(helloWorldSuccessOutput);
  });

  it('can add multiple project layers for nodejs', async () => {
    let [shortId] = uuid().split('-');
    const settings = {
      layerName: `nodetestlayer${shortId}`,
      projName,
      runtimes,
    };

    await addLayer(projRoot, settings);

    addOptData(projRoot, {
      layerName: settings.layerName,
      projName,
    });

    [shortId] = uuid().split('-');
    const settings2 = {
      layerName: `nodetestlayer2${shortId}`,
      projName,
      runtimes,
    };

    await addLayer(projRoot, settings2);

    const packageJsonContent = loadFunctionTestFile('case-layer-package.json');
    let functionCode = loadFunctionTestFile('case-function.js');

    functionCode = functionCode.replace('{{testString}}', lambdaTestString);

    overrideLayerCodeNode(projRoot, projName, settings2.layerName, packageJsonContent, 'package.json');

    const layerOptions: LayerOptions = {
      select: [`${settings.layerName}`, `${settings2.layerName}`],
      expectedListOptions: [`${settings.layerName}`, `${settings2.layerName}`],
    };

    functionName = `nodetestfunction${shortId}`;
    await addFunction(projRoot, { functionTemplate: 'Hello World', layerOptions, name: functionName }, 'nodejs');

    overrideFunctionSrcNode(projRoot, functionName, functionCode);

    await amplifyPushLayer(projRoot, {
      acceptSuggestedLayerVersionConfigurations: true,
    });

    const payload = '{}';
    const response = await functionCloudInvoke(projRoot, { funcName: functionName, payload });

    expect(JSON.parse(JSON.parse(response.Payload.toString()).body)).toEqual(helloWorldSuccessOutput);
  });
});

describe('add function with layers for runtime python', () => {
  let projRoot: string;
  let projName: string;
  const lambdaTestString = 'hello from lambda!';
  const helloWorldSuccessOutput = 'Hello From Lambda! data';
  const [shortId] = uuid().split('-');
  let functionName: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('functions');
    await initJSProjectWithProfile(projRoot, {});

    ({ projectName: projName } = getProjectConfig(projRoot));
    const runtimes: LayerRuntime[] = ['python'];

    const settings = {
      layerName: `pytestlayer${shortId}`,
      projName,
      runtimes,
    };

    await addLayer(projRoot, settings);

    addOptData(projRoot, {
      layerName: settings.layerName,
      projName,
    });

    const pipfileContent = loadFunctionTestFile('titlecase.pipfile');
    let functionCode = loadFunctionTestFile('titlecase.py');

    functionCode = functionCode.replace('{{testString}}', lambdaTestString);

    overrideLayerCodePython(projRoot, settings.projName, settings.layerName, pipfileContent, 'Pipfile');

    const layerOptions: LayerOptions = {
      select: [`${settings.layerName}`],
      expectedListOptions: [`${settings.layerName}`],
    };

    functionName = `pytestfunction${shortId}`;
    await addFunction(projRoot, { functionTemplate: 'Hello World', layerOptions, name: functionName }, 'python');

    overrideFunctionSrcPython(projRoot, functionName, functionCode);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('can add project layers and external layers for python', async () => {
    await amplifyPushLayer(projRoot, {
      acceptSuggestedLayerVersionConfigurations: true,
    });

    const payload = '{}';
    const response = await functionCloudInvoke(projRoot, { funcName: functionName, payload });

    expect(JSON.parse(response.Payload.toString()).body).toMatch(helloWorldSuccessOutput);
  });
});
