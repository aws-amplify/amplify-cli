import {
  addFunction,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  expectParametersOptionalValue,
  generateRandomShortId,
  getAppId,
  getProjectMeta,
  initJSProjectWithProfile,
  removeFunction,
} from '@aws-amplify/amplify-e2e-core';
import { addEnvironmentCarryOverEnvVars, checkoutEnvironment, removeEnvironment } from '../environment/env';

describe('upload and delete parameters', () => {
  let projRoot: string;
  let deletionRequired = false;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('upload-delete-parameters-test');
  });

  afterEach(async () => {
    // In case test failed after init, but before delete
    if (deletionRequired) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it('adding function should upload to service, removing environment and deleting project should delete parameters', async () => {
    const firstEnvName = 'enva';
    const secondEnvName = 'envb';
    const envVariableName = 'envVariableName';
    const envVariableValue = 'envVariableValue';
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false, envName: firstEnvName });
    deletionRequired = true;
    const meta = getProjectMeta(projRoot);
    expect(meta).toBeDefined();
    const appId = getAppId(projRoot);
    expect(appId).toBeDefined();
    const region = meta.providers.awscloudformation.Region;
    expect(region).toBeDefined();

    const fnName = `parameterstestfn${generateRandomShortId()}`;
    const fnName2 = `parameterstestfn${generateRandomShortId()}`;

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
    const deploymentBucketAndKey = [{ name: 'deploymentBucketName' }, { name: 's3Key' }];
    const expectedParamsAfterAddFunc = [...deploymentBucketAndKey, { name: envVariableName, value: envVariableValue }];
    await expectParametersOptionalValue(expectedParamsAfterAddFunc, [], region, appId, firstEnvName, 'function', fnName);

    await addEnvironmentCarryOverEnvVars(projRoot, { envName: secondEnvName });
    await addFunction(projRoot, { name: fnName2, functionTemplate: 'Hello World' }, 'nodejs');
    await amplifyPushAuth(projRoot);
    const expectedParamsAfterAddEnv = [...deploymentBucketAndKey, { name: envVariableName, value: envVariableValue }];
    await expectParametersOptionalValue(expectedParamsAfterAddFunc, [], region, appId, firstEnvName, 'function', fnName);
    await expectParametersOptionalValue(expectedParamsAfterAddEnv, [], region, appId, secondEnvName, 'function', fnName);
    await expectParametersOptionalValue(deploymentBucketAndKey, [], region, appId, secondEnvName, 'function', fnName2);

    await removeFunction(projRoot, fnName2);
    await amplifyPushAuth(projRoot);

    await expectParametersOptionalValue(
      [],
      deploymentBucketAndKey.map((pair) => pair.name),
      region,
      appId,
      secondEnvName,
      'function',
      fnName2,
    );

    await checkoutEnvironment(projRoot, { envName: firstEnvName });
    await removeEnvironment(projRoot, { envName: secondEnvName });
    await amplifyPushAuth(projRoot);
    await expectParametersOptionalValue(expectedParamsAfterAddFunc, [], region, appId, firstEnvName, 'function', fnName);
    await expectParametersOptionalValue(
      [],
      expectedParamsAfterAddEnv.map((pair) => pair.name),
      region,
      appId,
      secondEnvName,
      'function',
      fnName,
    );

    await deleteProject(projRoot);
    deletionRequired = false;
    await expectParametersOptionalValue(
      [],
      expectedParamsAfterAddFunc.map((pair) => pair.name),
      region,
      appId,
      firstEnvName,
      'function',
      fnName,
    );
    await expectParametersOptionalValue(
      [],
      expectedParamsAfterAddEnv.map((pair) => pair.name),
      region,
      appId,
      secondEnvName,
      'function',
      fnName,
    );
  });
});
