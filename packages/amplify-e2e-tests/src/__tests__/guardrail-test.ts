import {
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  addFunction,
  generateRandomShortId,
  getAppId,
  getProjectMeta,
  expectParametersOptionalValue,
  amplifyPushAuth,
} from '@aws-amplify/amplify-e2e-core';
import { addEnvironmentCarryOverEnvVars, removeEnvironment, checkoutEnvironment } from '../environment/env';

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
    const appId = getAppId(projRoot);
    const region = meta.providers.awscloudformation.Region;
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
    await expectParametersOptionalValue(expectedParamsAfterAddFunc, [], region, appId, firstEnvName, fnName);

    await addEnvironmentCarryOverEnvVars(projRoot, { envName: secondEnvName });
    await amplifyPushAuth(projRoot);
    const expectedParamsAfterAddEnv = [
      { name: 'deploymentBucketName' },
      { name: envVariableName, value: envVariableValue },
      { name: 's3Key' },
    ];
    await expectParametersOptionalValue(expectedParamsAfterAddFunc, [], region, appId, firstEnvName, fnName);
    await expectParametersOptionalValue(expectedParamsAfterAddEnv, [], region, appId, secondEnvName, fnName);

    await checkoutEnvironment(projRoot, { envName: firstEnvName });
    await removeEnvironment(projRoot, { envName: secondEnvName });
    await amplifyPushAuth(projRoot);
    await expectParametersOptionalValue(expectedParamsAfterAddFunc, [], region, appId, firstEnvName, fnName);
    await expectParametersOptionalValue(
      [],
      expectedParamsAfterAddEnv.map(pair => pair.name),
      region,
      appId,
      secondEnvName,
      fnName,
    );

    await deleteProject(projRoot);
    await expectParametersOptionalValue(
      [],
      expectedParamsAfterAddFunc.map(pair => pair.name),
      region,
      appId,
      firstEnvName,
      fnName,
    );
    await expectParametersOptionalValue(
      [],
      expectedParamsAfterAddEnv.map(pair => pair.name),
      region,
      appId,
      secondEnvName,
      fnName,
    );
  });
});
