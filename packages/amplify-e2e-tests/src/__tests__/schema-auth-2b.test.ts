import {
  initJSProjectWithProfile, deleteProject, createNewProjectDir, deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';
import { testSchema } from '../schema-api-directives';

describe('api directives @auth batch 2', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createNewProjectDir('auth2');
    await initJSProjectWithProfile(projectDir, {});
  });

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  it('auth owner6', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'owner6');
    expect(testresult).toBeTruthy();
  });
});
