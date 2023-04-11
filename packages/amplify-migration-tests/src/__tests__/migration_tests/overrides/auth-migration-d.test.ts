/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable jest/no-standalone-expect */

import { $TSAny } from '@aws-amplify/amplify-cli-core';
import {
  addAuthWithSignInSignOutUrl,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getBackendAmplifyMeta,
  updateAuthSignInSignOutUrl,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { versionCheck, allowedVersionsToMigrateFrom, initAndroidProjectWithProfileInquirer } from '../../../migration-helpers';

const defaultSettings = {
  name: 'authMigration',
};
describe('amplify auth migration d', () => {
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

  it('...should edit signin url on update', async () => {
    const settings = {
      signinUrl: 'http://localhost:3001/',
      signoutUrl: 'http://localhost:3002/',
      updatesigninUrl: 'http://localhost:3003/',
      updatesignoutUrl: 'http://localhost:3004/',
    };
    await initAndroidProjectWithProfileInquirer(projRoot, defaultSettings);
    await addAuthWithSignInSignOutUrl(projRoot, settings);
    const amplifyMeta = getBackendAmplifyMeta(projRoot);
    const authResourceName = Object.keys(amplifyMeta.auth).filter(
      (resourceName) => amplifyMeta.auth[resourceName].service === 'Cognito',
    )[0];
    // update and push with codebase
    const overridesObj: $TSAny = {
      resourceName: authResourceName,
      category: 'auth',
      service: 'cognito',
    };
    await updateAuthSignInSignOutUrl(projRoot, { ...settings, testingWithLatestCodebase: true, overrides: overridesObj });
  });
});
