import { initJSProjectWithProfile, deleteProject, createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';
import { testSchema } from '../schema-api-directives';

describe('api directives @model', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createNewProjectDir('model');
    await initJSProjectWithProfile(projectDir, {});
  });

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  it('model usage1', async () => {
    const testresult = await testSchema(projectDir, 'model', 'usage1');
    expect(testresult).toBeTruthy();
  });

  it('model usage2', async () => {
    const testresult = await testSchema(projectDir, 'model', 'usage2');
    expect(testresult).toBeTruthy();
  });

  it('model usage3', async () => {
    const testresult = await testSchema(projectDir, 'model', 'usage3');
    expect(testresult).toBeTruthy();
  });

  it('model usage4', async () => {
    const testresult = await testSchema(projectDir, 'model', 'usage4');
    expect(testresult).toBeTruthy();
  });

  it('model generates', async () => {
    const testresult = await testSchema(projectDir, 'model', 'generates');
    expect(testresult).toBeTruthy();
  });
});
