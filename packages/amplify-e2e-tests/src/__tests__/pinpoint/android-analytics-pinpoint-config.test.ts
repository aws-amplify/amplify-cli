import { createNewProjectDir, deleteProject, deleteProjectDir, initAndroidProjectWithProfile } from '@aws-amplify/amplify-e2e-core';
import { androidValidate, runPinpointConfigTest } from './analytics-pinpoint-config-util';

const envName = 'integtest';
const projectSettings = {
  envName,
  disableAmplifyAppCreation: false,
};
const frontendConfig = {
  frontend: 'android',
  config: {
    ResDir: 'app/src/main/res',
  },
};

describe('android analytics pinpoint configuration', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir('notifications-pinpoint');
    await initAndroidProjectWithProfile(projectRoot, projectSettings);
  });

  afterEach(async () => {
    await deleteProject(projectRoot);
    deleteProjectDir(projectRoot);
  });

  it('should add pinpoint to Android configuration', async () => {
    await runPinpointConfigTest(projectRoot, envName, frontendConfig, androidValidate);
  });
});
