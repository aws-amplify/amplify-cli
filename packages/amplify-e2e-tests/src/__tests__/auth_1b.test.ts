import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  getAppId,
  addAuthWithDefaultSocial,
  updateAuthSignInSignOutUrl,
  amplifyPull,
  createNewProjectDir,
  deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';

describe('amplify add auth...', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('...should init a project and add auth with defaults, pull project and push again', async () => {
    await initJSProjectWithProfile(projRoot, {
      disableAmplifyAppCreation: false,
      name: 'authtest',
    });
    await addAuthWithDefaultSocial(projRoot);
    await amplifyPushAuth(projRoot);
    const appId = getAppId(projRoot);
    const projRootPullAuth = await createNewProjectDir('authPullTest');
    await amplifyPull(projRootPullAuth, {
      emptyDir: true,
      noUpdateBackend: false,
      appId,
    });
    await updateAuthSignInSignOutUrl(projRootPullAuth, {
      signinUrl: 'https://www.google.com/',
      signoutUrl: 'https://www.nytimes.com/',
      updatesigninUrl: 'http://localhost:3003/',
      updatesignoutUrl: 'http://localhost:3004/',
    });
    await amplifyPushAuth(projRootPullAuth);
    deleteProjectDir(projRootPullAuth);
  });
});
