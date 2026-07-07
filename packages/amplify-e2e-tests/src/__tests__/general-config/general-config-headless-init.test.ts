/**
 * Tests for headless init/pull workflows on git-cloned projects
 * These tests exercise workflows that hosting executes during backend builds
 */

import {
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAmplifyInitConfig,
  getAwsProviderConfig,
  nonInteractiveInitAttach,
} from '@aws-amplify/amplify-e2e-core';
import {} from '@aws-amplify/amplify-e2e-core';

describe('attach amplify to git-cloned project', () => {
  const envName = 'test';
  const projectName = 'initGeneral';
  let projRoot: string;
  beforeAll(async () => {
    projRoot = await createNewProjectDir('clone-test');
  });

  afterAll(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  test('headless init works with general profile', async () => {
    // execute headless init
    await nonInteractiveInitAttach(projRoot, getAmplifyInitConfig(projectName, envName), getAwsProviderConfig('general'));
  });
});
