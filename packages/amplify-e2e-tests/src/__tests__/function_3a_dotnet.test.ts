import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  addFunction,
  functionMockAssert,
  functionCloudInvoke,
  createNewProjectDir,
  deleteProjectDir,
  generateRandomShortId,
} from '@aws-amplify/amplify-e2e-core';

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

    funcName = `dotnettestfn${generateRandomShortId()}`;

    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: 'Hello World',
      },
      'dotnet8',
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
