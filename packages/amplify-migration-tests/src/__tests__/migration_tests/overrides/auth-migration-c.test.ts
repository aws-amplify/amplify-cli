/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable jest/no-standalone-expect */

import { $TSAny } from '@aws-amplify/amplify-cli-core';
import {
  addAuthWithRecaptchaTrigger,
  amplifyPushAuth,
  amplifyPushAuthV5V6,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAwsAndroidConfig,
  getProjectMeta,
  updateAuthRemoveRecaptchaTrigger,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { versionCheck, allowedVersionsToMigrateFrom, initAndroidProjectWithProfileInquirer } from '../../../migration-helpers';

const defaultSettings = {
  name: 'authMigration',
};
describe('amplify auth migration c', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth_migration');
    const migrateFromVersion = { v: 'unintialized' };
    const migrateToVersion = { v: 'unintialized' };
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (fs.existsSync(metaFilePath)) {
      await deleteProject(projRoot, undefined, true);
    }
    deleteProjectDir(projRoot);
  });

  it('...should init an android project and add customAuth flag, and remove flag when custom auth triggers are removed upon update', async () => {
    await initAndroidProjectWithProfileInquirer(projRoot, defaultSettings);
    await addAuthWithRecaptchaTrigger(projRoot);
    await amplifyPushAuthV5V6(projRoot);
    let meta = getAwsAndroidConfig(projRoot);
    expect(meta.Auth.Default.authenticationFlowType).toBeDefined();
    expect(meta.Auth.Default.authenticationFlowType).toEqual('CUSTOM_AUTH');
    const amplifyMeta = getProjectMeta(projRoot);
    const authResourceName = Object.keys(amplifyMeta.auth).filter(
      (resourceName) => amplifyMeta.auth[resourceName].service === 'Cognito',
    )[0];
    // update and push with codebase
    const overridesObj: $TSAny = {
      resourceName: authResourceName,
      category: 'auth',
      service: 'cognito',
    };

    await updateAuthRemoveRecaptchaTrigger(projRoot, { testingWithLatestCodebase: true, overrides: overridesObj });
    await amplifyPushAuth(projRoot, true);
    meta = getAwsAndroidConfig(projRoot);
    expect(meta.Auth.Default.authenticationFlowType).toBeDefined();
    expect(meta.Auth.Default.authenticationFlowType).toEqual('USER_SRP_AUTH');
  });
});
