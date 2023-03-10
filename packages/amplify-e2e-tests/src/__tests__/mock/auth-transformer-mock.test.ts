import {
  addApiWithAllAuthModes,
  amplifyMock,
  createNewProjectDir, deleteProject, deleteProjectDir,
  initJSProjectWithProfile,
  updateApiSchema,
} from '@aws-amplify/amplify-e2e-core';

describe('Test auth transformer with mock', () => {
  const projName = 'authmock'
  let projRoot: string;
  let executionContext;
  beforeEach(async () => {
    projRoot = await createNewProjectDir(projName);
    await initJSProjectWithProfile(projRoot, { name: projName });
    await addApiWithAllAuthModes(projRoot, { transformerVersion: 2 });
    await updateApiSchema(projRoot, projName, 'simple_model.graphql');
    executionContext = amplifyMock(projRoot);
  });

  afterEach(async () => {
    await executionContext.sendCtrlC().runAsync();
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('Should execute a simple list query against mock server', async () => {

  });
});
