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
} from "@aws-amplify/amplify-e2e-core";
import {
  expectLocalAndPulledAwsExportsMatching,
  expectLocalAndPulledBackendAmplifyMetaMatching,
  expectLocalAndPulledBackendConfigMatching,
  getShortId,
} from "../import-helpers";

describe("notification category compatibility test", () => {
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

    // BEGIN - SETUP PINPOINT & PUSH
    await addPinpointAnalytics(projectRoot, false, pinpointResourceName);
    await amplifyPushUpdate(projectRoot);

    // SETUP NOTIFICATIONS CHANNEL & PUSH (IN-APP MESSAGING)
    const settings = { resourceName: pinpointResourceName };
    await addNotificationChannel(projectRoot, settings, "In-App Messaging", true, true);

    // PUSH NOTIFICATIONS
    await amplifyPushAuth(projectRoot);

    // Test that backend resources match local configurations
    pullTestProjectRoot = await createNewProjectDir(`notification-pull${getShortId()}`);
    await amplifyPull(pullTestProjectRoot, { override: false, emptyDir: true, appId });
    expectLocalAndPulledBackendConfigMatching(projectRoot, pullTestProjectRoot);
    expectLocalAndPulledBackendAmplifyMetaMatching(projectRoot, pullTestProjectRoot);
    expectLocalAndPulledAwsExportsMatching(projectRoot, pullTestProjectRoot);

    // all categories should show up
    await amplifyStatus(projectRoot, "Auth");
    await amplifyStatus(projectRoot, "Analytics");
    await amplifyStatus(projectRoot, "Notifications");
  });
});
