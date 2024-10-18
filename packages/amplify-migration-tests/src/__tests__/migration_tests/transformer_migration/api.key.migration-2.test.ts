import {
  addFeatureFlag,
  amplifyPushLegacy,
  amplifyPushUpdate,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  updateApiSchema,
  getProjectConfig,
  initJSProjectWithProfile,
  addApiWithBlankSchema,
  setTransformerVersionFlag,
} from '@aws-amplify/amplify-e2e-core';
import { versionCheck, allowedVersionsToMigrateFrom } from '../../../migration-helpers';

describe('amplify key force push', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('api-key-cli-migration');
    const migrateFromVersion = { v: 'unintialized' };
    const migrateToVersion = { v: 'unintialized' };
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);

    await initJSProjectWithProfile(projRoot, {
      name: 'gqlkeytwomigration',
      includeUsageDataPrompt: false,
      includeGen2RecommendationPrompt: false,
    });
  });

  afterEach(async () => {
    await deleteProject(projRoot, null, true);
    deleteProjectDir(projRoot);
  });

  it('init project, add lsi key and force push expect error', async () => {
    const initialSchema = 'migrations_key/initial_schema.graphql';
    // init, add api and push with installed cli
    const { projectName } = getProjectConfig(projRoot);
    await addApiWithBlankSchema(projRoot, { testingWithLatestCodebase: false });
    updateApiSchema(projRoot, projectName, initialSchema);
    setTransformerVersionFlag(projRoot, 1);
    await amplifyPushLegacy(projRoot);
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
