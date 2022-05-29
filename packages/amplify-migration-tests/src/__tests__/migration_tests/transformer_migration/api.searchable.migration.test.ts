import {
  addApiWithoutSchema,
  amplifyPush,
  amplifyPushUpdate,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  updateApiSchema,
  getProjectConfig,
} from 'amplify-e2e-core';
import { initJSProjectWithProfile, versionCheck, addApiWithoutSchemaOldDx, allowedVersionsToMigrateFrom } from '../../../migration-helpers';

describe('amplify searchable migration', () => {
  let projRoot: string;

  beforeAll(async () => {
    const migrateFromVersion = { v: 'unintialized' };
    const migrateToVersion = { v: 'unintialized' };
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
  });

  beforeEach(async () => {
    projRoot = await createNewProjectDir('api-searchable-cli-migration');
    await initJSProjectWithProfile(projRoot, { name: 'gqlsearchmigration' });
  });

  afterEach(async () => {
    await deleteProject(projRoot, null, true);
    deleteProjectDir(projRoot);
  });

  it('init project, add searchable and migrate with updated searchable', async () => {
    const initialSchema = 'migrations_searchable/initial_searchable.graphql';
    const nextSchema = 'migrations_searchable/updated_searchable.graphql';
    const { projectName } = getProjectConfig(projRoot);
    // add api and push with installed cli
    await addApiWithoutSchemaOldDx(projRoot);
    updateApiSchema(projRoot, projectName, initialSchema);
    await amplifyPush(projRoot);
    // update and push with codebase cli
    updateApiSchema(projRoot, projectName, nextSchema);
    await amplifyPushUpdate(projRoot, undefined, true);
  });
});
