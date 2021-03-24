import _ from 'lodash';
import {
  addSMSNotification,
  amplifyPull,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  describeCloudFormationStack,
  getAppId,
  getProjectMeta,
  getTeamProviderInfo,
  initJSProjectWithProfile,
} from 'amplify-e2e-core';
import { checkoutEnvironment, removeEnvironment } from '../environment/env';
import { getShortId } from '../import-helpers';

const profileName = 'amplify-integ-test-user';

describe('notification category test', () => {
  const projectPrefix = 'notification';

  const projectSettings = {
    name: projectPrefix,
  };

  let projectRoot: string;
  let ignoreProjectDeleteErrors: boolean = false;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir(projectPrefix);
    ignoreProjectDeleteErrors = false;
  });

  afterEach(async () => {
    try {
      await deleteProject(projectRoot);
    } catch (error) {
      // In some tests where project initialization fails it can lead to errors on cleanup which we
      // can ignore if set by the test
      if (!ignoreProjectDeleteErrors) {
        throw error;
      }
    }
    deleteProjectDir(projectRoot);
  });

  it('add notifications and pull to empty dir to compare values', async () => {
    await initJSProjectWithProfile(projectRoot, {
      ...projectSettings,
      disableAmplifyAppCreation: false,
    });

    const shortId = getShortId();

    const settings = {
      resourceName: `${projectPrefix}${shortId}`,
    };

    await addSMSNotification(projectRoot, settings);

    await amplifyPushAuth(projectRoot);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    let projectRootPull;

    try {
      projectRootPull = await createNewProjectDir('notification-pull');

      await amplifyPull(projectRootPull, { override: false, emptyDir: true, appId });

      expectLocalAndPulledTeamNotificationMatching(projectRoot, projectRootPull);

      // Delete the project now to assert that CFN is able to clean up successfully.
      const { StackId: stackId, Region: region } = getProjectMeta(projectRoot).providers.awscloudformation;
      await deleteProject(projectRoot);
      ignoreProjectDeleteErrors = true;
      const stack = await describeCloudFormationStack(stackId, region);
      expect(stack.StackStatus).toEqual('DELETE_COMPLETE');
    } finally {
      deleteProjectDir(projectRootPull);
    }
  });

  const expectLocalAndPulledTeamNotificationMatching = (projectRoot: string, pulledProjectRoot: string) => {
    const team = getTeamProviderInfo(projectRoot);
    const pulledTeam = getTeamProviderInfo(pulledProjectRoot);

    const pinpointApp = _.get(team, ['integtest', 'categories', 'notifications']);
    const pulledPinpointApp = _.get(pulledTeam, ['integtest', 'categories', 'notifications']);

    expect(pinpointApp).toMatchObject(pulledPinpointApp);
  };
});
