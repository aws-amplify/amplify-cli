import {
  addFunction,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getLambdaFunction,
  initJSProjectWithProfile,
} from 'amplify-e2e-core';
import _ from 'lodash';

describe('function environment variables', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('functions');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('configures env vars that are accessible in the cloud', async () => {
    await initJSProjectWithProfile(projRoot);
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
    const funcDef = await getLambdaFunction(`${functionName}-dev`);
    expect(funcDef?.Configuration?.Environment?.Variables?.FOO_BAR).toEqual('fooBar');
  });

  it('resolves missing env vars on push', async () => {});

  it('carries over env vars to new env', async () => {});
});
