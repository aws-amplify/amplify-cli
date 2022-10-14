import {
  addNotificationChannel,
  amplifyPull,
  amplifyPushAuth,
  amplifyStatus,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  getProjectMeta,
  initJSProjectWithProfile,
  amplifyPushUpdate,
  removeAnalytics,
  addPinpointAnalytics,
} from '@aws-amplify/amplify-e2e-core';
import {
  expectLocalAndPulledAwsExportsMatching,
  expectLocalAndPulledBackendAmplifyMetaMatching,
  expectLocalAndPulledBackendConfigMatching,
  getShortId,
} from '../import-helpers';

describe('notification category compatibility test', () => {
  const projectPrefix = `notificationCompatibility`.substring(0, 19);
  const projectSettings = {
    name: projectPrefix,
    disableAmplifyAppCreation: false,
  };

  let projectRoot: string;
  let pullTestProjectRoot: string;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir(projectPrefix);
  });

  afterEach(async () => {
    await removeAnalytics(projectRoot, {});
    await deleteProject(projectRoot);
    deleteProjectDir(projectRoot);
    if (pullTestProjectRoot) {
      deleteProjectDir(pullTestProjectRoot);
    }
  });

  it(`works with existing pinpoint that has pushed`, async () => {
    const pinpointResourceName = `${projectPrefix}${getShortId()}`;

    await initJSProjectWithProfile(projectRoot, projectSettings);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    // BEGIN - SETUP PINPOINT & PUSH (see analytics.test.ts)
    await addPinpointAnalytics(projectRoot, pinpointResourceName);
    await amplifyPushUpdate(projectRoot);

    // SETUP NOTIFICATIONS CHANNEL & PUSH (IN-APP MESSAGING)
    const settings = { resourceName: pinpointResourceName };
    await addNotificationChannel(projectRoot, settings, 'In-App Messaging', true, true);

    // PUTH NOTIFICATIONS
    await amplifyPushAuth(projectRoot);

    // Test that backend resources match local configurations
    pullTestProjectRoot = await createNewProjectDir(`notification-pull${getShortId()}`);
    await amplifyPull(pullTestProjectRoot, { override: false, emptyDir: true, appId });
    expectLocalAndPulledBackendConfigMatching(projectRoot, pullTestProjectRoot);
    expectLocalAndPulledBackendAmplifyMetaMatching(projectRoot, pullTestProjectRoot);
    expectLocalAndPulledAwsExportsMatching(projectRoot, pullTestProjectRoot);

    // Remove Pinpoint
    await removeAnalytics(projectRoot, {});
    await amplifyPushUpdate(projectRoot);

    await amplifyStatus(projectRoot, 'Auth');

    // notification should not exist in the cloud
    const endCloudBackendMeta = await getProjectMeta(projectRoot);
    expect(endCloudBackendMeta.notifications).toBeUndefined();
  });
});
