/* eslint-disable spellcheck/spell-checker */
import {
  addAuthWithDefaultSocial,
  amplifyPull,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  initJSProjectWithProfile,
  removeAuthWithDefault,
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

  it('...should init a project and add auth with defaultSocial, pull into empty dir, and then remove federation', async () => {
    await initJSProjectWithProfile(projRoot, { ...defaultsSettings, envName: 'integtest', disableAmplifyAppCreation: false });
    await addAuthWithDefaultSocial(projRoot);
    await amplifyPushAuth(projRoot);
    const appId = getAppId(projRoot);
    const projRoot2 = await createNewProjectDir('auth2');
    await amplifyPull(projRoot2, { emptyDir: true, appId, envName: 'integtest' });
    deleteProjectDir(projRoot2);
    await removeAuthWithDefault(projRoot);
    await amplifyPushAuth(projRoot);
  });
});
