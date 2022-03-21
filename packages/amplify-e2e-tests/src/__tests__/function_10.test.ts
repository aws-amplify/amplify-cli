import {
  addApiWithoutSchema,
  addFunction,
  amplifyPush,
  amplifyPushFunction, createNewProjectDir, deleteProject, deleteProjectDir, getAmplifyDirPath, initJSProjectWithProfile, updateApiSchema,
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
    const projectName = 'demoApi';
    await initJSProjectWithProfile(projectRoot, {
      name: projectName,
    });
    await addApiWithoutSchema(projectRoot, { transformerVersion: 1 });
    await updateApiSchema(projectRoot, projectName, 'simple_model.graphql');
    await amplifyPush(projectRoot);
    const random = Math.floor(Math.random() * 10000);
    // eslint-disable-next-line spellcheck/spell-checker
    const fnName = `integtestFn${random}`;
    await addFunction(projectRoot, {
      name: fnName,
      functionTemplate: 'Hello World',
    },
    // eslint-disable-next-line spellcheck/spell-checker
    'nodejs');
    await amplifyPushFunction(projectRoot);
  });
});
