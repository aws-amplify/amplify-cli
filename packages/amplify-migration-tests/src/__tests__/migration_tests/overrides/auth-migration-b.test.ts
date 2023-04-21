/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable jest/no-standalone-expect */

import { $TSAny } from '@aws-amplify/amplify-cli-core';
import {
  addAuthWithDefault,
  amplifyPushAuth,
  amplifyPushAuthV5V6,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  updateAuthWithoutTrigger,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { versionCheck, allowedVersionsToMigrateFrom, initJSProjectWithProfileV4_52_0 } from '../../../migration-helpers';

const defaultSettings = {
  name: 'authMigration',
};
describe('amplify auth migration b', () => {
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

  it('...should init a project and add auth with default, and then update with latest and push', async () => {
    // init, add and push auth with installed cli
    await initJSProjectWithProfileV4_52_0(projRoot, defaultSettings);
    await addAuthWithDefault(projRoot);
    await amplifyPushAuthV5V6(projRoot);
    const meta = getProjectMeta(projRoot);
    const authResourceName = Object.keys(meta.auth).filter((resourceName) => meta.auth[resourceName].service === 'Cognito')[0];
    // update and push with codebase
    const overridesObj: $TSAny = {
      resourceName: authResourceName,
      category: 'auth',
      service: 'cognito',
    };
    await updateAuthWithoutTrigger(projRoot, { testingWithLatestCodebase: true, overrides: overridesObj });
    await amplifyPushAuth(projRoot, true);
  });
});
