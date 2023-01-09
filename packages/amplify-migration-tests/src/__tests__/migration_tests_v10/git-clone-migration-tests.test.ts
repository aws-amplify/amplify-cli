/**
 * Tests for headless init/pull workflows on git-cloned projects
 * These tests exercise workflows that hosting executes during backend builds
 */

 import {
  addAuthUserPoolOnly,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAmplifyInitConfig, getProjectConfig,
  getSocialProviders,
  getTeamProviderInfo, gitCleanFdx,
  gitCommitAll,
  gitInit,
  nonInteractiveInitWithForcePushAttach
} from '@aws-amplify/amplify-e2e-core';
import { initJSProjectWithProfileV10 } from '../../migration-helpers-v10/init';
  
  describe('attach amplify to git-cloned project', () => {
    const envName = 'test';
    let projRoot: string;
    beforeAll(async () => {
      projRoot = await createNewProjectDir('clone-test');
      await initJSProjectWithProfileV10(projRoot, { envName, disableAmplifyAppCreation: false });
      await addAuthUserPoolOnly(projRoot, {});
      await amplifyPushAuth(projRoot);
      await gitInit(projRoot);
      await gitCommitAll(projRoot);
    });
  
    afterAll(async () => {
      await deleteProject(projRoot);
      deleteProjectDir(projRoot);
    });
  
    test('headless init and forcePush when triggers are added', async () => {
      const { projectName } = getProjectConfig(projRoot);
      const preCleanTpi = getTeamProviderInfo(projRoot);
      await gitCleanFdx(projRoot);

      const socialProviders = getSocialProviders();
      const categoriesConfig = {
        auth: {
          facebookAppIdUserPool: socialProviders.FACEBOOK_APP_ID,
          facebookAppSecretUserPool: socialProviders.FACEBOOK_APP_SECRET,
          googleAppIdUserPool: socialProviders.GOOGLE_APP_ID,
          googleAppSecretUserPool: socialProviders.GOOGLE_APP_SECRET,
          // eslint-disable-next-line spellcheck/spell-checker
          loginwithamazonAppIdUserPool: socialProviders.AMAZON_APP_ID,
          // eslint-disable-next-line spellcheck/spell-checker
          loginwithamazonAppSecretUserPool: socialProviders.AMAZON_APP_SECRET,
        },
      };
      // checks amplify hosting forcePush on existing projects with v10.5.1
      expect( () => nonInteractiveInitWithForcePushAttach(projRoot, getAmplifyInitConfig(projectName, envName), categoriesConfig, true)).not.toThrow();
    });
  });
  