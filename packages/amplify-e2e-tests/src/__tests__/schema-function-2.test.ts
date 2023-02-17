import { initJSProjectWithProfile, deleteProject, createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';
import { testSchema } from '../schema-api-directives';

describe('api directives @function', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createNewProjectDir('function');
    await initJSProjectWithProfile(projectDir, {});
  });

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  it('function differentRegion', async () => {
    const testresult = await testSchema(projectDir, 'function', 'differentRegion');
    expect(testresult).toBeTruthy();
  });

  it('function chaining', async () => {
    const testresult = await testSchema(projectDir, 'function', 'chaining');
    expect(testresult).toBeTruthy();
  });
});
