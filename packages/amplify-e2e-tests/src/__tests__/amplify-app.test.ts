import { amplifyAppAndroid, amplifyAppIos, amplifyAppAngular } from '../amplify-app-helpers/amplify-app-setup';
import { createNewProjectDir, deleteProjectDir, isCI } from '@aws-amplify/amplify-e2e-core';
import { AmplifyFrontend } from '@aws-amplify/amplify-cli-core';
import {
  validateProject,
  validateProjectConfig,
  validateApi,
  validateBackendConfig,
  validateFeatureFlags,
} from '../amplify-app-helpers/amplify-app-validation';

describe('amplify-app platform tests', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('amplify-app');
  });

  afterEach(() => {
    deleteProjectDir(projRoot);
  });

  jest.setTimeout(1000 * 60 * 30); // 30 minutes is enough as push operations are taking time

  it('should set up an android project', async () => {
    await amplifyAppAndroid(projRoot);
    validateProject(projRoot, AmplifyFrontend.android);
    validateProjectConfig(projRoot, AmplifyFrontend.android);
    validateApi(projRoot);
    validateBackendConfig(projRoot);
    validateFeatureFlags(projRoot);
  });

  it('should setup an iOS project', async () => {
    // disable this test locally to prevent execution of
    // amplify-xcode in an empty folder.
    // TODO: copy a valid Xcode project before executing this test
    if (!isCI()) {
      return;
    }
    await amplifyAppIos(projRoot);
    validateProject(projRoot, AmplifyFrontend.ios);
    validateProjectConfig(projRoot, AmplifyFrontend.ios);
    validateApi(projRoot);
    validateBackendConfig(projRoot);
    validateFeatureFlags(projRoot);
  });

  it('should set up a angular project', async () => {
    await amplifyAppAngular(projRoot);
    validateProject(projRoot, AmplifyFrontend.javascript);
    validateProjectConfig(projRoot, AmplifyFrontend.javascript, 'angular');
    validateApi(projRoot);
    validateBackendConfig(projRoot);
    validateFeatureFlags(projRoot);
  });
});
