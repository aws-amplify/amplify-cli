import {
  addNotificationChannel,
  addPinpointAnalytics,
  amplifyPushAuth,
  amplifyPushAuthV5V6,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import { versionCheck } from '../../../migration-helpers';
import { getShortId } from '../../../migration-helpers/utils';

describe('amplify add notifications', () => {
  let projectRoot: string;
  const migrateFromVersion = { v: '10.0.0' };
  const migrateToVersion = { v: 'uninitialized' };

  beforeEach(async () => {
    projectRoot = await createNewProjectDir('init');
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
  });

  afterEach(async () => {
    await deleteProject(projectRoot, undefined, true);
    deleteProjectDir(projectRoot);
  });

  it('should add in app notifications if analytics added with an older version', async () => {
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);

    await initJSProjectWithProfile(projectRoot, { includeUsageDataPrompt: false });
    await addPinpointAnalytics(projectRoot, false);

    const settings = { resourceName: `notification${getShortId()}` };
    await addNotificationChannel(projectRoot, settings, 'In-App Messaging', true, true, true);

    await amplifyPushAuth(projectRoot, true);
  });

  it('should add in app notifications if analytics added and pushed with an older version', async () => {
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);

    await initJSProjectWithProfile(projectRoot, { includeUsageDataPrompt: false });
    await addPinpointAnalytics(projectRoot, false);
    await amplifyPushAuthV5V6(projectRoot);

    const settings = { resourceName: `notification${getShortId()}` };
    await addNotificationChannel(projectRoot, settings, 'In-App Messaging', true, true, true);

    await amplifyPushAuth(projectRoot, true);
  });
});
