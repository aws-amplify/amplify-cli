import {
  addNotificationChannel,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  updateNotificationChannel,
} from '@aws-amplify/amplify-e2e-core';
import { getShortId } from '../import-helpers';

describe('notification category update test', () => {
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

  it(`should add and update the ${testChannel} channel`, async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);

    const settings = { resourceName: `${projectPrefix}${getShortId()}` };
    await addNotificationChannel(projectRoot, settings, testChannelSelection);
    await updateNotificationChannel(projectRoot, testChannelSelection, false);
  });
});
