import { initJSProjectWithProfile, deleteProject, createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';
import { testSchema } from '../api-directives';

describe('api directives @auth batch 3', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createNewProjectDir('auth3');
    await initJSProjectWithProfile(projectDir, {});
  });

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  it('auth public1', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'public1');
    expect(testresult).toBeTruthy();
  });

  it('auth public2', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'public2');
    expect(testresult).toBeTruthy();
  });

  it('auth private1', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'private1');
    expect(testresult).toBeTruthy();
  });

  it('auth private2', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'private2');
    expect(testresult).toBeTruthy();
  });

  it('auth usingOidc', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'usingOidc');
    expect(testresult).toBeTruthy();
  });

  it('auth customClaims', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'customClaims');
    expect(testresult).toBeTruthy();
  });
});
