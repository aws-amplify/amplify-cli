import { initJSProjectWithProfile, deleteProject, amplifyPushAuth } from 'amplify-e2e-core';
import { addFunction, updateFunction, functionBuild, functionMockAssert, functionCloudInvoke } from 'amplify-e2e-core';
import { addLayer, addOptData, LayerOptions } from 'amplify-e2e-core';
import {
  createNewProjectDir,
  deleteProjectDir,
  getCloudWatchEventRule,
  getProjectMeta,
  getFunction,
  overrideFunctionSrc,
  overrideLayerCode,
  overrideFunctionSrcPython,
  overrideLayerCodePython,
} from 'amplify-e2e-core';

describe('java function tests', () => {
  const helloWorldSuccessOutput = '{"greetings":"Hello John Doe!"}';
  let projRoot: string;
  let funcName: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('java-functions');
    await initJSProjectWithProfile(projRoot, {});

    const random = Math.floor(Math.random() * 10000);
    funcName = `javatestfn${random}`;

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
      successString: helloWorldSuccessOutput,
      eventFile: 'src/event.json',
    }); // will throw if successString is not in output
  });

  it('add java hello world function and invoke in the cloud', async () => {
    const payload = '{"firstName":"John","lastName" : "Doe"}';
    await amplifyPushAuth(projRoot);
    const response = await functionCloudInvoke(projRoot, { funcName, payload });
    expect(JSON.parse(response.Payload.toString())).toEqual(JSON.parse(helloWorldSuccessOutput));
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
  const helloWorldSuccessOutput = 'Hello from Lambda! data';
  const random = Math.floor(Math.random() * 10000);
  let functionName: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('functions');
    await initJSProjectWithProfile(projRoot, {});
    const settings = {
      layerName: `nodetestlayer${random}`,
      versionChanged: true,
      runtimes: ['nodejs'],
    };
    await addLayer(projRoot, settings);
    addOptData(projRoot, settings.layerName);
    // create index.js
    overrideLayerCode(
      projRoot,
      settings.layerName,
      `
      const testString = "Hello from Lambda!"
      module.exports = testString;
    `,
      `index.js`,
    );

    const layerOptions: LayerOptions = {
      select: [`${settings.layerName}`],
      expectedListOptions: [`${settings.layerName}`],
      versions: {
        [`${settings.layerName}`]: {
          version: 1,
          expectedVersionOptions: [1],
        },
      },
    };
    functionName = `nodetestfunction${random}`;
    await addFunction(projRoot, { functionTemplate: 'Hello World', layerOptions, name: functionName }, 'nodejs');
    overrideFunctionSrc(
      projRoot,
      functionName,
      `
      const fs = require('fs');
      const testString = require('${settings.layerName}');
      exports.handler = async (event) => {
        const data = fs.readFileSync('/opt/data.txt')
        const response = {
            statusCode: 200,
            body: JSON.stringify(testString + ' ' + data),
        };
        return response;
      };
    `,
    );
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });
  it('can add project layers and external layers for nodejs', async () => {
    await amplifyPushAuth(projRoot);
    const payload = '{}';
    const response = await functionCloudInvoke(projRoot, { funcName: functionName, payload: payload });
    expect(JSON.parse(JSON.parse(response.Payload.toString()).body)).toEqual(helloWorldSuccessOutput);
  });
});

describe('add function with layers for runtime python', () => {
  let projRoot: string;
  const helloWorldSuccessOutput = 'Hello from Lambda!';
  const random = Math.floor(Math.random() * 10000);
  let functionName: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('functions');
    await initJSProjectWithProfile(projRoot, {});
    const settings = {
      layerName: `pytestlayer${random}`,
      versionChanged: true,
      runtimes: ['python'],
    };
    await addLayer(projRoot, settings);
    // create index.js
    const layerCodePath = `${__dirname}/../../../amplify-e2e-tests/layerdata/python/testfunc.py`;
    overrideLayerCodePython(projRoot, settings.layerName, layerCodePath);
    const layerOptions: LayerOptions = {
      select: [`${settings.layerName}`],
      expectedListOptions: [`${settings.layerName}`],
      versions: {
        [`${settings.layerName}`]: {
          version: 1,
          expectedVersionOptions: [1],
        },
      },
    };
    functionName = `pytestfunction${random}`;
    await addFunction(projRoot, { functionTemplate: 'Hello World', layerOptions, name: functionName }, 'python');
    const functionCodePath = `${__dirname}/../../../amplify-e2e-tests/layerdata/python/index.py`;
    overrideFunctionSrcPython(projRoot, functionName, functionCodePath);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('can add project layers and external layers for python', async () => {
    await amplifyPushAuth(projRoot);
    const payload = '{}';
    const response = await functionCloudInvoke(projRoot, { funcName: functionName, payload: payload });
    expect(JSON.parse(response.Payload.toString()).message).toEqual(helloWorldSuccessOutput);
  });
});
