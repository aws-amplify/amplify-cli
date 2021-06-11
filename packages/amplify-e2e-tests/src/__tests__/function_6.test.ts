import {
  addFunction,
  amplifyPull,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  getProjectMeta,
  initJSProjectWithProfile,
} from 'amplify-e2e-core';
import _ from 'lodash';

describe('test initEnv() behavior in function', () => {
  let projRoot: string;
  let projRoot2: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('functions');
    projRoot2 = await createNewProjectDir('functions2');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
    deleteProjectDir(projRoot2);
  });

  it('init a project and add simple function with environment variables', async () => {
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
    const random = Math.floor(Math.random() * 10000);
    const functionName = `testfunction${random}`;
    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        name: functionName,
        environmentVariables: {
          key: 'FOO_BAR',
          value: 'fooBar',
        },
      },
      'nodejs',
    );
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const appId = getAppId(projRoot);
    expect(appId).toBeDefined();
    const { Arn: functionArn, Region: region } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
    expect(functionArn).toBeDefined();
    expect(region).toBeDefined();
    expect(_.get(meta, ['function', functionName, 'FOO_BAR'], undefined)).toBeDefined();
  });
});
