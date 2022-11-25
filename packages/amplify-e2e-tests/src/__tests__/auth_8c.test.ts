import {
  addAuthWithDefault,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initFlutterProjectWithProfile,
  removeAuthWithDefault
} from '@aws-amplify/amplify-e2e-core';

const defaultsSettings = {
  name: 'authTest',
};

describe('amplify add auth...', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('...should init a project and add auth with defaults and then remove auth and add another auth and push', async () => {
    await initFlutterProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot, {});
    await amplifyPushAuth(projRoot);
    await removeAuthWithDefault(projRoot);
    await addAuthWithDefault(projRoot, {});
    await amplifyPushAuth(projRoot);
  });
});
