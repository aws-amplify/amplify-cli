import {
  addNotificationChannel,
  amplifyPushAuth,
  amplifyStatus,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  getBackendAmplifyMeta,
  getProjectMeta,
  getTeamProviderInfo,
  initJSProjectWithProfile,
  removeAllNotificationChannel,
  removeNotificationChannel,
} from '@aws-amplify/amplify-e2e-core';
import {
  getShortId,
} from '../import-helpers';

describe('notification category test - InAppMessaging', () => {
  const testChannel = 'InAppMessaging';
  const testChannelSelection = 'In-App Messaging';
  const envName = 'myEnv';
  const projectPrefix = `notification${testChannel}`.substring(0, 19);
  const projectSettings = {
    name: projectPrefix,
    disableAmplifyAppCreation: false,
    envName,
  };

  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir(projectPrefix);
  });

  afterEach(async () => {
    await deleteProject(projectRoot);
    deleteProjectDir(projectRoot);
  });

  it(`should add and remove the ${testChannel} channel correctly when no pinpoint is configured`, async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);

    const settings = { resourceName: `${projectPrefix}${getShortId()}` };
    await addNotificationChannel(projectRoot, settings, testChannelSelection);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    // InAppMessaging does not deploy inline, so we must push manually
    await amplifyPushAuth(projectRoot);

    // expect that Notifications, Analytics, and Auth categories are shown
    await amplifyStatus(projectRoot, 'Notifications');
    await amplifyStatus(projectRoot, 'Analytics');
    await amplifyStatus(projectRoot, 'Auth');

    // InAppMessaging & Analytics meta should exist
    const meta = getBackendAmplifyMeta(projectRoot);
    console.log(meta.analytics);
    console.log(meta.notifications);
    const inAppMessagingMeta = meta.notifications[settings.resourceName]?.output?.InAppMessaging;
    const analyticsMeta = meta.analytics[settings.resourceName]?.output;
    expect(inAppMessagingMeta).toBeDefined();
    expect(analyticsMeta).toBeDefined();
    expect(inAppMessagingMeta.Enabled).toBe(true);
    expect(inAppMessagingMeta.ApplicationId).toEqual(analyticsMeta.Id);

    // pinpointId in team-provider-info should match the analyticsMetaId
    const teamInfo = getTeamProviderInfo(projectRoot);
    console.log(teamInfo[envName].categories);
    const pinpointId = teamInfo[envName].categories?.notifications?.Pinpoint?.Id;
    expect(pinpointId).toBeDefined();
    expect(pinpointId).toEqual(analyticsMeta.Id);

    // remove in-app messaging only but don't push yet
    await removeNotificationChannel(projectRoot, testChannelSelection);
    // InAppMessaging should be disabled locally
    const updatedMeta = getBackendAmplifyMeta(projectRoot);
    console.log(updatedMeta.notifications);
    const updatedInAppMsgMeta = updatedMeta.notifications[settings.resourceName]?.output?.InAppMessaging;
    expect(updatedInAppMsgMeta).toBeDefined();
    expect(updatedInAppMsgMeta.Enabled).toBe(false);

    // amplify status should detect that we haven't pushed yet & show Update status
    await amplifyStatus(projectRoot, 'Update');
    // cloud backend should show that InAppMessaging is still enabled because we haven't pushed
    const cloudBackendMeta = await getProjectMeta(projectRoot);
    const cloudBackendInAppMsgMeta = cloudBackendMeta.notifications[settings.resourceName]?.output?.InAppMessaging;
    expect(cloudBackendInAppMsgMeta).toBeDefined();
    expect(cloudBackendInAppMsgMeta.Enabled).toBe(true);

    // push local changes to disable in-app messaging
    await amplifyPushAuth(projectRoot);

    // verify changes
    const updatedCloudBackendMeta = await getProjectMeta(projectRoot);
    const updatedCloudBackendInAppMsgMeta = updatedCloudBackendMeta.notifications[settings.resourceName]?.output?.InAppMessaging;
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
