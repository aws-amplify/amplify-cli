import {
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';
import { versionCheck, allowedVersionsToMigrateFrom } from '../../migration-helpers';
import { initJSProjectWithProfileV10 } from '../../migration-helpers-v10/init';

describe('amplify migration test scaffold v10', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('scaffoldTest');
    const migrateFromVersion = { v: 'unintialized' };
    const migrateToVersion = { v: 'unintialized' };
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
    console.log(`Test migration from: ${migrateFromVersion} to ${migrateToVersion}`);
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v); // uncomment this once we are in v11 for local codebase
    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
  });

  afterEach(async () => {
    await deleteProject(projRoot, null, true);
    deleteProjectDir(projRoot);
  });

  it('...should init a project', async () => {
    await initJSProjectWithProfileV10(projRoot, { name: 'scaffoldTest' });
  });
});
