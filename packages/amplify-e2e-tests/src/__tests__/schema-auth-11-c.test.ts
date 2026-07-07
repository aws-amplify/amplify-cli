/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import { initJSProjectWithProfile, deleteProject, createNewProjectDir, deleteProjectDir } from '@aws-amplify/amplify-e2e-core';
import { testSchema } from '../schema-api-directives';

describe('api directives @auth batch 3c', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createNewProjectDir('auth11c');
    await initJSProjectWithProfile(projectDir, {});
  });

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  it('auth dynamicGroup3', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'dynamicGroup3');
    expect(testresult).toBeTruthy();
  });
});
