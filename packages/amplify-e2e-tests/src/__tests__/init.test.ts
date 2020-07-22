import {
  initJSProjectWithProfile,
  deleteProject,
  initProjectWithAccessKey,
  initNewEnvWithAccessKey,
  initNewEnvWithProfile,
} from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir, getEnvVars, getProjectMeta } from 'amplify-e2e-core';

describe('amplify init', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('init');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('should init the project and create new env', async () => {
    await initJSProjectWithProfile(projRoot, {});
    const meta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(meta.Region).toBeDefined();
    const { AuthRoleName, UnauthRoleName, UnauthRoleArn, AuthRoleArn, DeploymentBucketName } = meta;

    expect(UnauthRoleName).toBeIAMRoleWithArn(UnauthRoleArn);
    expect(AuthRoleName).toBeIAMRoleWithArn(AuthRoleArn);
    expect(DeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);

    // init new env
    await initNewEnvWithProfile(projRoot, { envName: 'foo' });
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

    expect(newEnvUnAuthRoleName).toBeIAMRoleWithArn(newEnvUnauthRoleArn);
    expect(newEnvAuthRoleName).toBeIAMRoleWithArn(newEnvAuthRoleArn);
    expect(newEnvDeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);
  });

  it('should init project without profile', async () => {
    const { ACCESS_KEY_ID, SECRET_ACCESS_KEY } = getEnvVars();
    if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
      throw new Error('Set ACCESS_KEY_ID and SECRET_ACCESS_KEY either in .env file or as Environment variable');
    }
    await initProjectWithAccessKey(projRoot, {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    });

    const meta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(meta.Region).toBeDefined();
    const { AuthRoleName, UnauthRoleName, UnauthRoleArn, AuthRoleArn, DeploymentBucketName } = meta;

    expect(UnauthRoleName).toBeIAMRoleWithArn(UnauthRoleArn);
    expect(AuthRoleName).toBeIAMRoleWithArn(AuthRoleArn);
    expect(DeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);

    // init new env
    await initNewEnvWithAccessKey(projRoot, {
      envName: 'foo',
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
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

    expect(newEnvUnAuthRoleName).toBeIAMRoleWithArn(newEnvUnauthRoleArn);
    expect(newEnvAuthRoleName).toBeIAMRoleWithArn(newEnvAuthRoleArn);
    expect(newEnvDeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);
  });
});
