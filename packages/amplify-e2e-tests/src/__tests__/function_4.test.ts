import {
  addFunction,
  addLayer,
  addOptData,
  amplifyPushAuth,
  amplifyPushLayer,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  functionBuild,
  functionCloudInvoke,
  functionMockAssert,
  getCloudWatchEventRule,
  getFunction,
  getProjectConfig,
  getProjectMeta,
  initJSProjectWithProfile,
  LayerOptions,
  LayerRuntime,
  loadFunctionTestFile,
  overrideFunctionSrcNode,
  overrideFunctionSrcPython,
  overrideLayerCodeNode,
  overrideLayerCodePython,
  updateFunction,
} from 'amplify-e2e-core';
import { v4 as uuid } from 'uuid';

describe('java function tests', () => {
  const helloWorldSuccessObj = {
    greetings: 'Hello John Doe!',
  };
  const helloWorldSuccessString = '  "greetings": "Hello John Doe!"';
  let projRoot: string;
  let funcName: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('java-functions');
    await initJSProjectWithProfile(projRoot, {});

    const [shortId] = uuid().split('-');
    funcName = `javatestfn${shortId}`;

    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: 'Hello World',
      },
      'java',
    );
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add java hello world function and mock locally', async () => {
    await functionMockAssert(projRoot, {
      funcName,
      successString: helloWorldSuccessString,
      eventFile: 'src/event.json',
    }); // will throw if successString is not in output
  });

  it('add java hello world function and invoke in the cloud', async () => {
    const payload = '{"firstName":"John","lastName" : "Doe"}';
    await amplifyPushAuth(projRoot);
    const response = await functionCloudInvoke(projRoot, { funcName, payload });
    expect(JSON.parse(response.Payload.toString())).toEqual(helloWorldSuccessObj);
  });
});

describe('amplify add/update/remove function based on schedule rule', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('schedule');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add a schedule rule for daily', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        schedulePermissions: {
          interval: 'Daily',
        },
      },
      'nodejs',
    );
    await functionBuild(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const { Arn: functionArn, Name: functionName, Region: region, CloudWatchEventRule: ruleName } = Object.keys(meta.function).map(
      key => meta.function[key],
    )[0].output;
    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();
    expect(ruleName).toBeDefined();
    const cloudFunction = await getFunction(functionName, region);
    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
    const ScheduleRuleName = await getCloudWatchEventRule(functionArn, meta.providers.awscloudformation.Region);
    expect(ScheduleRuleName.RuleNames[0]).toEqual(ruleName);
  });

  it('update a schedule rule for daily', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        schedulePermissions: {
          interval: 'Daily',
        },
      },
      'nodejs',
    );
    await functionBuild(projRoot, {});
    await updateFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        schedulePermissions: {
          interval: 'Daily',
          action: 'Update the schedule',
        },
      },
      'nodejs',
    );
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const { Arn: functionArn, Name: functionName, Region: region, CloudWatchEventRule: ruleName } = Object.keys(meta.function).map(
      key => meta.function[key],
    )[0].output;
    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();
    expect(ruleName).toBeDefined();

    const cloudFunction = await getFunction(functionName, region);
    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
    const ScheduleRuleName = await getCloudWatchEventRule(functionArn, meta.providers.awscloudformation.Region);
    expect(ScheduleRuleName.RuleNames[0]).toEqual(ruleName);
  });

  it('remove a schedule rule for daily', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        schedulePermissions: {
          interval: 'Daily',
        },
      },
      'nodejs',
    );
    await functionBuild(projRoot, {});
    await updateFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        schedulePermissions: {
          interval: 'Daily',
          action: 'Remove the schedule',
        },
      },
      'nodejs',
    );
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const { Arn: functionArn, Name: functionName, Region: region, CloudWatchEventRule: ruleName } = Object.keys(meta.function).map(
      key => meta.function[key],
    )[0].output;
    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();
    expect(ruleName).toBeUndefined();

    const cloudFunction = await getFunction(functionName, region);
    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
  });
});

describe('add function with layers for runtime nodeJS', () => {
  let projRoot: string;
  let projName: string;
  const lambdaTestString = 'Hello from Lambda!';
  const helloWorldSuccessOutput = 'HELLO FROM LAMBDA! data';
  let functionName: string;
  const runtimes: LayerRuntime[] = ['nodejs'];

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
    const response = await functionCloudInvoke(projRoot, { funcName: functionName, payload: payload });

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
    const response = await functionCloudInvoke(projRoot, { funcName: functionName, payload: payload });

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
    const response = await functionCloudInvoke(projRoot, { funcName: functionName, payload: payload });

    expect(JSON.parse(response.Payload.toString()).body).toMatch(helloWorldSuccessOutput);
  });
});
