import {
  initJSProjectWithProfile,
  deleteProject,
  addAuthWithDefaultSocial,
  isDeploymentSecretForEnvExists,
  amplifyStatus,
  amplifyStatusWithMigrate,
  amplifyVersion,
  amplifyPushWithoutCodegen,
} from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';

describe('amplify auth add with social', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth-deployment-secrets');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it.only('init project, add social migrate and push', async () => {
    // init, add api and push with installed cli
    const envName = 'integtest';
    await amplifyVersion(projRoot, '4.30.0', false);
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefaultSocial(projRoot, {});
    expect(isDeploymentSecretForEnvExists(projRoot, envName)).toBeUndefined();
    await amplifyPushWithoutCodegen(projRoot);
    expect(isDeploymentSecretForEnvExists(projRoot, envName)).toBeUndefined();

    await amplifyStatusWithMigrate(projRoot, 'No Change', true);
    expect(isDeploymentSecretForEnvExists(projRoot, envName)).toBeDefined();
    await amplifyStatus(projRoot, 'Update', true);
    await amplifyPushWithoutCodegen(projRoot, true);
    expect(isDeploymentSecretForEnvExists(projRoot, envName)).toBeUndefined();
  });
});
