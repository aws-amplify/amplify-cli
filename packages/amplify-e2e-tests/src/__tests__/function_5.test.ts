import {
  addFunction,
  addApiWithSchema,
  amplifyPull,
  amplifyPushAuth,
  amplifyPush,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  getProjectMeta,
  initJSProjectWithProfile,
  updateApiSchema,
  updateFunction,
  getLambdaFunction,
  amplifyPushWithoutCodegen,
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

  it('init a project and add simple function and uncomment cors header', async () => {
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
    const random = Math.floor(Math.random() * 10000);
    const functionName = `testfunction${random}`;
    await addFunction(projRoot, { functionTemplate: 'Hello World', name: functionName }, 'nodejs');
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const appId = getAppId(projRoot);
    expect(appId).toBeDefined();
    const { Arn: functionArn, Region: region } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
    expect(functionArn).toBeDefined();
    expect(region).toBeDefined();
    expect(_.get(meta, ['function', functionName, 's3Bucket'], undefined)).toBeDefined();

    await amplifyPull(projRoot2, { emptyDir: true, appId });

    // Change function resource status to Updated
    await updateFunction(
      projRoot2,
      {
        schedulePermissions: {
          interval: 'Weekly',
          action: 'Update the schedule',
          noScheduleAdded: true,
        },
      },
      'nodejs',
    );

    await amplifyPushAuth(projRoot2);
    const meta2 = getProjectMeta(projRoot2);
    const { Arn: functionArn2, Region: region2 } = Object.keys(meta2.function).map(key => meta2.function[key])[0].output;
    expect(functionArn2).toBeDefined();
    expect(region2).toBeDefined();
    expect(_.get(meta2, ['function', functionName, 's3Bucket'], undefined)).toBeDefined();
  });
});

describe('test dependency in root stack', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('functions');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project with api and function and update the @model and add function access to @model ', async () => {
    await initJSProjectWithProfile(projRoot, {});
    const projectName = 'mytestapi';
    await addApiWithSchema(projRoot, 'simple_model.graphql', { apiName: projectName });
    const random = Math.floor(Math.random() * 10000);
    const fnName = `integtestfn${random}`;
    await addFunction(
      projRoot,
      {
        name: fnName,
        functionTemplate: 'Hello World',
      },
      'nodejs',
    );
    await amplifyPush(projRoot);
    await updateApiSchema(projRoot, projectName, 'two-model-schema.graphql');
    await updateFunction(
      projRoot,
      {
        name: fnName,
        functionTemplate: 'Hello World',
        additionalPermissions: {
          permissions: ['storage'],
          choices: ['api', 'function', 'storage'],
          resources: ['Comment:@model(appsync)'],
          resourceChoices: ['Post:@model(appsync)', 'Comment:@model(appsync)'],
          operations: ['read'],
        },
      },
      'nodejs',
    );
    await amplifyPushWithoutCodegen(projRoot);
  });
});
