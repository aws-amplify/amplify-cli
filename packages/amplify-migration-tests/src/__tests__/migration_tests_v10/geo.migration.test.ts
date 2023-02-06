import {
  addAuthWithDefault,
  addGeofenceCollectionWithDefault,
  addMapWithDefault,
  addPlaceIndexWithDefault,
  amplifyPushWithoutCodegen,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  updateAuthAddUserGroups,
} from '@aws-amplify/amplify-e2e-core';
import { validateVersionsForMigrationTest } from '../../migration-helpers';
import { initJSProjectWithProfileV10 } from '../../migration-helpers-v10/init';
import {
  pullPushWithLatestCodebaseValidateParameterAndCfnDrift,
} from '../../migration-helpers/utils';

describe('geo category migration from v10 to latest', () => {
  const projectName = 'geoMigration';
  let projRoot: string;

  beforeAll(async () => {
    await validateVersionsForMigrationTest();
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
    await pullPushWithLatestCodebaseValidateParameterAndCfnDrift(projRoot, projectName);
  });
});
