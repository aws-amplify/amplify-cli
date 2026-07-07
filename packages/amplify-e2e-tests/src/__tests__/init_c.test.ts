/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import {
  deleteProject,
  initProjectWithAccessKey,
  initNewEnvWithAccessKey,
  createNewProjectDir,
  deleteProjectDir,
  getEnvVars,
  getProjectMeta,
} from '@aws-amplify/amplify-e2e-core';

describe('amplify init c', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('init');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('should init project without profile', async () => {
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = getEnvVars();
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new Error('Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY either in .env file or as Environment variable');
    }
    await initProjectWithAccessKey(projRoot, {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    });

    const meta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(meta.Region).toBeDefined();
    const { AuthRoleName, UnauthRoleName, UnauthRoleArn, AuthRoleArn, DeploymentBucketName } = meta;

    await expect(UnauthRoleName).toBeIAMRoleWithArn(UnauthRoleArn);
    await expect(AuthRoleName).toBeIAMRoleWithArn(AuthRoleArn);
    await expect(DeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);

    // init new env
    await initNewEnvWithAccessKey(projRoot, {
      envName: 'foo',
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    });
    const newEnvMeta = getProjectMeta(projRoot).providers.awscloudformation;

    const {
      AuthRoleName: newEnvAuthRoleName,
      UnauthRoleName: newEnvUnAuthRoleName,
      UnauthRoleArn: newEnvUnauthRoleArn,
      AuthRoleArn: newEnvAuthRoleArn,
      DeploymentBucketName: newEnvDeploymentBucketName,
    } = newEnvMeta;

    expect(newEnvAuthRoleName).not.toEqual(AuthRoleName);
    expect(UnauthRoleName).not.toEqual(newEnvUnAuthRoleName);
    expect(UnauthRoleArn).not.toEqual(newEnvUnauthRoleArn);
    expect(AuthRoleArn).not.toEqual(newEnvAuthRoleArn);
    expect(DeploymentBucketName).not.toEqual(newEnvDeploymentBucketName);

    await expect(newEnvUnAuthRoleName).toBeIAMRoleWithArn(newEnvUnauthRoleArn);
    await expect(newEnvAuthRoleName).toBeIAMRoleWithArn(newEnvAuthRoleArn);
    await expect(newEnvDeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);
  });
});
