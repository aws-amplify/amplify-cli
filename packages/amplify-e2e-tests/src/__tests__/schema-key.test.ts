import { initJSProjectWithProfile, deleteProject, createNewProjectDir, deleteProjectDir, createRandomName } from 'amplify-e2e-core';
import { testSchema } from '../schema-api-directives';

describe('api directives @key', () => {
  let projectDir: string;
  let appName: string;

  beforeEach(async () => {
    appName = createRandomName();
    projectDir = await createNewProjectDir('key');
    await initJSProjectWithProfile(projectDir, { name: appName });
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

  it('key SelectiveSync with key directive', async () => {
    const testresult = await testSchema(projectDir, 'key', 'howTo4', appName);
    expect(testresult).toBeTruthy();
  });
});
