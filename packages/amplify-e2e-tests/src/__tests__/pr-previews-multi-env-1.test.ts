import {
  addManualHosting,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAmplifyInitConfig,
  getAwsProviderConfig,
  getProjectConfig,
  gitCleanFdX,
  gitCommitAll,
  gitInit,
  initJSProjectWithProfile,
  nonInteractiveInitWithForcePushAttach,
} from '@aws-amplify/amplify-e2e-core';

describe('environment commands with functions secrets handling', () => {
  let projRoot: string;

  beforeAll(async () => {
    process.env.AMPLIFY_ENABLE_DEBUG_OUTPUT === 'true';
    projRoot = await createNewProjectDir('env-test');
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false, envName: 'dev' });
    await addManualHosting(projRoot);
    await amplifyPushAuth(projRoot);
  });

  afterAll(async () => {
    process.env.AMPLIFY_ENABLE_DEBUG_OUTPUT === 'false';
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('simulating PR previews with manual hosting', async () => {
    const { projectName } = getProjectConfig(projRoot);
    await gitInit(projRoot);
    await gitCommitAll(projRoot);
    await gitCleanFdX(projRoot);
    await nonInteractiveInitWithForcePushAttach(projRoot, getAmplifyInitConfig(projectName, 'next'), getAwsProviderConfig());
  });
});
