import { initJSProjectWithProfile, deleteProject, createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';
import { testSchema } from '../api-directives';

describe('api directives @key', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createNewProjectDir('key');
    await initJSProjectWithProfile(projectDir, {});
  });

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  it('key howTo1', async () => {
    const testresult = await testSchema(projectDir, 'key', 'howTo1');
    expect(testresult).toBeTruthy();
  });

  it('key howTo2', async () => {
    const testresult = await testSchema(projectDir, 'key', 'howTo2');
    expect(testresult).toBeTruthy();
  });

  it('key howTo3', async () => {
    const testresult = await testSchema(projectDir, 'key', 'howTo3');
    expect(testresult).toBeTruthy();
  });
});
