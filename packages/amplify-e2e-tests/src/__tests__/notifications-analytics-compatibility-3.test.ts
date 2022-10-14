import {
  addNotificationChannel,
  amplifyPull,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  describeCloudFormationStack,
  getAppId,
  getProjectMeta,
  initJSProjectWithProfile,
  amplifyPushUpdate,
  addPinpoint,
  removeAnalytics,
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
  let deleteBackendNeeded = false;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir(projectPrefix);
  });

  afterEach(async () => {
    await removeAnalytics(projectRoot, {});
    if (deleteBackendNeeded) {
      await deleteProject(projectRoot);
    }
    deleteProjectDir(projectRoot);
    if (pullTestProjectRoot) {
      deleteProjectDir(pullTestProjectRoot);
    }
  });

  it(`should not affect`, async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    deleteBackendNeeded = true;

    // SETUP NOTIFICATIONS CHANNEL & PUSH (IN-APP MESSAGING)
    const settings = { resourceName: `${projectPrefix}${getShortId()}` };
    await addNotificationChannel(projectRoot, settings, 'In-App Messaging');
    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();
    await amplifyPushAuth(projectRoot);

    // BEGIN - SETUP PINPOINT & PUSH (see analytics.test.ts)
    const rightName = 'testApp';
    await addPinpoint(projectRoot, { rightName, wrongName: '$' });
    await amplifyPushUpdate(projectRoot);

    // Test that backend resources match local configurations
    pullTestProjectRoot = await createNewProjectDir(`notification-pull${getShortId()}`);
    await amplifyPull(pullTestProjectRoot, { override: false, emptyDir: true, appId });
    expectLocalAndPulledBackendConfigMatching(projectRoot, pullTestProjectRoot);
    expectLocalAndPulledBackendAmplifyMetaMatching(projectRoot, pullTestProjectRoot);
    expectLocalAndPulledAwsExportsMatching(projectRoot, pullTestProjectRoot);

    // Delete the project now to assert that CFN is able to clean up successfully.
    const { StackId: stackId, Region: region } = getProjectMeta(projectRoot).providers.awscloudformation;
    await deleteProject(projectRoot);

    const stack = await describeCloudFormationStack(stackId, region);
    expect(stack.StackStatus).toEqual('DELETE_COMPLETE');
    deleteBackendNeeded = false;
  });
});
