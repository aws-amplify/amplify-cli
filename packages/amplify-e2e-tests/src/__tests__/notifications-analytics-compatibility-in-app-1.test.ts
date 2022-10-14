import {
  addNotificationChannel,
  amplifyPull,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  getProjectMeta,
  initJSProjectWithProfile,
  removeAnalytics,
  addPinpointAnalytics,
  removeNotificationChannel,
  getBackendAmplifyMeta,
  amplifyStatus,
  getTeamProviderInfo,
  removeAllNotificationChannel,
} from '@aws-amplify/amplify-e2e-core';
import {
  expectLocalAndPulledAwsExportsMatching,
  expectLocalAndPulledBackendAmplifyMetaMatching,
  expectLocalAndPulledBackendConfigMatching,
  getShortId,
} from '../import-helpers';

describe('notification category compatibility test', () => {
  const testChannelSelection = 'In-App Messaging';
  const envName = 'test';
  const projectPrefix = `notificationCompatibility`.substring(0, 19);
  const projectSettings = {
    name: projectPrefix,
    disableAmplifyAppCreation: false,
    envName,
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

  it(`works with existing pinpoint that hasn't pushed`, async () => {
    const pinpointResourceName = `${projectPrefix}${getShortId()}`;
    await initJSProjectWithProfile(projectRoot, projectSettings);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    // BEGIN - SETUP PINPOINT BUT DON'T PUSH (see analytics.test.ts)
    await addPinpointAnalytics(projectRoot, pinpointResourceName);

    // SETUP NOTIFICATIONS CHANNEL BUT DON'T PUSH (IN-APP MESSAGING)
    await addNotificationChannel(projectRoot, { resourceName: pinpointResourceName }, testChannelSelection, true, true);

    // PUSH BOTH
    await amplifyPushAuth(projectRoot);

    // InAppMessaging & Analytics meta should exist
    const meta = getBackendAmplifyMeta(projectRoot);
    console.log(meta.analytics);
    console.log(meta.notifications[pinpointResourceName]?.output);
    const inAppMessagingMeta = meta.notifications[pinpointResourceName]?.output?.InAppMessaging;
    const analyticsMeta = meta.analytics[pinpointResourceName]?.output;
    expect(inAppMessagingMeta).toBeDefined();
    expect(analyticsMeta).toBeDefined();
    expect(inAppMessagingMeta.Enabled).toBe(true);
    expect(inAppMessagingMeta.ApplicationId).toEqual(analyticsMeta.Id);

    // pinpointId in team-provider-info should match the analyticsMetaId
    const teamInfo = getTeamProviderInfo(projectRoot);
    console.log(teamInfo[envName].categories);
    // when analytics hasn't pushed or when notifications & analytics push at the same time,
    // the pinpoint id will be stored under notifications
    const pinpointId = teamInfo[envName].categories?.notifications?.Pinpoint?.Id;
    expect(pinpointId).toBeDefined();
    expect(pinpointId).toEqual(analyticsMeta.Id);

    // Test that backend resources match local configurations
    pullTestProjectRoot = await createNewProjectDir(`notification-pull${getShortId()}`);
    await amplifyPull(pullTestProjectRoot, { override: false, emptyDir: true, appId });
    expectLocalAndPulledBackendConfigMatching(projectRoot, pullTestProjectRoot);
    expectLocalAndPulledBackendAmplifyMetaMatching(projectRoot, pullTestProjectRoot);
    expectLocalAndPulledAwsExportsMatching(projectRoot, pullTestProjectRoot);

    // remove notifications - inapp
    // remove in-app messaging only but don't push yet
    await removeNotificationChannel(projectRoot, testChannelSelection);
    // InAppMessaging should be disabled locally
    const updatedMeta = getBackendAmplifyMeta(projectRoot);
    console.log(updatedMeta.notifications);
    const updatedInAppMsgMeta = updatedMeta.notifications[pinpointResourceName]?.output?.InAppMessaging;
    expect(updatedInAppMsgMeta).toBeDefined();
    expect(updatedInAppMsgMeta.Enabled).toBe(false);

    // amplify status should detect that we haven't pushed yet & show Update status
    await amplifyStatus(projectRoot, 'Update');
    // cloud backend should show that InAppMessaging is still enabled because we haven't pushed
    const cloudBackendMeta = await getProjectMeta(projectRoot);
    const cloudBackendInAppMsgMeta = cloudBackendMeta.notifications[pinpointResourceName]?.output?.InAppMessaging;
    expect(cloudBackendInAppMsgMeta).toBeDefined();
    expect(cloudBackendInAppMsgMeta.Enabled).toBe(true);

    // push local changes to disable in-app messaging
    await amplifyPushAuth(projectRoot);

    // verify changes
    const updatedCloudBackendMeta = await getProjectMeta(projectRoot);
    const updatedCloudBackendInAppMsgMeta = updatedCloudBackendMeta.notifications[pinpointResourceName]?.output?.InAppMessaging;
    expect(updatedCloudBackendInAppMsgMeta).toBeDefined();
    expect(updatedCloudBackendInAppMsgMeta.Enabled).toBe(false);

    // make sure Notifications/Analytics/Auth still show up in status
    await amplifyStatus(projectRoot, 'Notifications');
    await amplifyStatus(projectRoot, 'Analytics');
    await amplifyStatus(projectRoot, 'Auth');

    // this will remove notifications inline, so both local/cloud will be updated
    await removeAllNotificationChannel(projectRoot);

    // analytics/auth should still exist
    await amplifyStatus(projectRoot, 'Analytics');
    await amplifyStatus(projectRoot, 'Auth');

    // notifications should not exist locally (check the amplify-meta.json file)
    const finalLocalMeta = getBackendAmplifyMeta(projectRoot);
    expect(finalLocalMeta.notifications).toBeUndefined();

    // notification should not exist in the cloud
    const endCloudBackendMeta = await getProjectMeta(projectRoot);
    expect(endCloudBackendMeta.notifications).toBeUndefined();
  });
});
