import { createNewProjectDir, deleteProject, deleteProjectDir, initFlutterProjectWithProfile } from '@aws-amplify/amplify-e2e-core';
import { flutterValidate, runPinpointConfigTest } from './analytics-pinpoint-config-util';

const envName = 'integtest';
const projectSettings = {
  envName,
  disableAmplifyAppCreation: false,
};
const frontendConfig = {
  frontend: 'flutter',
  config: {
    ResDir: 'lib',
  },
};

describe('flutter analytics pinpoint configuration', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir('notifications-pinpoint');
  });

  afterEach(async () => {
    deleteProjectDir(projectRoot);
  });

  it('should add pinpoint to Flutter configuration', async () => {
    await initFlutterProjectWithProfile(projectRoot, projectSettings);
    try {
      await runPinpointConfigTest(projectRoot, envName, frontendConfig, flutterValidate);
    } finally {
      await deleteProject(projectRoot);
    }
  });
});
