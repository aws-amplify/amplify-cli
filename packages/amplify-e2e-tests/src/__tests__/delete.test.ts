import { S3 } from 'aws-sdk';
import { initJSProjectWithProfile, initIosProjectWithProfile, initAndroidProjectWithProfile, deleteProject } from '../init';
import { createNewProjectDir, deleteProjectDir, getProjectMeta } from '../utils';
import { addEnvironment } from '../environment/add-env';
import { addApiWithoutSchema } from '../categories/api';
import { addCodegen } from '../codegen/add';

describe('amplify delete', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = createNewProjectDir();
  });

  afterEach(() => {
    deleteProjectDir(projRoot);
  });

  it('should delete resources javascript', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await testDeletion(projRoot, {});
  });

  it('should delete resources ios', async () => {
    await initIosProjectWithProfile(projRoot, {});
    await testDeletion(projRoot, { ios: true });
  });

  it('should delete resources android', async () => {
    await initAndroidProjectWithProfile(projRoot, {});
    await testDeletion(projRoot, { android: true });
  });
});

async function testDeletion(projRoot: string, settings: { ios?: Boolean; android?: Boolean }) {
  const amplifyMeta = getProjectMeta(projRoot);
  const meta = amplifyMeta.providers.awscloudformation;
  const deploymentBucketName1 = meta.DeploymentBucketName;
  expect(meta.Region).toBeDefined();
  const { AuthRoleName, UnauthRoleName } = meta;
  await addEnvironment(projRoot, {});
  await addApiWithoutSchema(projRoot);
  await addCodegen(projRoot, settings);
  const deploymentBucketName2 = getProjectMeta(projRoot).providers.awscloudformation.DeploymentBucketName;
  await expect(await bucketExists(deploymentBucketName1)).toBe(true);
  await expect(await bucketExists(deploymentBucketName2)).toBe(true);
  await deleteProject(projRoot, true);
  await expect(await bucketExists(deploymentBucketName1)).toBe(false);
  await expect(await bucketExists(deploymentBucketName2)).toBe(false);
  await expect(AuthRoleName).not.toBeIAMRoleWithArn(AuthRoleName);
  await expect(UnauthRoleName).not.toBeIAMRoleWithArn(UnauthRoleName);
}

async function bucketExists(bucket: string) {
  const s3 = new S3();
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
