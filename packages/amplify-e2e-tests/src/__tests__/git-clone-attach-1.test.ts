/**
/**
 * Tests for headless init/pull workflows on git-cloned projects
 * These tests exercise workflows that hosting executes during backend builds
 */

import {
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAmplifyInitConfig, getAwsProviderConfig, nonInteractiveInitAttach
} from '@aws-amplify/amplify-e2e-core';

describe('attach amplify to git-cloned project', () => {
  const envName = 'test';
  let projRoot: string;
  beforeAll(async () => {
    projRoot = await createNewProjectDir('clone-test');
  });

  afterAll(async () => {
    // await deleteProject(projRoot);
    // deleteProjectDir(projRoot);
  });

  test('headless init works with general profile', async () => {
    // execute headless init
    const projectName = 'initGeneral';
    const awsProviderConfig =  getAwsProviderConfig('general');
    process.env.AWS_SDK_LOAD_CONFIG = 'false';
    await nonInteractiveInitAttach(projRoot, getAmplifyInitConfig(projectName, envName),awsProviderConfig);
  });
});
