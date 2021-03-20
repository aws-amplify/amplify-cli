import { initJSProjectWithProfile, deleteProject, amplifyPushAuth } from 'amplify-e2e-core';
import { addFunction, functionMockAssert, functionCloudInvoke } from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';

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
  const statusCode: number = 200;
  const headers = {
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  };
  const message: string = 'Hello from your new Amplify Python lambda!';
  const helloWorldSuccessOutput = {
    statusCode: statusCode,
    headers: headers,
    body: message,
  };

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
      successString: helloWorldSuccessOutput.body,
      eventFile: 'src/event.json',
      timeout: 120,
    }); // will throw if successString is not in output
  });

  it('add python hello world and invoke in the cloud', async () => {
    const payload = '{"test":"event"}';
    await amplifyPushAuth(projRoot);
    const response = await functionCloudInvoke(projRoot, { funcName, payload });
    const helloWorldSuccessOutputCloud = {
      ...helloWorldSuccessOutput,
      body: JSON.stringify(helloWorldSuccessOutput.body),
    };
    expect(JSON.parse(response.Payload.toString())).toEqual(JSON.parse(JSON.stringify(helloWorldSuccessOutputCloud)));
  });
});

describe('dotnet function tests', () => {
  const helloWorldSuccessObj = {
    key1: 'VALUE1',
    key2: 'VALUE2',
    key3: 'VALUE3',
  };
  const helloWorldSuccessString = '  "key3": "VALUE3"';
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
      successString: helloWorldSuccessString,
      eventFile: 'src/event.json',
    }); // will throw if successString is not in output
  });

  it('add dotnet hello world function and invoke in the cloud', async () => {
    const payload = '{"key1":"value1","key2":"value2","key3":"value3"}';
    await amplifyPushAuth(projRoot);
    const response = await functionCloudInvoke(projRoot, { funcName, payload });
    expect(JSON.parse(response.Payload.toString())).toEqual(helloWorldSuccessObj);
  });
});
