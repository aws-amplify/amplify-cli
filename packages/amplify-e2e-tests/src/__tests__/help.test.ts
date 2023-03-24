import {
  createNewProjectDir,
  initJSProjectWithProfile,
  deleteProject,
  deleteProjectDir,
  statusWithHelp,
  statusForCategoryWithHelp,
  pushWithHelp,
  initWithHelp,
  pullWithHelp,
  envWithHelp,
} from '@aws-amplify/amplify-e2e-core';

describe('help happy paths', () => {
  let projRoot: string;
  beforeAll(async () => {
    projRoot = await createNewProjectDir('help-happy-paths');
    await initJSProjectWithProfile(projRoot, {});
  });

  afterAll(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  test('amplify status', async () => {
    await statusWithHelp(projRoot);
  });

  test('amplify status storage', async () => {
    await statusForCategoryWithHelp(projRoot, 'storage');
  });

  test('amplify push', async () => {
    await pushWithHelp(projRoot);
  });

  test('amplify init', async () => {
    await initWithHelp(projRoot);
  });

  test('amplify pull', async () => {
    await pullWithHelp(projRoot);
  });

  test('amplify env', async () => {
    await envWithHelp(projRoot);
  });
});
