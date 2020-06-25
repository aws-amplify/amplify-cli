import { initJSProjectWithProfile, deleteProject, createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';
import { testSchema } from '../api-directives';

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

  it('auth ownerMultiAuthRules', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'ownerMultiAuthRules');
    expect(testresult).toBeTruthy();
  });
  it('auth staticGroup1', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'staticGroup1');
    expect(testresult).toBeTruthy();
  });

  it('auth staticGroup2', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'staticGroup2');
    expect(testresult).toBeTruthy();
  });

  it('auth dynamicGroup1', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'dynamicGroup1');
    expect(testresult).toBeTruthy();
  });

  it('auth dynamicGroup2', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'dynamicGroup2');
    expect(testresult).toBeTruthy();
  });

  it('auth dynamicGroup3', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'dynamicGroup3');
    expect(testresult).toBeTruthy();
  });
});
