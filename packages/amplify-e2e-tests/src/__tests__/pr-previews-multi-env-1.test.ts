import {
  addManualHosting,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAmplifyInitConfig,
  getAwsProviderConfig,
  getProjectConfig,
  getProjectMeta,
  gitCleanFdX,
  gitCommitAll,
  gitInit,
  initJSProjectWithProfile,
  nonInteractiveInitWithForcePushAttach,
} from '@aws-amplify/amplify-e2e-core';

describe('environment commands with functions secrets handling', () => {
  let projRoot: string;
  let appId: string;
  let region: string;

  beforeAll(async () => {
    projRoot = await createNewProjectDir('env-test');
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false, envName: 'dev' });
    await addManualHosting(projRoot);
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    appId = meta.providers.awscloudformation.AmplifyAppId;
    region = meta.providers.awscloudformation.Region;
  });

  afterAll(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('simulating PR previwes', async () => {
    const { projectName } = getProjectConfig(projRoot);
    await gitInit(projRoot);
    await gitCommitAll(projRoot);
    await gitCleanFdX(projRoot);
    await nonInteractiveInitWithForcePushAttach(projRoot, getAmplifyInitConfig(projectName, 'next'), getAwsProviderConfig());
  });
});
