import {
  initJSProjectWithProfile,
  initAndroidProjectWithProfile,
  deleteProject,
  createNewProjectDir,
  deleteProjectDir,
  addFeatureFlag,
} from 'amplify-e2e-core';
import { testSchema } from '../schema-api-directives';

describe('api directives @auth batch 14', () => {
  let projectDir: string;

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  describe('javascript libraries', () => {
    beforeEach(async () => {
      projectDir = await createNewProjectDir('auth1');
      await initJSProjectWithProfile(projectDir, {});
      addFeatureFlag(projectDir, 'graphqlTransformer', 'useSubUsernameForDefaultIdentityClaim', true);
    });

    it('auth customClaims2', async () => {
      const testResult = await testSchema(projectDir, 'auth', 'customClaims2');
      expect(testResult).toBeTruthy();
    });

    it('auth owner8', async () => {
      const testResult = await testSchema(projectDir, 'auth', 'owner8');
      expect(testResult).toBeTruthy();
    });
  });

  describe('android libraries', () => {
    beforeEach(async () => {
      projectDir = await createNewProjectDir('auth2');
      await initAndroidProjectWithProfile(projectDir, {});
      addFeatureFlag(projectDir, 'graphqlTransformer', 'useSubUsernameForDefaultIdentityClaim', true);
    });

    it('auth owner9', async () => {
      const testResult = await testSchema(projectDir, 'auth', 'owner9');
      expect(testResult).toBeTruthy();
    });
  });
});
