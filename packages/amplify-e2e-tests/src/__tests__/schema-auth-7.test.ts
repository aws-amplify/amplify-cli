import { initJSProjectWithProfile, deleteProject, createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';
import { testSchema } from '../schema-api-directives';

describe('api directives @auth batch 7', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createNewProjectDir('auth7');
    await initJSProjectWithProfile(projectDir, {});
  });

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  it('auth fieldLevelAuth1', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'fieldLevelAuth1');
    expect(testresult).toBeTruthy();
  });

  it('auth fieldLevelAuth2', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'fieldLevelAuth2');
    expect(testresult).toBeTruthy();
  });

  it('auth fieldLevelAuth3', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'fieldLevelAuth3');
    expect(testresult).toBeTruthy();
  });
});
