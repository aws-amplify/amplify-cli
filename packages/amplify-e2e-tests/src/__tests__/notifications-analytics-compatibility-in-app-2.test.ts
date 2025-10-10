import {
  addNotificationChannel,
  amplifyPull,
  amplifyPushAuth,
  amplifyStatus,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  initJSProjectWithProfile,
  amplifyPushUpdate,
  addPinpointAnalytics,
} from '@aws-amplify/amplify-e2e-core';
import {
  expectLocalAndPulledAwsExportsMatching,
  expectLocalAndPulledBackendAmplifyMetaMatching,
  expectLocalAndPulledBackendConfigMatching,
  getShortId,
} from '../import-helpers';

describe('notification category compatibility test', () => {
  // Increase timeout for resource-intensive test
  jest.setTimeout(20 * 60 * 1000); // 20 minutes
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
    try {
      if (pullTestProjectRoot) {
        await deleteProject(pullTestProjectRoot);
        deleteProjectDir(pullTestProjectRoot);
        pullTestProjectRoot = null;
      }
    } catch (error) {
      console.warn('Failed to cleanup pull test project:', error.message);
    }

    try {
      await deleteProject(projectRoot);
      deleteProjectDir(projectRoot);
    } catch (error) {
      console.warn('Failed to cleanup main project:', error.message);
    }
  });

  it(`works with existing pinpoint that has pushed`, async () => {
    const pinpointResourceName = `${projectPrefix}${getShortId()}`;

    try {
      await initJSProjectWithProfile(projectRoot, projectSettings);

      const appId = getAppId(projectRoot);
      expect(appId).toBeDefined();

      // BEGIN - SETUP PINPOINT & PUSH
      await addPinpointAnalytics(projectRoot, false, pinpointResourceName);
      await amplifyPushUpdate(projectRoot);

      // SETUP NOTIFICATIONS CHANNEL & PUSH (IN-APP MESSAGING)
      const settings = { resourceName: pinpointResourceName };
      await addNotificationChannel(projectRoot, settings, 'In-App Messaging', true, true);

      // PUSH NOTIFICATIONS
      await amplifyPushAuth(projectRoot);

      // Test that backend resources match local configurations
      pullTestProjectRoot = await createNewProjectDir(`notification-pull${getShortId()}`);
      await amplifyPull(pullTestProjectRoot, { override: false, emptyDir: true, appId });
      expectLocalAndPulledBackendConfigMatching(projectRoot, pullTestProjectRoot);
      expectLocalAndPulledBackendAmplifyMetaMatching(projectRoot, pullTestProjectRoot);
      expectLocalAndPulledAwsExportsMatching(projectRoot, pullTestProjectRoot);

      // all categories should show up
      await amplifyStatus(projectRoot, 'Auth');
      await amplifyStatus(projectRoot, 'Analytics');
      await amplifyStatus(projectRoot, 'Notifications');
    } catch (error) {
      console.error('Test failed with error:', error);
      throw error;
    }
  });
});
