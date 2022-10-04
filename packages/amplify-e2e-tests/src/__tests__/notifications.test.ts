import {
  addNotificationChannel,
  amplifyPull,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  describeCloudFormationStack,
  getAppId,
  getProjectMeta,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import { expectLocalAndPulledBackendConfigMatching, getShortId } from '../import-helpers';

describe('notification category test', () => {
  const projectPrefix = 'notification';
  const projectSettings = { name: projectPrefix, disableAmplifyAppCreation: false };

  let projectRoot: string;
  let projectRootPull: string;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir(projectPrefix);
    await initJSProjectWithProfile(projectRoot, projectSettings);
  });

  afterEach(async () => {
    deleteProjectDir(projectRoot);
    deleteProjectDir(projectRootPull);
  });

  it.each(['SMS', 'In-App Messaging'])('should add the %s channel correctly', async channel => {
    const settings = { resourceName: `${projectPrefix}${getShortId()}` };
    await addNotificationChannel(projectRoot, settings, channel);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    projectRootPull = await createNewProjectDir('notification-pull');
    await amplifyPull(projectRootPull, { override: false, emptyDir: true, appId });

    expectLocalAndPulledBackendConfigMatching(projectRoot, projectRootPull);

    // Delete the project now to assert that CFN is able to clean up successfully.
    const { StackId: stackId, Region: region } = getProjectMeta(projectRoot).providers.awscloudformation;
    await deleteProject(projectRoot);

    const stack = await describeCloudFormationStack(stackId, region);
    expect(stack.StackStatus).toEqual('DELETE_COMPLETE');
  });
});
