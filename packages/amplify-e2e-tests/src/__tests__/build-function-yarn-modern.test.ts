import execa from 'execa';
import {
  addFunction,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  functionBuild,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';

describe('build successfully via Yarn Modern', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('analytics');
    await execa('corepack', ['enable'], { cwd: projRoot });
    await execa('yarn', ['init', '-2'], { cwd: projRoot });
    await execa('yarn', ['--version'], { cwd: projRoot });
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
