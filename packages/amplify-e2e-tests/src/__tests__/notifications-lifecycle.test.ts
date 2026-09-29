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
} from '@aws-amplify/amplify-e2e-core';
import {
  expectLocalAndPulledAwsExportsMatching,
  expectLocalAndPulledBackendAmplifyMetaMatching,
  expectLocalAndPulledBackendConfigMatching,
  getShortId,
} from '../import-helpers';

describe('notification category lifecycle test', () => {
  const projectPrefix = `notificationLifecycle`.substring(0, 19);
  const projectSettings = {
    name: projectPrefix,
    disableAmplifyAppCreation: false,
  };

  let projectRoot: string;
  let pullTestProjectRoot: string;
  let deleteNeeded = false;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir(projectPrefix);
  });

  afterEach(async () => {
    if (deleteNeeded) {
      await deleteProject(projectRoot);
    }
    deleteProjectDir(projectRoot);
    if (pullTestProjectRoot) {
      deleteProjectDir(pullTestProjectRoot);
    }
  });

  it(`should create & delete resources correctly`, async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    deleteNeeded = true;

    const settings = { resourceName: `${projectPrefix}${getShortId()}` };
    await addNotificationChannel(projectRoot, settings, 'In-App Messaging');

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    // InAppMessaging does not deploy inline, so we must push manually
    await amplifyPushAuth(projectRoot);

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
    deleteNeeded = false;
  });
});
