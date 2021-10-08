import {
  getAppId,
  addApiWithSchema,
  amplifyPull,
  amplifyPush,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
} from 'amplify-e2e-core';

describe('amplify pull', () => {
  let projRoot: string;
  let projRoot2: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('pull-test');
    projRoot2 = await createNewProjectDir('pull-test-2');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
    deleteProjectDir(projRoot2);
  });

  it('pulling twice with noUpdateBackend does not re-prompt', async () => {
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
    await addApiWithSchema(projRoot, 'simple_model.graphql');
    await amplifyPush(projRoot);
    const appId = getAppId(projRoot);
    await amplifyPull(projRoot2, { appId, emptyDir: true, noUpdateBackend: true });
    await amplifyPull(projRoot2, { appId, noUpdateBackend: true });
  });
});
