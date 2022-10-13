import {
  addNotificationChannel,
  amplifyPull,
  amplifyPushAuth,
  amplifyStatus,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  describeCloudFormationStack,
  getAppId,
  getProjectMeta,
  initJSProjectWithProfile,
  removeAllNotificationChannel,
  removeNotificationChannel,
} from '@aws-amplify/amplify-e2e-core';
import {
  expectLocalAndPulledAwsExportsMatching,
  expectLocalAndPulledBackendAmplifyMetaMatching,
  expectLocalAndPulledBackendConfigMatching,
  getShortId,
} from '../import-helpers';

describe('notification category test', () => {
  const INLINE_NOTIFICATION_CHOICES = ['SMS'];
  const DEFERRED_NOTIFICATION_CHOICES = ['In-App Messaging'];

  // inline channels
  it.each(INLINE_NOTIFICATION_CHOICES)('should add the %s channel correctly when no pinpoint is configured', async channel => {
    const projectPrefix = `notification${getShortId()}`;
    const projectSettings = { name: projectPrefix, disableAmplifyAppCreation: false };

    const projectRoot = await createNewProjectDir(projectPrefix);
    await initJSProjectWithProfile(projectRoot, projectSettings);

    let projectRootPull: string;

    try {
      const settings = { resourceName: `${projectPrefix}${getShortId()}` };
      await addNotificationChannel(projectRoot, settings, channel);

      const appId = getAppId(projectRoot);
      expect(appId).toBeDefined();

      projectRootPull = await createNewProjectDir(`notification-pull${getShortId()}`);
      await amplifyPull(projectRootPull, { override: false, emptyDir: true, appId });

      expectLocalAndPulledBackendConfigMatching(projectRoot, projectRootPull);
      expectLocalAndPulledBackendAmplifyMetaMatching(projectRoot, projectRootPull);
      expectLocalAndPulledAwsExportsMatching(projectRoot, projectRootPull);

      // Delete the project now to assert that CFN is able to clean up successfully.
      const { StackId: stackId, Region: region } = getProjectMeta(projectRoot).providers.awscloudformation;
      await deleteProject(projectRoot);

      const stack = await describeCloudFormationStack(stackId, region);
      expect(stack.StackStatus).toEqual('DELETE_COMPLETE');
    } finally {
      deleteProjectDir(projectRoot);
      deleteProjectDir(projectRootPull);
    }
  });

  // deferred channels
  it.each(DEFERRED_NOTIFICATION_CHOICES)('should add the %s channel correctly when no pinpoint is configured', async channel => {
    const projectPrefix = `notification${getShortId()}`;
    const projectSettings = { name: projectPrefix, disableAmplifyAppCreation: false };

    const projectRoot = await createNewProjectDir(projectPrefix);
    await initJSProjectWithProfile(projectRoot, projectSettings);

    let projectRootPull: string;

    try {
      const settings = { resourceName: `${projectPrefix}${getShortId()}` };
      await addNotificationChannel(projectRoot, settings, channel);

      const appId = getAppId(projectRoot);
      expect(appId).toBeDefined();

      await amplifyPushAuth(projectRoot);

      projectRootPull = await createNewProjectDir(`notification-pull${getShortId()}`);
      await amplifyPull(projectRootPull, { override: false, emptyDir: true, appId });

      expectLocalAndPulledBackendConfigMatching(projectRoot, projectRootPull);
      expectLocalAndPulledBackendAmplifyMetaMatching(projectRoot, projectRootPull);
      expectLocalAndPulledAwsExportsMatching(projectRoot, projectRootPull);

      // Delete the project now to assert that CFN is able to clean up successfully.
      const { StackId: stackId, Region: region } = getProjectMeta(projectRoot).providers.awscloudformation;
      await deleteProject(projectRoot);

      const stack = await describeCloudFormationStack(stackId, region);
      expect(stack.StackStatus).toEqual('DELETE_COMPLETE');
    } finally {
      deleteProjectDir(projectRoot);
      deleteProjectDir(projectRootPull);
    }
  });

  // inline channels
  it.each(INLINE_NOTIFICATION_CHOICES)('should add and remove the %s channel correctly when no pinpoint is configured', async channel => {
    const projectPrefix = `notification${getShortId()}`;
    const projectSettings = { name: projectPrefix, disableAmplifyAppCreation: false };

    const projectRoot = await createNewProjectDir(projectPrefix);
    await initJSProjectWithProfile(projectRoot, projectSettings);

    try {
      const settings = { resourceName: `${projectPrefix}${getShortId()}` };
      await addNotificationChannel(projectRoot, settings, channel);

      const appId = getAppId(projectRoot);
      expect(appId).toBeDefined();

      await amplifyStatus(projectRoot, 'Notifications');
      await amplifyStatus(projectRoot, 'Analytics');
      await amplifyStatus(projectRoot, 'Auth');

      await removeNotificationChannel(projectRoot, channel);

      await amplifyStatus(projectRoot, 'Notifications');
      await amplifyStatus(projectRoot, 'Analytics');
      await amplifyStatus(projectRoot, 'Auth');

      await removeAllNotificationChannel(projectRoot);

      await amplifyStatus(projectRoot, '^(Notifications)');
      await amplifyStatus(projectRoot, 'Analytics');
      await amplifyStatus(projectRoot, 'Auth');

      await deleteProject(projectRoot);
    } finally {
      deleteProjectDir(projectRoot);
    }
  });
});
