import {
  addAuthWithDefault,
  addDDBWithTrigger,
  addDynamoDBWithGSIWithSettings,
  addS3StorageWithSettings,
  amplifyPushWithoutCodegen,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';
import { validateVersionsForMigrationTest } from '../../migration-helpers';
import { initJSProjectWithProfileV10 } from '../../migration-helpers-v10/init';
import {
  getShortId, pullPushWithLatestCodebaseValidateParameterAndCfnDrift,
} from '../../migration-helpers/utils';

describe('storage category migration from v10 to latest', () => {
  const projectName = 'storageMigration';
  let projRoot: string;

  beforeAll(async () => {
    await validateVersionsForMigrationTest();
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
    await deleteProject(projRoot, null, true);
    deleteProjectDir(projRoot);
  });

  it('...pull and push should not drift with new amplify version', async () => {
    await pullPushWithLatestCodebaseValidateParameterAndCfnDrift(projRoot, projectName);
  });
});
