/**
 * Tests for headless init/pull workflows on git-cloned projects
 * These tests exercise workflows that hosting executes during backend builds
 */

import {
  addAuthUserPoolOnly,
  amplifyPushAuthV5V6,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAmplifyInitConfig,
  getProjectConfig,
  getProjectMeta,
  getSocialProviders,
  gitCleanFdx,
  gitCommitAll,
  gitInit,
  nonInteractiveInitWithForcePushAttach,
} from '@aws-amplify/amplify-e2e-core';
import { initJSProjectWithProfileV10 } from '../../migration-helpers-v10/init';

describe('attach amplify to git-cloned project', () => {
  const envName = 'test';
  let projRoot: string;
  beforeAll(async () => {
    projRoot = await createNewProjectDir('clone-test');
    await initJSProjectWithProfileV10(projRoot, { envName, disableAmplifyAppCreation: false });
    await addAuthUserPoolOnly(projRoot);
    await amplifyPushAuthV5V6(projRoot);
    await gitInit(projRoot);
    await gitCommitAll(projRoot);
  });

  beforeAll(async () => {
    await deleteProject(projRoot, undefined, true);
    deleteProjectDir(projRoot);
  });

  test('headless init and forcePush when triggers are added', async () => {
    // checks amplify hosting forcePush on existing projects with v10.5.1
    const { projectName } = getProjectConfig(projRoot);
    assertLambdaexecutionRoleArns(projRoot, false);
    await gitCleanFdx(projRoot);
    const socialProviders = getSocialProviders();
    const categoriesConfig = {
      auth: {
        facebookAppIdUserPool: socialProviders.FACEBOOK_APP_ID,
        facebookAppSecretUserPool: socialProviders.FACEBOOK_APP_SECRET,
        googleAppIdUserPool: socialProviders.GOOGLE_APP_ID,
        googleAppSecretUserPool: socialProviders.GOOGLE_APP_SECRET,
        // eslint-disable-next-line spellcheck/spell-checker
        loginwithamazonAppIdUserPool: socialProviders.AMAZON_APP_ID,
        // eslint-disable-next-line spellcheck/spell-checker
        loginwithamazonAppSecretUserPool: socialProviders.AMAZON_APP_SECRET,
      },
    };
    await nonInteractiveInitWithForcePushAttach(projRoot, getAmplifyInitConfig(projectName, envName), categoriesConfig, true);
    assertLambdaexecutionRoleArns(projRoot, true);
  });
});

const assertLambdaexecutionRoleArns = (projRoot: string, isDefined: boolean) => {
  const meta = getProjectMeta(projRoot);
  const authKey = Object.keys(meta.auth).find((key) => meta.auth[key].service === 'Cognito');
  const createFunctionResourceName = `${authKey}CreateAuthChallenge`;
  const defineFunctionResourceName = `${authKey}DefineAuthChallenge`;
  const customMessageFunctionResourceName = `${authKey}CustomMessage`;
  const createFunctionMeta = meta.function[createFunctionResourceName];
  const defineFunctionMeta = meta.function[defineFunctionResourceName];
  const customMessageFunctionMeta = meta.function[customMessageFunctionResourceName];
  const createFunctionRoleArn = createFunctionMeta.output.LambdaExecutionRoleArn;
  const defineFunctionRoleArn = defineFunctionMeta.output.LambdaExecutionRoleArn;
  const customMessageFunctionRoleArn = customMessageFunctionMeta.output.LambdaExecutionRoleArn;
  if (isDefined) {
    expect(createFunctionRoleArn).toBeDefined();
    expect(defineFunctionRoleArn).toBeDefined();
    expect(customMessageFunctionRoleArn).toBeDefined();
  } else {
    expect(createFunctionRoleArn).not.toBeDefined();
    expect(defineFunctionRoleArn).not.toBeDefined();
    expect(customMessageFunctionRoleArn).not.toBeDefined();
  }
};
