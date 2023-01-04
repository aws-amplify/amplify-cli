import {
  initJSProjectWithProfile, deleteProject, createNewProjectDir, deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';
import { testSchema } from '../schema-api-directives';

describe('api directives @searchable', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createNewProjectDir('searchable');
    await initJSProjectWithProfile(projectDir, {});
  });

  afterEach(async () => {
    if (process.env.CIRCLECI) {
      console.log('Skipping cloud deletion since we are in CI, and cleanup script will delete this stack in cleanup step.');
      deleteProjectDir(projectDir);
    } else {
      await deleteProject(projectDir);
      deleteProjectDir(projectDir);
    }
  });

  it('searchable usage', async () => {
    const testresult = await testSchema(projectDir, 'searchable', 'usage');
    expect(testresult).toBeTruthy();
  });
});
