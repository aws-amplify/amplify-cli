import { initJSProjectWithProfile, deleteProject, amplifyPushAuth, amplifyPush } from 'amplify-e2e-core';
import { addFunction, updateFunction, functionBuild, addLambdaTrigger, functionMockAssert, functionCloudInvoke } from 'amplify-e2e-core';
import { addLayer, LayerOptions } from 'amplify-e2e-core';
import { addSimpleDDB } from 'amplify-e2e-core';
import { addKinesis } from 'amplify-e2e-core';
import {
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
  getFunction,
  overrideFunctionSrc,
  getFunctionSrc,
  overrideLayerCode,
  overrideFunctionSrcPython,
  overrideLayerCodePython,
  overrideLayerCodeJava,
} from 'amplify-e2e-core';
import { addApiWithSchema } from 'amplify-e2e-core';

import { appsyncGraphQLRequest } from 'amplify-e2e-core';
import { getCloudWatchLogs, putKinesisRecords, invokeFunction, getCloudWatchEventRule, getEventSourceMappings } from 'amplify-e2e-core';
import fs from 'fs-extra';
import path from 'path';
import { retry, readJsonFile } from 'amplify-e2e-core';

describe('go function tests', () => {
  const helloWorldSuccessOutput = 'Hello Amplify!';
  let projRoot: string;
  let funcName: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('go-functions');
    await initJSProjectWithProfile(projRoot, {});

    const random = Math.floor(Math.random() * 10000);
    funcName = `gotestfn${random}`;

    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: 'Hello World',
      },
      'go',
    );
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add go hello world function and mock locally', async () => {
    await functionMockAssert(projRoot, {
      funcName,
      successString: helloWorldSuccessOutput,
      eventFile: 'src/event.json',
    }); // will throw if successString is not in output
  });

  it('add go hello world function and invoke in the cloud', async () => {
    const payload = '{"name":"Amplify"}';
    await amplifyPushAuth(projRoot);
    const response = await functionCloudInvoke(projRoot, { funcName, payload });
    expect(JSON.parse(response.Payload.toString())).toEqual(helloWorldSuccessOutput);
  });
});

describe('python function tests', () => {
  const helloWorldSuccessOutput = '{"message":"Hello from your new Amplify Python lambda!"}';

  let projRoot: string;
  let funcName: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('py-functions');
    await initJSProjectWithProfile(projRoot, {});

    const random = Math.floor(Math.random() * 10000);
    funcName = `pytestfn${random}`;

    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: 'Hello World',
      },
      'python',
    );
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add python hello world and mock locally', async () => {
    await functionMockAssert(projRoot, {
      funcName,
      successString: helloWorldSuccessOutput,
      eventFile: 'src/event.json',
    }); // will throw if successString is not in output
  });

  it('add python hello world and invoke in the cloud', async () => {
    const payload = '{"test":"event"}';
    await amplifyPushAuth(projRoot);
    const response = await functionCloudInvoke(projRoot, { funcName, payload });
    expect(JSON.parse(response.Payload.toString())).toEqual(JSON.parse(helloWorldSuccessOutput));
  });
});

describe('dotnet function tests', () => {
  const helloWorldSuccessOutput = '{"key1":"VALUE1","key2":"VALUE2","key3":"VALUE3"}';
  let projRoot: string;
  let funcName: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('dotnet-functions');
    await initJSProjectWithProfile(projRoot, {});

    const random = Math.floor(Math.random() * 10000);
    funcName = `dotnettestfn${random}`;

    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: 'Hello World',
      },
      'dotnetCore31',
    );
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add dotnet hello world function and mock locally', async () => {
    await functionMockAssert(projRoot, {
      funcName,
      successString: helloWorldSuccessOutput,
      eventFile: 'src/event.json',
    }); // will throw if successString is not in output
  });

  it('add dotnet hello world function and invoke in the cloud', async () => {
    const payload = '{"key1":"value1","key2":"value2","key3":"value3"}';
    await amplifyPushAuth(projRoot);
    const response = await functionCloudInvoke(projRoot, { funcName, payload });
    expect(JSON.parse(response.Payload.toString())).toEqual(JSON.parse(helloWorldSuccessOutput));
  });
});

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

  it('add a schedule rule for daily ', async () => {
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
  const helloWorldSuccessOutput = 'Hello from Lambda!';
  const random = Math.floor(Math.random() * 10000);
  let functionName: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('functions');
    await initJSProjectWithProfile(projRoot, {});
    const settings = {
      layerName: `testlayer${random}`,
      versionChanged: true,
      runtimes: ['nodejs'],
    };
    await addLayer(projRoot, settings);
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
    functionName = `testfunction${random}`;
    await addFunction(projRoot, { functionTemplate: 'Hello World', layerOptions, name: functionName }, 'nodejs');
    overrideFunctionSrc(
      projRoot,
      functionName,
      `
      const testString = require('${settings.layerName}');
      exports.handler = async (event) => {
        const response = {
            statusCode: 200,
            body: JSON.stringify(testString),
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
    expect(JSON.parse(JSON.parse(response.Payload).body)).toEqual(helloWorldSuccessOutput);
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
      layerName: `testlayer${random}`,
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
    functionName = `testfunction${random}`;
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
    expect(JSON.parse(response.Payload).message).toEqual(helloWorldSuccessOutput);
  });
});
