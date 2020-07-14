import { initJSProjectWithProfile, deleteProject, createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';
import { testSchema } from '../schema-api-directives';

describe('api directives @auth batch 8', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createNewProjectDir('auth8');
    await initJSProjectWithProfile(projectDir, {});
  });

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  it('auth fieldLevelAuth7', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'fieldLevelAuth7');
    expect(testresult).toBeTruthy();
  });

  it('auth fieldLevelAuth8', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'fieldLevelAuth8');
    expect(testresult).toBeTruthy();
  });

  it('auth generatesOwner', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'generatesOwner');
    expect(testresult).toBeTruthy();
  });

  it('auth generatesStaticGroup', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'generatesStaticGroup');
    expect(testresult).toBeTruthy();
  });

  it('auth generatesDynamicGroup', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'generatesDynamicGroup');
    expect(testresult).toBeTruthy();
  });
});
