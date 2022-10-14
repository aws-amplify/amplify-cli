import {
  addNotificationChannel,
  amplifyPull,
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
  sleep,
  amplifyPushUpdate,
} from '@aws-amplify/amplify-e2e-core';
import {
  expectLocalAndPulledAwsExportsMatching,
  expectLocalAndPulledBackendAmplifyMetaMatching,
  expectLocalAndPulledBackendConfigMatching,
  getShortId,
} from '../import-helpers';

describe('notification category compatibility test', () => {
  const testChannelSelection = 'SMS';
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

  it(`should work well with pre-existing pinpoint that hasn't pushed`, async () => {
    const pinpointResourceName = `${projectPrefix}${getShortId()}`;

    await initJSProjectWithProfile(projectRoot, projectSettings);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    // BEGIN - SETUP PINPOINT (see analytics.test.ts)
    await addPinpointAnalytics(projectRoot, pinpointResourceName);
    await amplifyPushUpdate(projectRoot);

    // SETUP NOTIFICATIONS CHANNEL (SMS, pushes inline)
    const settings = { resourceName: pinpointResourceName };
    await addNotificationChannel(projectRoot, settings, testChannelSelection, true, true);

    await sleep(3000);
    // SMS & Analytics meta should exist
    const meta = getBackendAmplifyMeta(projectRoot);
    console.log(meta.analytics);
    console.log(meta.notifications[pinpointResourceName]?.output);
    const SMSMeta = meta.notifications[pinpointResourceName]?.output?.SMS;
    const analyticsMeta = meta.analytics[pinpointResourceName]?.output;
    expect(SMSMeta).toBeDefined();
    expect(analyticsMeta).toBeDefined();
    expect(SMSMeta.Enabled).toBe(true);
    expect(SMSMeta.ApplicationId).toEqual(analyticsMeta.Id);

    // pinpointId in team-provider-info should match the analyticsMetaId
    const teamInfo = getTeamProviderInfo(projectRoot);
    console.log(teamInfo[envName].categories);
    // const pinpointId = teamInfo[envName].categories?.notifications?.Pinpoint?.Id;
    // when analytics are added first, the pinpoint id is stored under analytics, not notifications
    const pinpointId = teamInfo[envName].categories?.analytics?.Pinpoint?.Id;
    expect(pinpointId).toBeDefined();
    expect(pinpointId).toEqual(analyticsMeta.Id);

    // Test that backend resources match local configurations
    pullTestProjectRoot = await createNewProjectDir(`notification-pull${getShortId()}`);
    await amplifyPull(pullTestProjectRoot, { override: false, emptyDir: true, appId });
    expectLocalAndPulledBackendConfigMatching(projectRoot, pullTestProjectRoot);
    expectLocalAndPulledBackendAmplifyMetaMatching(projectRoot, pullTestProjectRoot);
    expectLocalAndPulledAwsExportsMatching(projectRoot, pullTestProjectRoot);

    // remove SMS channel only, this will update both local and cloud
    await removeNotificationChannel(projectRoot, testChannelSelection);

    // SMS should be disabled locally
    const updatedMeta = getBackendAmplifyMeta(projectRoot);
    console.log(updatedMeta.notifications);
    const updatedInAppMsgMeta = updatedMeta.notifications[pinpointResourceName]?.output?.SMS;
    expect(updatedInAppMsgMeta).toBeDefined();
    expect(updatedInAppMsgMeta.Enabled).toBe(false);
    // cloud backend should show that SMS is disabled
    const cloudBackendMeta = await getProjectMeta(projectRoot);
    const cloudBackendInAppMsgMeta = cloudBackendMeta.notifications[pinpointResourceName]?.output?.SMS;
    expect(cloudBackendInAppMsgMeta).toBeDefined();
    expect(cloudBackendInAppMsgMeta.Enabled).toBe(false);

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
