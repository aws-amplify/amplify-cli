import {
  addFunction,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  functionBuild,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';

describe('amplify add analytics', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('analytics');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add analytics and function', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
      },
      'nodejs',
    );
    await functionBuild(projRoot);
  });
});
