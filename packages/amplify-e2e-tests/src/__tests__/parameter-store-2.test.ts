import {
  addAuthWithEmailVerificationAndUserPoolGroupTriggers,
  addFunction,
  amplifyPull,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  expectParametersOptionalValue,
  generateRandomShortId,
  getAppId,
  getProjectMeta,
  getTeamProviderInfo,
  gitCleanFdx,
  gitCommitAll,
  gitInit,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';

describe('parameters in Parameter Store', () => {
  let projRoot: string;
  const envName = 'devtest';

  beforeEach(async () => {
    projRoot = await createNewProjectDir('multi-env');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('hydrates missing parameters into TPI on pull', async () => {
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false, envName });
    const meta = getProjectMeta(projRoot);
    expect(meta).toBeDefined();
    const appId = getAppId(projRoot);
    expect(appId).toBeDefined();
    const region = meta.providers.awscloudformation.Region;
    expect(region).toBeDefined();
    await gitInit(projRoot);
    await gitCommitAll(projRoot); // commit all just after init, so no categories block exists in TPI yet

    const envVariableName = 'envVariableName';
    const envVariableValue = 'envVariableValue';

    const fnName = `parameterstestfn${generateRandomShortId()}`;
    await addFunction(
      projRoot,
      {
        name: fnName,
        functionTemplate: 'Hello World',
        environmentVariables: {
          key: envVariableName,
          value: envVariableValue,
        },
      },
      'nodejs',
    );
    await addAuthWithEmailVerificationAndUserPoolGroupTriggers(projRoot);
    await amplifyPushAuth(projRoot);
    const expectedParamsAfterPush = [
      { name: 'deploymentBucketName' },
      { name: envVariableName, value: envVariableValue },
      { name: 's3Key' },
    ];
    await expectParametersOptionalValue(expectedParamsAfterPush, [], region, appId, envName, 'function', fnName);

    const preCleanTpi = getTeamProviderInfo(projRoot);

    // test pull --restore same dir
    await gitCleanFdx(projRoot); // clear TPI
    await amplifyPull(projRoot, { appId, envName, withRestore: true, emptyDir: true });
    const postPullWithRestoreTpi = getTeamProviderInfo(projRoot);
    expect(postPullWithRestoreTpi).toEqual(preCleanTpi);

    // test pull same dir
    await gitCleanFdx(projRoot); // clear TPI
    await amplifyPull(projRoot, { appId, envName, withRestore: false, emptyDir: true });
    const postPullWithoutRestoreTpi = getTeamProviderInfo(projRoot);
    expect(postPullWithoutRestoreTpi).toEqual(preCleanTpi);

    expect(await getTpiAfterPullInEmptyDir(appId, envName, true)).toEqual(preCleanTpi);
    expect(await getTpiAfterPullInEmptyDir(appId, envName, false)).toEqual(preCleanTpi);
  });

  const getTpiAfterPullInEmptyDir = async (appId: string, envName: string, withRestore: boolean): Promise<Record<string, any>> => {
    let emptyDir: string;
    try {
      emptyDir = await createNewProjectDir('empty-dir-parameters-test');
      await amplifyPull(emptyDir, { appId, envName, withRestore, emptyDir: true });
      return getTeamProviderInfo(emptyDir);
    } finally {
      deleteProjectDir(emptyDir);
    }
  };
});
