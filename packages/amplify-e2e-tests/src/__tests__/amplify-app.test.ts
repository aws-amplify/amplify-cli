import {
  amplifyAppAndroid,
  amplifyAppIos,
  amplifyAppAngular,
  amplifyAppReact,
  amplifyModelgen,
  amplifyPush,
} from '../amplify-app-helpers/amplify-app-setup';
import { createNewProjectDir, deleteProjectDir } from '../utils';
import { deleteProject } from '../init';
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
  beforeEach(() => {
    projRoot = createNewProjectDir();
  });

  afterEach(async () => {
    deleteProjectDir(projRoot);
  });

  jest.setTimeout(600000);

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
    await amplifyModelgen(projRoot);
    validateModelgen(projRoot);
    await amplifyPush(projRoot);
    validateAmplifyPush(projRoot);
    await deleteProject(projRoot);
  });
});
