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
  removeAnalytics,
  addPinpoint,
} from '@aws-amplify/amplify-e2e-core';
import {
  expectLocalAndPulledAwsExportsMatching,
  expectLocalAndPulledBackendAmplifyMetaMatching,
  expectLocalAndPulledBackendConfigMatching,
  getShortId,
} from '../import-helpers';

describe('notification category compatibility test', () => {
  const testChannelSelection = 'In-App Messaging';
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

  it(`should work well with pre-existing pinpoint that hasn't pushed`, async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    deleteBackendNeeded = true;

    // BEGIN - SETUP PINPOINT BUT DON'T PUSH (see analytics.test.ts)
    const rightName = 'testApp';
    await addPinpoint(projectRoot, { rightName, wrongName: '$' });
    console.log('a');
    // SETUP NOTIFICATIONS CHANNEL BUT DON'T PUSH (IN-APP MESSAGING)
    const settings = { resourceName: `${projectPrefix}${getShortId()}` };
    console.log('b');
    await addNotificationChannel(projectRoot, settings, testChannelSelection);
    const appId = getAppId(projectRoot);
    console.log('c');
    expect(appId).toBeDefined();

    // PUSH BOTH
    await amplifyPushAuth(projectRoot);
    console.log('d');
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
