require('../src/aws-matchers/'); // custom matcher for assertion

import * as AWS from 'aws-sdk';
import { initProjectWithProfile, deleteProject } from '../src/init';
import { createNewProjectDir, deleteProjectDir, getProjectMeta } from '../src/utils';

describe('amplify delete', () => {
  let projRoot: string;
  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 60); // 1 hour
    projRoot = createNewProjectDir();
    await initProjectWithProfile(projRoot, {});
  });

  afterAll(() => {
    deleteProjectDir(projRoot);
  });

  it('should delete resources', async () => {
    const amplifyMeta = getProjectMeta(projRoot);
    const meta = amplifyMeta.providers.awscloudformation;
    expect(meta.Region).toBeDefined();
    const { AuthRoleName, UnauthRoleName } = meta;

    await deleteProject(projRoot, true);
    await expect(await bucketExists(meta.DeploymentBucketName)).toBe(false);
    await expect(AuthRoleName).not.toBeIAMRoleWithArn();
    await expect(UnauthRoleName).not.toBeIAMRoleWithArn();
  });
});

async function bucketExists(bucket: string) {
  const s3 = new AWS.S3();
  const options = {
    Bucket: bucket,
  };
  try {
    await s3.headBucket(options).promise();
    return true;
  } catch (error) {
    if (error.statusCode === 404) {
      return false;
    }
    throw error;
  }
}
