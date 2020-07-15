import { initJSProjectWithProfile, deleteProject, createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';
import { testSchema } from '../schema-api-directives';

describe('api directives @auth batch 6', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createNewProjectDir('auth6');
    await initJSProjectWithProfile(projectDir, {});
  });

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  it('auth combiningAuthRules3', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'combiningAuthRules3');
    expect(testresult).toBeTruthy();
  });

  it('auth subscriptions1', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'subscriptions1');
    expect(testresult).toBeTruthy();
  });

  it('auth subscriptions2', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'subscriptions2');
    expect(testresult).toBeTruthy();
  });

  it('auth subscriptions3', async () => {
    const testresult = await testSchema(projectDir, 'auth', 'subscriptions3');
    expect(testresult).toBeTruthy();
  });
});
