import {
  addNotificationChannel,
  amplifyStatus,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import { addEnvironment, listEnvironment } from '../environment/env';
import {
  getShortId,
} from '../import-helpers';

describe('notification category test - SMS', () => {
  const testChannel = 'SMS';
  const testChannelSelection = 'SMS';
  const projectPrefix = `notification${testChannel}`.substring(0, 19);
  const projectSettings = {
    name: projectPrefix,
    disableAmplifyAppCreation: false,
  };

  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir(projectPrefix);
  });

  afterEach(async () => {
    await deleteProject(projectRoot);
    deleteProjectDir(projectRoot);
  });

  // inline channels
  it(`should add and remove the ${testChannel} channel correctly when no pinpoint is configured`, async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);

    // add sms channel
    const settings = { resourceName: `${projectPrefix}${getShortId()}` };
    await addNotificationChannel(projectRoot, settings, testChannelSelection);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    // expect that Notifications, Analytics, and Auth categories are shown
    await amplifyStatus(projectRoot, 'Notifications');
    await amplifyStatus(projectRoot, 'Analytics');
    await amplifyStatus(projectRoot, 'Auth');

    await addEnvironment(projectRoot, { envName: 'prod' });
    await listEnvironment(projectRoot, { numEnv: 2 });

    // expect that Notifications, Analytics, and Auth categories are shown in the new env
    await amplifyStatus(projectRoot, 'Notifications');
    await amplifyStatus(projectRoot, 'Analytics');
    await amplifyStatus(projectRoot, 'Auth');
  });
});
