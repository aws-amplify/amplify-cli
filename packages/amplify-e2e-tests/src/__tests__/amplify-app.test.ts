import {
  amplifyAppAndroid,
  amplifyAppIos,
  amplifyAppAngular,
  amplifyAppReact,
  amplifyModelgen,
  amplifyPush,
  addIntegAccountInConfig,
} from '../amplify-app-helpers/amplify-app-setup';
import { createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';
import { deleteProject } from 'amplify-e2e-core';
import {
  validateProject,
  validateProjectConfig,
  validateApi,
  validateBackendConfig,
  validateModelgen,
  validateAmplifyPush,
} from '../amplify-app-helpers/amplify-app-validation';

describe('amplify-app platform tests', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('amplify-app');
  });

  afterEach(() => {
    deleteProjectDir(projRoot);
  });

  jest.setTimeout(1000 * 60 * 30); // 30 minutes is suffice as push operations are taking time

  it('should set up an android project', async () => {
    await amplifyAppAndroid(projRoot);
    validateProject(projRoot, 'android');
    validateProjectConfig(projRoot, 'android');
    validateApi(projRoot);
    validateBackendConfig(projRoot);
  });

  it('should setup an iOS project', async () => {
    await amplifyAppIos(projRoot);
    validateProject(projRoot, 'ios');
    validateProjectConfig(projRoot, 'ios');
    validateApi(projRoot);
    validateBackendConfig(projRoot);
  });

  it('should set up a angular project', async () => {
    await amplifyAppAngular(projRoot);
    validateProject(projRoot, 'javascript');
    validateProjectConfig(projRoot, 'javascript', 'angular');
    validateApi(projRoot);
    validateBackendConfig(projRoot);
  });

  it('should set up a react project and run scripts', async () => {
    await amplifyAppReact(projRoot);
    validateProject(projRoot, 'javascript');
    validateProjectConfig(projRoot, 'javascript', 'react');
    validateApi(projRoot);
    validateBackendConfig(projRoot);
    await addIntegAccountInConfig(projRoot);
    await amplifyModelgen(projRoot);
    validateModelgen(projRoot);
    await amplifyPush(projRoot);
    validateAmplifyPush(projRoot);
    await deleteProject(projRoot);
  });
});
