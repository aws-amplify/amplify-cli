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
import {
  addEnvironmentCarryOverEnvVars,
  checkoutEnvironment,
  importEnvironment,
  removeEnvironment,
} from '../environment/env';

describe('upload and delete parameters', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('upload-delete-parameters-test');
  });

  afterEach(async () => {
    deleteProjectDir(projRoot);
  });

  it('adding function should upload to service, removing environment and deleting project should delete parameters', async () => {
    const firstEnvName = 'enva';
    const secondEnvName = 'envb';
    const envVariableName = 'envVariableName';
    const envVariableValue = 'envVariableValue';
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false, envName: firstEnvName });

    const meta = getProjectMeta(projRoot);
    expect(meta).toBeDefined();
    const appId = getAppId(projRoot);
    expect(appId).toBeDefined();
    const region = meta.providers.awscloudformation.Region;
    expect(region).toBeDefined();

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
    await amplifyPushAuth(projRoot);
    const expectedParamsAfterAddFunc = [
      { name: 'deploymentBucketName' },
      { name: envVariableName, value: envVariableValue },
      { name: 's3Key' },
    ];
    await expectParametersOptionalValue(expectedParamsAfterAddFunc, [], region, appId, firstEnvName, 'function', fnName);

    await addEnvironmentCarryOverEnvVars(projRoot, { envName: secondEnvName });
    await amplifyPushAuth(projRoot);
    const expectedParamsAfterAddEnv = [
      { name: 'deploymentBucketName' },
      { name: envVariableName, value: envVariableValue },
      { name: 's3Key' },
    ];
    await expectParametersOptionalValue(expectedParamsAfterAddFunc, [], region, appId, firstEnvName, 'function', fnName);
    await expectParametersOptionalValue(expectedParamsAfterAddEnv, [], region, appId, secondEnvName, 'function', fnName);

    await checkoutEnvironment(projRoot, { envName: firstEnvName });
    await removeEnvironment(projRoot, { envName: secondEnvName });
    await amplifyPushAuth(projRoot);
    await expectParametersOptionalValue(expectedParamsAfterAddFunc, [], region, appId, firstEnvName, 'function', fnName);
    await expectParametersOptionalValue(
      [],
      expectedParamsAfterAddEnv.map(pair => pair.name),
      region,
      appId,
      secondEnvName,
      'function',
      fnName,
    );

    await deleteProject(projRoot);
    await expectParametersOptionalValue(
      [],
      expectedParamsAfterAddFunc.map(pair => pair.name),
      region,
      appId,
      firstEnvName,
      'function',
      fnName,
    );
    await expectParametersOptionalValue(
      [],
      expectedParamsAfterAddEnv.map(pair => pair.name),
      region,
      appId,
      secondEnvName,
      'function',
      fnName,
    );
  });
});

describe('parameters in Parameter Store', () => {
  let projRoot: string;
  const envName = 'enva';

  beforeAll(async () => {
    projRoot = await createNewProjectDir('multi-env-parameters-test');
  });

  afterAll(async () => {
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
