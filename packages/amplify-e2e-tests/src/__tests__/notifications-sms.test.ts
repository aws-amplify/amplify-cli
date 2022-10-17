import {
  addNotificationChannel,
  amplifyStatus,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  getBackendAmplifyMeta,
  initJSProjectWithProfile,
  removeAllNotificationChannel,
  removeNotificationChannel,
} from '@aws-amplify/amplify-e2e-core';
import {
  getShortId,
} from '../import-helpers';

describe('notification category test - SMS', () => {
  const testChannel = 'SMS';
  const testChannelSelection = 'SMS';
  const projectPrefix = `notification${testChannel}`.substring(0, 19);
  const projectSettings = {
    name: projectPrefix,
    disableAmplifyAppCreation: false,
  };

  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir(projectPrefix);
  });

  afterEach(async () => {
    await deleteProject(projectRoot);
    deleteProjectDir(projectRoot);
  });

  // inline channels
  it(`should add and remove the ${testChannel} channel correctly when no pinpoint is configured`, async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);

    // add sms channel
    const settings = { resourceName: `${projectPrefix}${getShortId()}` };
    await addNotificationChannel(projectRoot, settings, testChannelSelection);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    // expect that Notifications, Analytics, and Auth categories are shown
    await amplifyStatus(projectRoot, 'Notifications');
    await amplifyStatus(projectRoot, 'Analytics');
    await amplifyStatus(projectRoot, 'Auth');

    // SMS should be found
    const meta = getBackendAmplifyMeta(projectRoot);
    expect(meta.notifications[settings.resourceName]?.output?.SMS).toBeDefined();

    // remove sms only
    await removeNotificationChannel(projectRoot, testChannelSelection);

    // notifications should still exist even though sms channel was removed
    await amplifyStatus(projectRoot, 'Notifications');
    await amplifyStatus(projectRoot, 'Analytics');
    await amplifyStatus(projectRoot, 'Auth');

    // notifications are removed entirely
    await removeAllNotificationChannel(projectRoot);

    // analytics should still exist
    await amplifyStatus(projectRoot, 'Analytics');
    await amplifyStatus(projectRoot, 'Auth');

    // notifications should not exist by checking the amplify-meta.json file
    const updatedMeta = getBackendAmplifyMeta(projectRoot);
    expect(updatedMeta.notifications).toBeUndefined();
  });
});
