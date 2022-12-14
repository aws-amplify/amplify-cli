import {
  addAuthWithMaxOptions,
    amplifyPushAuth,
    createNewProjectDir,
    deleteProject,
    deleteProjectDir,
  } from '@aws-amplify/amplify-e2e-core';
  import { versionCheck, allowedVersionsToMigrateFrom } from '../../migration-helpers';
  import { initJSProjectWithProfileV10 } from '../../migration-helpers-v10/init';
  
  describe('amplify migration test scaffold v10', () => {
    let projRoot: string;
  
    beforeAll(async () => {
      const migrateFromVersion = { v: 'unintialized' };
      const migrateToVersion = { v: 'unintialized' };
      await versionCheck(process.cwd(), false, migrateFromVersion);
      await versionCheck(process.cwd(), true, migrateToVersion);
      console.log(`Test migration from: ${migrateFromVersion} to ${migrateToVersion}`);
      expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
      expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
    });
  
    beforeEach(async () => {
      projRoot = await createNewProjectDir('scaffoldTest');
    });
  
    afterEach(async () => {
      await deleteProject(projRoot, null, true);
      deleteProjectDir(projRoot);
    });
  
    it('...should add auth with max options and work fine on latest version', async () => {
      await initJSProjectWithProfileV10(projRoot, { name: 'authTest' });
      // add all
      await addAuthWithMaxOptions(projRoot, {});
      await amplifyPushAuth(projRoot);

      // remove some?

      // add again with v11 + push?
    });
  });
  