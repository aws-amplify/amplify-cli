import {
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  generateRandomShortId,
  addFunction,
  updateFunction,
  amplifyPushExpectError,
} from '@aws-amplify/amplify-e2e-core';
import { addEnvironmentCarryOverEnvVars, checkoutEnvironment } from '../environment/env';

describe('mismatched-parameters-fast-fail', () => {
  const firstEnvName = 'dev';
  const secondEnvName = 'prod';
  const envVarKey = 'myvar';
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('push-test');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  jest.retryTimes(0);
  it('fast fail when mismatched parameters', async () => {
    await initJSProjectWithProfile(projRoot, { envName: firstEnvName, disableAmplifyAppCreation: false });
    const functionName = `testfunction${generateRandomShortId()}`;
    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        name: functionName,
        environmentVariables: {
          key: envVarKey,
          value: 'myval',
        },
      },
      'nodejs',
    );
    await addEnvironmentCarryOverEnvVars(projRoot, { envName: secondEnvName });
    await updateFunction(projRoot, { environmentVariables: { key: envVarKey, value: '', operation: 'remove' } }, 'nodejs');
    await amplifyPushAuth(projRoot);
    await checkoutEnvironment(projRoot, { envName: firstEnvName });
    await amplifyPushExpectError(projRoot, 'Your environments have inconsistent parameters');
  });
});
