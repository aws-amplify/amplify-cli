import {
  addNotificationChannel,
  amplifyPull,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  initJSProjectWithProfile,
  removeAllNotificationChannel,
} from '@aws-amplify/amplify-e2e-core';
import {
  getShortId,
} from '../import-helpers';

describe('notification category pull test', () => {
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

  it(`should add and remove the ${testChannel} channel and pull in new directory`, async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);

    const settings = { resourceName: `${projectPrefix}${getShortId()}` };
    await addNotificationChannel(projectRoot, settings, testChannelSelection);

    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    await removeAllNotificationChannel(projectRoot);

    const projectRootPull = await createNewProjectDir('removed-notifications-pull');
    try {
      await amplifyPull(projectRootPull, { override: false, emptyDir: true, appId });
    } finally {
      deleteProjectDir(projectRootPull);
    }
  });
});
