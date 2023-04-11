import {
  addNotificationChannel,
  addPinpointAnalytics,
  amplifyPushAuth,
  amplifyPushWithoutCodegen,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';
import { validateVersionsForMigrationTest } from '../../migration-helpers';
import { initJSProjectWithProfileV10 } from '../../migration-helpers-v10/init';
import { getShortId } from '../../migration-helpers/utils';

describe('pinpoint region migration from v10 to latest', () => {
  const projectName = 'pinpointMigration';
  let projectRoot: string;

  beforeAll(async () => {
    await validateVersionsForMigrationTest();
  });

  beforeEach(async () => {
    projectRoot = await createNewProjectDir(projectName);
    await initJSProjectWithProfileV10(projectRoot, { name: 'pinpointMigration', disableAmplifyAppCreation: false });
    await addPinpointAnalytics(projectRoot, false);
    await amplifyPushWithoutCodegen(projectRoot);
  });

  afterEach(async () => {
    await deleteProject(projectRoot, null, true);
    deleteProjectDir(projectRoot);
  });

  // test forced to be executed in us-east-2 region
  it('should add notifications using us-east-1 region client to match original pinpoint resource', async () => {
    const settings = { resourceName: `notification${getShortId()}` };
    await addNotificationChannel(projectRoot, settings, 'In-App Messaging', true, true, true);
    await addNotificationChannel(projectRoot, settings, 'SMS', true, true, true);
    await amplifyPushAuth(projectRoot, true);
  });
});
