import { createNewProjectDir, deleteProject, deleteProjectDir, initIosProjectWithProfile } from '@aws-amplify/amplify-e2e-core';
import { iosValidate, runPinpointConfigTest } from './analytics-pinpoint-config-util';

const envName = 'integtest';
const projectSettings = {
  envName,
  disableAmplifyAppCreation: false,
};
const frontendConfig = {
  frontend: 'ios',
};

describe('ios analytics pinpoint configuration', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir('notifications-pinpoint');
    await initIosProjectWithProfile(projectRoot, projectSettings);
  });

  afterEach(async () => {
    await deleteProject(projectRoot);
    deleteProjectDir(projectRoot);
  });

  it('should add pinpoint to iOS configuration', async () => {
    await runPinpointConfigTest(projectRoot, envName, frontendConfig, iosValidate);
  });
});
