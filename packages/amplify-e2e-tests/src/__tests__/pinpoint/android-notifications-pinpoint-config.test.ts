import { createNewProjectDir, deleteProject, deleteProjectDir, initAndroidProjectWithProfile } from '@aws-amplify/amplify-e2e-core';
import { androidValidate, runPinpointConfigTest } from './notifications-pinpoint-config-util';

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

describe('android notifications pinpoint configuration', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir('notifications-pinpoint');
  });

  afterEach(async () => {
    deleteProjectDir(projectRoot);
  });

  it('should add pinpoint to Android configuration', async () => {
    await initAndroidProjectWithProfile(projectRoot, projectSettings);
    try {
      await runPinpointConfigTest(projectRoot, envName, frontendConfig, androidValidate);
    } finally {
      await deleteProject(projectRoot);
    }
  });
});
