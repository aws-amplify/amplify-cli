import {
  addFeatureFlag,
  amplifyPush,
  amplifyPushUpdate,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  updateApiSchema,
  getProjectConfig,
} from 'amplify-e2e-core';
import { initJSProjectWithProfile, versionCheck, addApiWithoutSchemaOldDx, allowedVersionsToMigrateFrom } from '../../../migration-helpers';

describe('amplify key force push', () => {
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
    projRoot = await createNewProjectDir('api-key-cli-migration');
    await initJSProjectWithProfile(projRoot, { name: 'gqlkeytwomigration' });
  });

  afterEach(async () => {
    await deleteProject(projRoot, null, true);
    deleteProjectDir(projRoot);
  });

  it('init project, add lsi key and force push expect error', async () => {
    const initialSchema = 'migrations_key/initial_schema.graphql';
    // init, add api and push with installed cli
    const { projectName } = getProjectConfig(projRoot);
    await addApiWithoutSchemaOldDx(projRoot);
    updateApiSchema(projRoot, projectName, initialSchema);
    await amplifyPush(projRoot);
    // add feature flag
    addFeatureFlag(projRoot, 'graphqltransformer', 'secondaryKeyAsGSI', true);
    // forceUpdateSchema
    updateApiSchema(projRoot, projectName, initialSchema, true);
    // gql-compile and force push with codebase cli
    await expect(
      amplifyPushUpdate(projRoot, /Attempting to remove a local secondary index on the TodoTable table in the Todo stack.*/, true),
    ).rejects.toThrowError(/Attempting to remove a local secondary index on the TodoTable table in the Todo stack.*/);
  });
});
