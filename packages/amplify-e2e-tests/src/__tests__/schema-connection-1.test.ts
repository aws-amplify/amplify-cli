import { initJSProjectWithProfile, deleteProject, createNewProjectDir, deleteProjectDir } from '@aws-amplify/amplify-e2e-core';
import { testSchema } from '../schema-api-directives';

describe('api directives @connection', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createNewProjectDir('connection');
    await initJSProjectWithProfile(projectDir, {});
  });

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  it('connection belongsTo', async () => {
    const testresult = await testSchema(projectDir, 'connection', 'belongsTo');
    expect(testresult).toBeTruthy();
  });

  it('connection hasMany', async () => {
    const testresult = await testSchema(projectDir, 'connection', 'hasMany');
    expect(testresult).toBeTruthy();
  });

  it('connection hasOne1', async () => {
    const testresult = await testSchema(projectDir, 'connection', 'hasOne1');
    expect(testresult).toBeTruthy();
  });
});
