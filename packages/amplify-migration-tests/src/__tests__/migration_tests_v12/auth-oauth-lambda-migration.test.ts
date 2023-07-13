import {
  AddAuthUserPoolOnlyWithOAuthSettings,
  amplifyPushForce,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  getSocialIdpProvider,
} from '@aws-amplify/amplify-e2e-core';
import { allowedVersionsToMigrateFrom, versionCheck } from '../../migration-helpers';
import { expectCorrectOAuthSettings, setupOgProjectWithAuth } from '../../migration-helpers-v12/auth-helpers/utilities';
import { initJSProjectWithProfileV12 } from '../../migration-helpers-v12/init';
import { pullPushForceWithLatestCodebaseValidateParameterAndCfnDrift } from '../../migration-helpers/utils';

const defaultsSettings = {
  name: 'authTest',
  disableAmplifyAppCreation: false,
};

describe('amplify add auth...', () => {
  let projRoot: string;
  let oAuthSettings: AddAuthUserPoolOnlyWithOAuthSettings;
  const projectName: string = 'oauthlambdaRemove';

  beforeAll(async () => {
    const migrateFromVersion = { v: 'uninitialized' };
    const migrateToVersion = { v: 'uninitialized' };
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
    console.log(`Test migration from: ${migrateFromVersion.v} to ${migrateToVersion.v}`);
    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
  });

  beforeEach(async () => {
    projRoot = await createNewProjectDir(projectName);
    await initJSProjectWithProfileV12(projRoot, defaultsSettings);
    // creates a userPool only with OauthSetting and pushes Auth
    oAuthSettings = await setupOgProjectWithAuth(projRoot, { name: 'ogauimphea' });
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('...should init an Js project and add Oauth settings with userpool', async () => {
    const projRoot2 = await createNewProjectDir(`${projectName}2`);
    // using amplify push force here as changes are only related to build files
    await pullPushForceWithLatestCodebaseValidateParameterAndCfnDrift(projRoot, projRoot2);
  });

  it('...should preserve Oauth settings on force push with new', async () => {
    await amplifyPushForce(projRoot, true);
    await expectCorrectOAuthSettings(projRoot, oAuthSettings);
  });
});
