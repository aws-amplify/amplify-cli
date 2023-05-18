/* eslint-disable spellcheck/spell-checker */
import {
  addAuthIdentityPoolAndUserPoolWithOAuth,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  initJSProjectWithProfile,
  pullProject,
} from '@aws-amplify/amplify-e2e-core';
import { createIDPAndUserPoolWithOAuthSettings, getShortId, importSingleIdentityPoolAndUserPool } from '../import-helpers';
import { AmplifyFrontend } from '@aws-amplify/amplify-cli-core';

describe('amplify pull', () => {
  let initRoot: string;
  let importRoot: string;
  let pullRoot: string;

  beforeEach(async () => {
    initRoot = await createNewProjectDir('inittest');
    pullRoot = await createNewProjectDir('pulltest');
    importRoot = await createNewProjectDir('importtest');
  });

  afterEach(async () => {
    await deleteProject(initRoot);
    await deleteProject(importRoot);
    deleteProjectDir(initRoot);
    deleteProjectDir(pullRoot);
    deleteProjectDir(importRoot);
  });

  it('pull flutter frontend with idp with social providers', async () => {
    await initJSProjectWithProfile(initRoot, {
      disableAmplifyAppCreation: false,
      name: 'integtest',
      envName: 'integtest',
    });

    const settings = createIDPAndUserPoolWithOAuthSettings('inittest', getShortId());
    await addAuthIdentityPoolAndUserPoolWithOAuth(initRoot, settings);
    await amplifyPushAuth(initRoot);

    await initJSProjectWithProfile(importRoot, {
      disableAmplifyAppCreation: false,
      name: 'import',
      envName: 'integtest',
    });
    await importSingleIdentityPoolAndUserPool(importRoot, settings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' });
    await amplifyPushAuth(importRoot);

    const appId = getAppId(importRoot);
    await pullProject(pullRoot, {
      appId,
      envName: 'integtest',
      appType: AmplifyFrontend.flutter,
    });
  });
});
