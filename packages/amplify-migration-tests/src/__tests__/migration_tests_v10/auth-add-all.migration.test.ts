import {
    addAuthWithMaxOptions,
    amplifyPull,
    amplifyPushAuthV10,
    createNewProjectDir,
    deleteProject,
    deleteProjectDir,
    getAppId,
  } from '@aws-amplify/amplify-e2e-core';
import { versionCheck, allowedVersionsToMigrateFrom } from '../../migration-helpers';
import { cfnDiffExclusions } from '../../migration-helpers-v10/cfn-diff-exclusions';
import { initJSProjectWithProfileV10 } from '../../migration-helpers-v10/init';
import { assertNoParameterChangesBetweenProjects, collectCloudformationDiffBetweenProjects } from '../../migration-helpers/utils';

describe('amplify migration test auth', () => {
    let projRoot1: string;

    beforeAll(async () => {
      const migrateFromVersion = { v: 'unintialized' };
      const migrateToVersion = { v: 'unintialized' };
      await versionCheck(process.cwd(), false, migrateFromVersion);
      await versionCheck(process.cwd(), true, migrateToVersion);
      console.log(`Test migration from: ${migrateFromVersion.v} to ${migrateToVersion.v}`);
      expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
      expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
    });

    beforeEach(async () => {
      projRoot1 = await createNewProjectDir('authMigration1');
    });

    afterEach(async () => {
      // note - this deletes the original project using the latest codebase
      await deleteProject(projRoot1, null, true);
      deleteProjectDir(projRoot1);
    });

    it('...should add auth with max options and work on the latest version', async () => {
      await initJSProjectWithProfileV10(projRoot1, { name: 'authTest', disableAmplifyAppCreation: false });

      await addAuthWithMaxOptions(projRoot1, {});
      await amplifyPushAuthV10(projRoot1);

      const appId = getAppId(projRoot1);
      expect(appId).toBeDefined();
      const projRoot2 = await createNewProjectDir('authMigration2');

      try {
        await amplifyPull(projRoot2, { emptyDir: true, appId }, true);
        assertNoParameterChangesBetweenProjects(projRoot1, projRoot2);
        expect(collectCloudformationDiffBetweenProjects(projRoot1, projRoot2, cfnDiffExclusions)).toMatchSnapshot();

        // The following checks can be re-enabled once we find a way to configure the social logic provider values
        // on a newly pulled down project. Currently, those parameters don't get pulled down.

        // await amplifyPushWithoutCodegen(projRoot2, true);
        // assertNoParameterChangesBetweenProjects(projRoot1, projRoot2);
        // expect(collectCloudformationDiffBetweenProjects(projRoot1, projRoot2, cfnDiffExclusions)).toMatchSnapshot();

        // // should be able to remove & add auth after pulling down an older project
        // await removeAuthWithDefault(projRoot2, true);
        // await addAuthWithDefault(projRoot2, {}, true);
        // await amplifyPushAuth(projRoot2, true);
      } finally {
        deleteProjectDir(projRoot2);
      }
    });
});
