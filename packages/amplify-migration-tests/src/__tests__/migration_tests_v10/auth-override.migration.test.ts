import {
    addAuthWithDefault,
    amplifyOverrideAuth,
    amplifyPull,
    amplifyPushOverride,
    amplifyPushWithoutCodegen,
    createNewProjectDir,
    deleteProject,
    deleteProjectDir,
    getAppId,
    getProjectMeta,
    getUserPool,
  } from '@aws-amplify/amplify-e2e-core';
  import { versionCheck, allowedVersionsToMigrateFrom } from '../../migration-helpers';
  import { initJSProjectWithProfileV10 } from '../../migration-helpers-v10/init';
import { assertNoParameterChangesBetweenProjects, collectCloudformationDiffBetweenProjects } from '../../migration-helpers/utils';
import * as path from 'path';
import * as fs from 'fs-extra';
  
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
  
    it('...should add auth with overrides and work fine on latest version', async () => {
      await initJSProjectWithProfileV10(projRoot1, { name: 'authTest', disableAmplifyAppCreation: false });
      
      await addAuthWithDefault(projRoot1, {});
      await amplifyPushWithoutCodegen(projRoot1);

      const meta = getProjectMeta(projRoot1);
      const authResourceName = Object.keys(meta.auth).filter(key => meta.auth[key].service === 'Cognito');
      const userPoolId = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;

      // override new env
      await amplifyOverrideAuth(projRoot1);
      // this is where we will write our override logic to
      const destOverrideFilePath = path.join(projRoot1, 'amplify', 'backend', 'auth', `${authResourceName}`, 'override.ts');
      const srcOverrideFilePath = path.join(__dirname, '..', '..', '..', 'overrides', 'override-auth.ts');
      fs.copyFileSync(srcOverrideFilePath, destOverrideFilePath);
      await amplifyPushOverride(projRoot1);

      const appId = getAppId(projRoot1);
      expect(appId).toBeDefined();
      const projRoot2 = await createNewProjectDir('authMigration2');
      try {
        await amplifyPull(projRoot2, { emptyDir: true, appId }, true);
        assertNoParameterChangesBetweenProjects(projRoot1, projRoot2);
        expect(collectCloudformationDiffBetweenProjects(projRoot1, projRoot2)).toMatchSnapshot();
        await amplifyPushWithoutCodegen(projRoot2, true);
        assertNoParameterChangesBetweenProjects(projRoot1, projRoot2);
        expect(collectCloudformationDiffBetweenProjects(projRoot1, projRoot2)).toMatchSnapshot();

        // check overwritten config
        const overwrittenUserPool = await getUserPool(userPoolId, meta.providers.awscloudformation.Region);
        expect(overwrittenUserPool.UserPool).toBeDefined();
        expect(overwrittenUserPool.UserPool.DeviceConfiguration.ChallengeRequiredOnNewDevice).toBe(true);
      } finally {
        deleteProjectDir(projRoot2);
      }
    });
  });
  