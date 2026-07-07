import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  addFunction,
  functionCloudInvoke,
  createNewProjectDir,
  deleteProjectDir,
  generateRandomShortId,
} from '@aws-amplify/amplify-e2e-core';

describe('go function tests', () => {
  const helloWorldSuccessOutput = 'Hello Amplify!';
  let projRoot: string;
  let funcName: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('go-functions');
    await initJSProjectWithProfile(projRoot, {});

    funcName = `gotestfn${generateRandomShortId()}`;

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

  it('add go hello world function and invoke in the cloud', async () => {
    const payload = '{"name":"Amplify"}';
    await amplifyPushAuth(projRoot);
    const response = await functionCloudInvoke(projRoot, { funcName, payload });
    expect(JSON.parse(response.Payload.transformToString())).toEqual(helloWorldSuccessOutput);
  });
});
