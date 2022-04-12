import {
  initIosProjectWithProfile,
  initFlutterProjectWithProfile,
  deleteProject,
  createNewProjectDir,
  deleteProjectDir,
} from 'amplify-e2e-core';
import { testSchema } from '../schema-api-directives';

describe('api directives @auth batch 15', () => {
  let projectDir: string;

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  describe('ios libraries', () => {
    beforeEach(async () => {
      projectDir = await createNewProjectDir('auth1');
      await initIosProjectWithProfile(projectDir, {});
    });

    it('auth owner10', async () => {
      const testResult = await testSchema(projectDir, 'auth', 'owner10');
      expect(testResult).toBeTruthy();
    });
  });

  describe('flutter libraries', () => {
    beforeEach(async () => {
      projectDir = await createNewProjectDir('auth2');
      await initFlutterProjectWithProfile(projectDir, {});
    });

    it('auth owner11', async () => {
      const testResult = await testSchema(projectDir, 'auth', 'owner11');
      expect(testResult).toBeTruthy();
    });
  });
});
