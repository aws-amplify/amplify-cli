import {
  addAuthWithDefault,
  addDDBWithTrigger,
  addDynamoDBWithGSIWithSettings,
  addS3StorageWithSettings,
  amplifyPull,
  amplifyPushWithoutCodegen,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
} from '@aws-amplify/amplify-e2e-core';
import { versionCheck, allowedVersionsToMigrateFrom } from '../../migration-helpers';
import { initJSProjectWithProfileV10 } from '../../migration-helpers-v10/init';
import {
  assertNoParameterChangesBetweenProjects,
  collectCloudformationDiffBetweenProjects,
  getShortId,
} from '../../migration-helpers/utils';

describe('storage category migration from v10 to latest', () => {
  const projectName = 'storageMigration';
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
    await initJSProjectWithProfileV10(projRoot, { name: 'storageMigration', disableAmplifyAppCreation: false });
    await addDynamoDBWithGSIWithSettings(projRoot, {
      resourceName: `${projectName}res${getShortId()}`,
      tableName: `${projectName}tbl${getShortId()}`,
      gsiName: `${projectName}gsi${getShortId()}`,
    });
    await addDDBWithTrigger(projRoot, {});
    await addAuthWithDefault(projRoot, {});
    await addS3StorageWithSettings(projRoot, { });
    await amplifyPushWithoutCodegen(projRoot);
  });

  afterEach(async () => {
    //await deleteProject(projRoot, null, true);
    //deleteProjectDir(projRoot);
  });

  it('...pull and push should not drift with new amplify version', async () => {
    const appId = getAppId(projRoot);
    expect(appId).toBeDefined();
    const projRoot2 = await createNewProjectDir('storageMigration2');
    try {
      await amplifyPull(projRoot2, { emptyDir: true, appId }, true);
      assertNoParameterChangesBetweenProjects(projRoot, projRoot2);
      expect(collectCloudformationDiffBetweenProjects(projRoot, projRoot2)).toMatchSnapshot();
      await amplifyPushWithoutCodegen(projRoot2, true);
      assertNoParameterChangesBetweenProjects(projRoot, projRoot2);
      expect(collectCloudformationDiffBetweenProjects(projRoot, projRoot2)).toMatchSnapshot();
    } finally {
      //deleteProjectDir(projRoot2);
    }
  });
});
