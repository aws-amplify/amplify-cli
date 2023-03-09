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
  beforeEach(async () => {
    projRoot = await createNewProjectDir(projName);
    await initJSProjectWithProfile(projRoot, { name: projName });
    await addApiWithAllAuthModes(projRoot, { transformerVersion: 2 });
    await updateApiSchema(projRoot, projName, 'simple_model.graphql');
    await amplifyMock(projRoot);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });
});
