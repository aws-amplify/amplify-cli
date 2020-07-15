import { initJSProjectWithProfile, deleteProject, createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';
import { testSchema } from '../schema-api-directives';

describe('api directives @versioned', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createNewProjectDir('versioned');
    await initJSProjectWithProfile(projectDir, {});
  });

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  it('versioned usage', async () => {
    const testresult = await testSchema(projectDir, 'versioned', 'usage');
    expect(testresult).toBeTruthy();
  });
});
