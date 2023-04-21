import {
  amplifyPushLegacy,
  amplifyPushForce,
  apiGqlCompile,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  updateApiSchema,
  getProjectConfig,
} from '@aws-amplify/amplify-e2e-core';
import {
  initJSProjectWithProfileV4_52_0,
  versionCheck,
  addApiWithoutSchemaOldDx,
  allowedVersionsToMigrateFrom,
} from '../../../migration-helpers';

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

    await initJSProjectWithProfileV4_52_0(projRoot, { name: 'gqlkeymigration' });
  });

  afterEach(async () => {
    await deleteProject(projRoot, null, true);
    deleteProjectDir(projRoot);
  });

  it('init project, add key and migrate with force push', async () => {
    const initialSchema = 'migrations_key/simple_key.graphql';
    const { projectName } = getProjectConfig(projRoot);
    // add api and push with installed cli
    await addApiWithoutSchemaOldDx(projRoot);
    updateApiSchema(projRoot, projectName, initialSchema);
    await amplifyPushLegacy(projRoot);
    // gql-compile and force push with codebase cli
    await apiGqlCompile(projRoot, true);
    await amplifyPushForce(projRoot, true);
  });
});
