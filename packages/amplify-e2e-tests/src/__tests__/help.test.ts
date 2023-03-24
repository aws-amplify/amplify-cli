import {
  createNewProjectDir,
  initJSProjectWithProfile,
  deleteProject,
  deleteProjectDir,
  statusWithHelp,
  statusForCategoryWithHelp,
  addS3AndAuthWithAuthOnlyAccess,
  amplifyPushAuth,
} from '@aws-amplify/amplify-e2e-core';

describe('help happy paths', () => {
  let projRoot: string;
  beforeAll(async () => {
    projRoot = await createNewProjectDir('help-happy-paths');
    await initJSProjectWithProfile(projRoot, {});
    await addS3AndAuthWithAuthOnlyAccess(projRoot);
    await amplifyPushAuth(projRoot);
  });

  afterAll(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  test('amplify status', async () => {
    await statusWithHelp(projRoot, ['USAGE', 'amplify status [-v | --verbose]']);
  });

  test('amplify status storage', async () => {
    await statusForCategoryWithHelp(projRoot, 'storage', ['USAGE', 'amplify storage status']);
  });
});
