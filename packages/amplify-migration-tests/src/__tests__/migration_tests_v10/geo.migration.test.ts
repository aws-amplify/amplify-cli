import {
  addAuthWithDefault,
  addGeofenceCollectionWithDefault,
  addMapWithDefault,
  addPlaceIndexWithDefault,
  amplifyPull,
  amplifyPushWithoutCodegen,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  updateAuthAddUserGroups,
} from '@aws-amplify/amplify-e2e-core';
import { versionCheck, allowedVersionsToMigrateFrom } from '../../migration-helpers';
import { initJSProjectWithProfileV10 } from '../../migration-helpers-v10/init';
import {
  assertNoParameterChangesBetweenProjects,
  collectCloudformationDiffBetweenProjects,
} from '../../migration-helpers/utils';

describe('geo category migration from v10 to latest', () => {
  const projectName = 'geoMigration';
  let projRoot: string;

  beforeAll(async () => {
    const migrateFromVersion = { v: 'unintialized' };
    const migrateToVersion = { v: 'unintialized' };
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
    console.log(`Test migration from: ${migrateFromVersion.v} to ${migrateToVersion.v}`);
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
  });

  beforeEach(async () => {
    projRoot = await createNewProjectDir(projectName);
    await initJSProjectWithProfileV10(projRoot, { name: 'geoMigration', disableAmplifyAppCreation: false });
    await addAuthWithDefault(projRoot);
    await addMapWithDefault(projRoot);
    await addPlaceIndexWithDefault(projRoot);
    const cognitoGroups = ['admin', 'admin1'];
    await updateAuthAddUserGroups(projRoot, cognitoGroups);
    await addGeofenceCollectionWithDefault(projRoot, cognitoGroups);
    await amplifyPushWithoutCodegen(projRoot);
  });

  afterEach(async () => {
    await deleteProject(projRoot, null, true);
    deleteProjectDir(projRoot);
  });

  it('...pull and push should not drift with new amplify version', async () => {
    const appId = getAppId(projRoot);
    expect(appId).toBeDefined();
    const projRoot2 = await createNewProjectDir('geoMigration2');
    try {
      await amplifyPull(projRoot2, { emptyDir: true, appId }, true);
      assertNoParameterChangesBetweenProjects(projRoot, projRoot2);
      expect(collectCloudformationDiffBetweenProjects(projRoot, projRoot2)).toMatchSnapshot();
      await amplifyPushWithoutCodegen(projRoot2, true);
      assertNoParameterChangesBetweenProjects(projRoot, projRoot2);
      expect(collectCloudformationDiffBetweenProjects(projRoot, projRoot2)).toMatchSnapshot();
    } finally {
      deleteProjectDir(projRoot2);
    }
  });
});
