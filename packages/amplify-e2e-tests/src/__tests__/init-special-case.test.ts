import * as specialCaseInit from '../init-special-cases';
import { createNewProjectDir, getBackendAmplifyMeta, deleteProject, deleteProjectDir } from 'amplify-e2e-core';

describe('amplify init', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('special-init');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init without credential files and no new user set up', async () => {
    await specialCaseInit.initWithoutCredentialFileAndNoNewUserSetup(projRoot);
    const meta = getBackendAmplifyMeta(projRoot).providers.awscloudformation;
    expect(meta.Region).toBeDefined();
    const { AuthRoleName, UnauthRoleName, UnauthRoleArn, AuthRoleArn, DeploymentBucketName } = meta;
    expect(UnauthRoleName).toBeIAMRoleWithArn(UnauthRoleArn);
    expect(AuthRoleName).toBeIAMRoleWithArn(AuthRoleArn);
    expect(DeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);
  });
});
