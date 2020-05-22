import * as specialCaseInit from '../init-special-cases';
import { createNewProjectDir, deleteProjectDir, getProjectMeta } from 'amplify-e2e-core';

describe('amplify init', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('special-init');
  });

  afterEach(async () => {
    deleteProjectDir(projRoot);
  });

  it('init without credential files and no new user set up', async () => {
    await specialCaseInit.initWithoutCredentialFileAndNoNewUserSetup(projRoot);
    const meta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(meta.Region).toBeDefined();
    const { AuthRoleName, UnauthRoleName, UnauthRoleArn, AuthRoleArn, DeploymentBucketName } = meta;
    expect(UnauthRoleName).toBeIAMRoleWithArn(UnauthRoleArn);
    expect(AuthRoleName).toBeIAMRoleWithArn(AuthRoleArn);
    expect(DeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);
  });
});
