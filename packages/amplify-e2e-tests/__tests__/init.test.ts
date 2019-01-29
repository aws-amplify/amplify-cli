import * as AWS from 'aws-sdk';

import { getProjectMeta, initProject, deleteProject, initProjectWithAccessKey } from '../src/init';
import { createNewProjectDir, deleteProjectDir, getEnvVars } from '../src/utils';
import { access } from 'fs';

describe('amplify init', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
    jest.setTimeout(1000 * 60 * 20); // 20 minutes
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('should init the project', async () => {
    await initProject(projRoot, {});
    const meta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(meta.Region).toBeDefined();
    const {
      AuthRoleName,
      UnauthRoleName,
      Region,
      UnauthRoleArn,
      AuthRoleArn,
      DeploymentBucketName
    } = meta;
    const iam = new AWS.IAM({ region: Region });

    const { Role: unAuthRole } = await iam.getRole({ RoleName: UnauthRoleName }).promise();
    expect(unAuthRole.Arn).toEqual(UnauthRoleArn);

    const { Role: authRole } = await iam.getRole({ RoleName: AuthRoleName }).promise();
    expect(authRole.Arn).toEqual(AuthRoleArn);

    expect(async () => {
      const s3 = new AWS.S3();
      await s3.headBucket({ Bucket: DeploymentBucketName }).promise();
    }).not.toThrow();
  });

  it('should init project without profile', async () => {
    const { ACCESS_KEY_ID, SECRET_ACCESS_KEY } = getEnvVars();
    if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
      throw new Error(
        'Set ACCESS_KEY_ID and SECRET_ACCESS_KEY either in .env file or as Environment variable'
      );
    }
    await initProjectWithAccessKey(projRoot, {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY
    });

    const meta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(meta.Region).toBeDefined();
    const {
      AuthRoleName,
      UnauthRoleName,
      Region,
      UnauthRoleArn,
      AuthRoleArn,
      DeploymentBucketName
    } = meta;

    const iam = new AWS.IAM({ region: Region });

    const { Role: unAuthRole } = await iam.getRole({ RoleName: UnauthRoleName }).promise();
    expect(unAuthRole.Arn).toEqual(UnauthRoleArn);

    const { Role: authRole } = await iam.getRole({ RoleName: AuthRoleName }).promise();
    expect(authRole.Arn).toEqual(AuthRoleArn);

    expect(async () => {
      const s3 = new AWS.S3();
      await s3.headBucket({ Bucket: DeploymentBucketName }).promise();
    }).not.toThrow();
  });
});
