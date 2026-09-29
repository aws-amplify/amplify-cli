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

describe('python function tests', () => {
  const statusCode = 200;
  const headers = {
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  };
  const message = 'Hello from your new Amplify Python lambda!';
  const helloWorldSuccessOutput = {
    statusCode,
    headers,
    body: message,
  };

  let projRoot: string;
  let funcName: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('py-functions');
    await initJSProjectWithProfile(projRoot, {});

    funcName = `pytestfn${generateRandomShortId()}`;

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
    expect(JSON.parse(response.Payload.transformToString())).toEqual(JSON.parse(JSON.stringify(helloWorldSuccessOutputCloud)));
  });
});
