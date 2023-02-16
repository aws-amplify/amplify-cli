/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import { initJSProjectWithProfile, deleteProject, createNewProjectDir, deleteProjectDir } from '@aws-amplify/amplify-e2e-core';
import { testSchema } from '../schema-api-directives';

describe('api directives @auth batch 5b', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createNewProjectDir('auth5b');
    await initJSProjectWithProfile(projectDir, {});
  });

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  it('auth customClaims', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'customClaims');
    expect(testresult).toBeTruthy();
  });
});
