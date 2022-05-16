import { $TSAny } from 'amplify-cli-core';
import {
  addAuthWithDefault,
  addAuthWithMaxOptions,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir, getProjectMeta, updateAuthSignInSignOutUrl,
} from 'amplify-e2e-core';
import * as fs from 'fs-extra';
import { join } from 'path';
import { allowedVersionsToMigrateFrom, initJSProjectWithProfile, versionCheck } from '../../migration-helpers';

describe('amplify auth migration', () => {
  let projectRoot: string;

  beforeAll(async () => {
    const migrateFromVersion = { v: 'unInitialized' };
    const migrateToVersion = { v: 'unInitialized' };
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
  });

  beforeEach(async () => {
    projectRoot = await createNewProjectDir('auth migration');
    await initJSProjectWithProfile(projectRoot, { name: 'authMigration', disableAmplifyAppCreation: false });
  });
  afterEach(async () => {
    const metaFilePath = join(projectRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (fs.existsSync(metaFilePath)) {
      await deleteProject(projectRoot, null, true);
    }
    deleteProjectDir(projectRoot);
  });

  it('...should init a project and add auth with max options, and then update with latest and push', async () => {
    await addAuthWithMaxOptions(projectRoot, {});
    await amplifyPushAuth(projectRoot);
    const meta = getProjectMeta(projectRoot);
    const authResourceName = Object.keys(meta.auth).filter(resourceName => meta.auth[resourceName].service === 'Cognito')[0];
    const overridesObj: $TSAny = {
      resourceName: authResourceName,
      category: 'auth',
      service: 'cognito',
    };
    // eslint-disable-next-line spellcheck/spell-checker
    await updateAuthSignInSignOutUrl(projectRoot, { testingWithLatestCodebase: true, overrides: overridesObj });
    await expect(await amplifyPushAuth(projectRoot, true)).resolves.not.toThrowError();
  });
});
