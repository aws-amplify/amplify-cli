import {
  amplifyPushLegacy,
  amplifyPushForce,
  apiGqlCompile,
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
      name: 'gqlkeymigration',
      includeUsageDataPrompt: false,
      includeGen2RecommendationPrompt: false,
    });
  });

  afterEach(async () => {
    await deleteProject(projRoot, null, true);
    deleteProjectDir(projRoot);
  });

  it('init project, add key and migrate with force push', async () => {
    const initialSchema = 'migrations_key/simple_key.graphql';
    const { projectName } = getProjectConfig(projRoot);
    // add api and push with installed cli
    await addApiWithBlankSchema(projRoot, { testingWithLatestCodebase: false });
    updateApiSchema(projRoot, projectName, initialSchema);
    setTransformerVersionFlag(projRoot, 1);
    await amplifyPushLegacy(projRoot);
    // gql-compile and force push with codebase cli
    await apiGqlCompile(projRoot, true);
    await amplifyPushForce(projRoot, true);
  });
});
