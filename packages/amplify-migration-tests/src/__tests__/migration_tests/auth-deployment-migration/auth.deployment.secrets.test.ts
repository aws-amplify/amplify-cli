import {
  addAuthWithDefaultSocial,
  amplifyPushWithoutCodegen,
  amplifyStatus,
  amplifyStatusWithMigrate,
  amplifyVersion,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  isDeploymentSecretForEnvExists,
} from 'amplify-e2e-core';
import { initJSProjectWithProfileOldDX } from '../../../migration-helpers';

describe('amplify auth add with social', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth-deployment-secrets');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init project, add social migrate and push', async () => {
    // init, add api and push with installed cli
    const envName = 'integtest';
    await amplifyVersion(projRoot, '4.30.0', false);
    await initJSProjectWithProfileOldDX(projRoot, {});
    await addAuthWithDefaultSocial(projRoot, {});
    expect(isDeploymentSecretForEnvExists(projRoot, envName)).toBeFalsy();
    await amplifyPushWithoutCodegen(projRoot);
    expect(isDeploymentSecretForEnvExists(projRoot, envName)).toBeFalsy();

    await amplifyStatusWithMigrate(projRoot, 'Update', true);
    expect(isDeploymentSecretForEnvExists(projRoot, envName)).toBeTruthy();
    await amplifyStatus(projRoot, 'Update', true);
    await amplifyPushWithoutCodegen(projRoot, true);
    expect(isDeploymentSecretForEnvExists(projRoot, envName)).toBeFalsy();
  });
});
