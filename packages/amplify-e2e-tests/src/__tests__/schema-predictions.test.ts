import { initJSProjectWithProfile, deleteProject, createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';
import { testSchema } from '../schema-api-directives';

describe('api directives @predictions', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createNewProjectDir('predictions');
    await initJSProjectWithProfile(projectDir, {});
  });

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  it('predictions usage', async () => {
    const testresult = await testSchema(projectDir, 'predictions', 'usage');
    expect(testresult).toBeTruthy();
  });
});
