import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  getBackendAmplifyMeta,
  addFunction,
  functionMockAssert,
  functionCloudInvoke,
  createNewProjectDir,
  deleteProjectDir,
  generateRandomShortId,
} from '@aws-amplify/amplify-e2e-core';
import _ from 'lodash';

describe('nodejs function tests', () => {
  const helloWorldSuccessString = 'Hello from Lambda!';
  const helloWorldSuccessObj = {
    statusCode: 200,
    body: '"Hello from Lambda!"',
  };

  let projRoot: string;
  let funcName: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('nodejs-functions');
    await initJSProjectWithProfile(projRoot, {});

    funcName = `nodejstestfn${generateRandomShortId()}`;

    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: 'Hello World',
      },
      'nodejs',
    );
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add nodejs hello world function and mock locally', async () => {
    await functionMockAssert(projRoot, {
      funcName,
      successString: helloWorldSuccessString,
      eventFile: 'src/event.json',
    }); // will throw if successString is not in output
  });

  it('add nodejs hello world function and invoke in the cloud', async () => {
    const payload = '{"key1":"value1","key2":"value2","key3":"value3"}';

    await amplifyPushAuth(projRoot);

    const response = await functionCloudInvoke(projRoot, { funcName, payload });

    expect(JSON.parse(response.Payload.toString())).toEqual(helloWorldSuccessObj);
  });

  it('add nodejs hello world function and mock locally, check buildType, push, check buildType', async () => {
    await functionMockAssert(projRoot, {
      funcName,
      successString: helloWorldSuccessString,
      eventFile: 'src/event.json',
    }); // will throw if successString is not in output

    let meta = getBackendAmplifyMeta(projRoot);
    let functionResource = _.get(meta, ['function', funcName]);

    const lastDevBuildTimeStampBeforePush = functionResource.lastDevBuildTimeStamp;

    // Mock should trigger a DEV build of the function
    expect(functionResource).toBeDefined();
    expect(functionResource.lastBuildType).toEqual('DEV');

    await amplifyPushAuth(projRoot);

    meta = getBackendAmplifyMeta(projRoot);
    functionResource = _.get(meta, ['function', funcName]);

    // Push should trigger a PROD build of the function
    expect(functionResource.lastBuildType).toEqual('PROD');
    expect(functionResource.lastDevBuildTimeStamp).toEqual(lastDevBuildTimeStampBeforePush);
  });
});
