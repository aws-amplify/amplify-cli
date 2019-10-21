require('../src/aws-matchers/'); // custom matcher for assertion
const path = require('path');
import fs from 'fs-extra';
import * as AWS from 'aws-sdk';
import {
  initJSProjectWithProfile,
  initIosProjectWithProfile,
  initAndroidProjectWithProfile,
  deleteProject,
  amplifyPush,
} from '../src/init';
import { createNewProjectDir, deleteProjectDir, getProjectMeta } from '../src/utils';
import { addEnvironment } from '../src/environment/add-env';
import { addApiWithoutSchema } from '../src/categories/api';
import { addCodegen } from '../src/codegen/add';

describe('amplify delete', () => {
  let projRoot: string;
  beforeEach(async () => {
    jest.setTimeout(1000 * 60 * 60); // 1 hour
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

async function testDeletion(projRoot, settings) {
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
  await expect(AuthRoleName).not.toBeIAMRoleWithArn();
  await expect(UnauthRoleName).not.toBeIAMRoleWithArn();
}

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
