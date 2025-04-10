import {
  addFunction,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  deleteSSMParameter,
  generateRandomShortId,
  getAmplifyInitConfig,
  getProjectConfig,
  getProjectMeta,
  getTeamProviderInfo,
  gitCleanFdx,
  gitCommitAll,
  gitInit,
  initJSProjectWithProfile,
  nonInteractiveInitWithForcePushAttach,
  setTeamProviderInfo,
} from '@aws-amplify/amplify-e2e-core';

describe('init --forcePush', () => {
  const envName = 'testtest';
  let projRoot: string;
  let funcName: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('original');
    await initJSProjectWithProfile(projRoot, { envName, disableAmplifyAppCreation: false });
    funcName = `testfunction${generateRandomShortId()}`;
    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        name: funcName,
        environmentVariables: {
          key: 'FOO_BAR',
          value: 'fooBar',
        },
      },
      'nodejs',
    );
    await amplifyPushAuth(projRoot);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });
  it('fails fast on missing env parameters', async () => {
    const { projectName } = getProjectConfig(projRoot);

    // remove env param from TPI
    const tpi = getTeamProviderInfo(projRoot);
    delete tpi?.[envName]?.categories?.function?.[funcName]?.fooBar;
    setTeamProviderInfo(projRoot, tpi);

    // remote env param from ParameterStore
    const meta = getProjectMeta(projRoot);
    // eslint-disable-next-line no-unsafe-optional-chaining
    const { AmplifyAppId: appId, Region: region } = meta?.providers?.awscloudformation;
    await deleteSSMParameter(region, appId, 'testtest', 'function', funcName, 'fooBar');

    // init --forcePush should fail due to missing param
    const result = await nonInteractiveInitWithForcePushAttach(
      projRoot,
      getAmplifyInitConfig(projectName, 'newenv'),
      undefined,
      false,
      undefined,
      false, // don't reject on failure
    );
    expect(result.exitCode).toBe(1);
  });

  it('restores missing param from ParameterStore', async () => {
    const { projectName } = getProjectConfig(projRoot);

    // remove env param from TPI
    const tpi = getTeamProviderInfo(projRoot);
    delete tpi?.[envName]?.categories?.function?.[funcName]?.fooBar;
    setTeamProviderInfo(projRoot, tpi);

    await nonInteractiveInitWithForcePushAttach(projRoot, getAmplifyInitConfig(projectName, envName), undefined, false);

    const tpiAfter = getTeamProviderInfo(projRoot);
    expect(tpiAfter?.[envName]?.categories?.function?.[funcName]?.fooBar).toBe('fooBar');
  });

  it('succeeds in git cloned project', async () => {
    const { projectName } = getProjectConfig(projRoot);

    await gitInit(projRoot);
    await gitCommitAll(projRoot);
    await gitCleanFdx(projRoot);

    await nonInteractiveInitWithForcePushAttach(projRoot, getAmplifyInitConfig(projectName, envName), undefined, false);
  });
});
