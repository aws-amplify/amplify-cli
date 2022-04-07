import {
  addApiWithBlankSchema, addFunction,
  amplifyPush,
  amplifyPushFunction, createNewProjectDir, deleteProject, deleteProjectDir, initJSProjectWithProfile, updateApiSchema,
} from 'amplify-e2e-core';

describe('test function deploy when other resources are present', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir('functions');
  });

  afterEach(async () => {
    await deleteProject(projectRoot);
    deleteProjectDir(projectRoot);
  });

  it('testing amplify push function command', async () => {
    const apiName = 'myApi';
    await initJSProjectWithProfile(projectRoot, {
      name: 'functions',
    });
    await addApiWithBlankSchema(projectRoot, { apiName });
    await updateApiSchema(projectRoot, apiName, 'simple_model.graphql');
    await amplifyPush(projectRoot);
    const random = Math.floor(Math.random() * 10000);
    const fnName = `integtestFn${random}`;
    await addFunction(projectRoot, {
      name: fnName,
      functionTemplate: 'Hello World',
    },
    'nodejs');
    await amplifyPushFunction(projectRoot);
  });
});
