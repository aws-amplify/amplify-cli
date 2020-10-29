import { initJSProjectWithProfile, deleteProject, createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';
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

  it('auth owner5', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'owner5');
    expect(testresult).toBeTruthy();
  });
  it('auth owner6', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'owner6');
    expect(testresult).toBeTruthy();
  });

  it('auth owner7', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'owner7');
    expect(testresult).toBeTruthy();
  });
  it('auth ownerMultiAuthRules', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'ownerMultiAuthRules');
    expect(testresult).toBeTruthy();
  });
});
