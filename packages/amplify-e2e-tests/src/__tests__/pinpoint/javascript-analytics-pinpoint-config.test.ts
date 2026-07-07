import { createNewProjectDir, deleteProject, deleteProjectDir, initJSProjectWithProfile } from '@aws-amplify/amplify-e2e-core';
import { javascriptValidate, runPinpointConfigTest } from './analytics-pinpoint-config-util';

const envName = 'integtest';
const projectSettings = {
  envName,
  disableAmplifyAppCreation: false,
};
const frontendConfig = {
  frontend: 'javascript',
};

describe('javascript analytics pinpoint configuration', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir('notifications-pinpoint');
    await initJSProjectWithProfile(projectRoot, projectSettings);
  });

  afterEach(async () => {
    await deleteProject(projectRoot);
    deleteProjectDir(projectRoot);
  });

  it('should add pinpoint to JS configuration', async () => {
    await runPinpointConfigTest(projectRoot, envName, frontendConfig, javascriptValidate);
  });
});
