import {
  addNotificationChannel,
  amplifyStatus,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  initJSProjectWithProfile,
  removeAllNotificationChannel,
  removeNotificationChannel,
} from '@aws-amplify/amplify-e2e-core';
import {
  getShortId,
} from '../import-helpers';

describe('notification category test - FCM', () => {
  const testChannel = 'FCM';
  const testChannelSelection = 'FCM  | » Firebase Push Notifications ';
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

  // Skipping FCM for now until we have setup required e2e accounts
  it.skip(`should add and remove the ${testChannel} channel correctly when no pinpoint is configured`, async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);

    const settings = { resourceName: `${projectPrefix}${getShortId()}` };
    await addNotificationChannel(projectRoot, settings, testChannelSelection);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    await amplifyStatus(projectRoot, 'Notifications');
    await amplifyStatus(projectRoot, 'Analytics');
    await amplifyStatus(projectRoot, 'Auth');

    await removeNotificationChannel(projectRoot, testChannelSelection);

    await amplifyStatus(projectRoot, 'Notifications');
    await amplifyStatus(projectRoot, 'Analytics');
    await amplifyStatus(projectRoot, 'Auth');

    await removeAllNotificationChannel(projectRoot);

    await amplifyStatus(projectRoot, '^(Notifications)');
    await amplifyStatus(projectRoot, 'Analytics');
    await amplifyStatus(projectRoot, 'Auth');
  });
});
