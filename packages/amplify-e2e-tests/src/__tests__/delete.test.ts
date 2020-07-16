import { S3, Amplify } from 'aws-sdk';
import { initJSProjectWithProfile, initIosProjectWithProfile, initAndroidProjectWithProfile, deleteProject } from 'amplify-e2e-core';
import {
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
  getS3StorageBucketName,
  getAWSConfigIOSPath,
  getAmplifyConfigIOSPath,
  getAWSConfigAndroidPath,
  getAmplifyConfigAndroidPath,
  bucketNotExists,
  deleteS3Bucket,
} from 'amplify-e2e-core';
import { addEnvironment, checkoutEnvironment, removeEnvironment } from '../environment/add-env';
import { addApiWithoutSchema } from 'amplify-e2e-core';
import { addCodegen } from '../codegen/add';
import { addS3 } from 'amplify-e2e-core';
import { amplifyPushWithoutCodegen } from 'amplify-e2e-core';
import { addAuthWithDefault } from 'amplify-e2e-core';
import * as fs from 'fs-extra';
import { initProject, addPinpointAnalytics, pushToCloud, pinpointAppExist, amplifyDelete } from 'amplify-e2e-core';
import { getAWSExportsPath } from '../aws-exports/awsExports';
import _ from 'lodash';

describe('amplify delete', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('delete');
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

  it('should delete pinpoint project', async () => {
    await initProject(projRoot);
    const pinpointResourceName = await addPinpointAnalytics(projRoot);
    await pushToCloud(projRoot);
    const amplifyMeta = getProjectMeta(projRoot);
    const pintpointAppId = amplifyMeta.analytics[pinpointResourceName].output.Id;
    let pinpointAppExists = await pinpointAppExist(pintpointAppId);
    expect(pinpointAppExists).toBeTruthy();
    await amplifyDelete(projRoot);
    await timeout(4 * 1000);
    pinpointAppExists = await pinpointAppExist(pintpointAppId);
    expect(pinpointAppExists).toBeFalsy();
  });

  it('should remove enviroment', async () => {
    await initJSProjectWithProfile(projRoot, { envName: 'testdev' });
    await addEnvironment(projRoot, { envName: 'testprod' });
    const amplifyMeta = getProjectMeta(projRoot);
    const meta = amplifyMeta.providers.awscloudformation;
    const deploymentBucketName1 = meta.DeploymentBucketName;
    await expect(await bucketExists(deploymentBucketName1)).toBe(true);
    await checkoutEnvironment(projRoot, { envName: 'testdev' });
    await removeEnvironment(projRoot, { envName: 'testprod' });
    await expect(await bucketNotExists(deploymentBucketName1)).toBe(true);
    await deleteProject(projRoot);
  });

  it('should delete bucket', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot, {});
    await addS3(projRoot, {});
    await amplifyPushWithoutCodegen(projRoot);
    const bucketName = getS3StorageBucketName(projRoot);
    await putFiles(bucketName);
    expect(await bucketExists(bucketName)).toBeTruthy();
    await deleteProject(projRoot);
    expect(await bucketNotExists(bucketName)).toBeTruthy();
  });
  it('should try deleting unavailable bucket but not fail', async () => {
    await initJSProjectWithProfile(projRoot, {});
    const amplifyMeta = getProjectMeta(projRoot);
    const meta = amplifyMeta.providers.awscloudformation;
    const bucketName = meta.DeploymentBucketName;
    expect(await bucketExists(bucketName)).toBeTruthy();
    await deleteS3Bucket(bucketName);
    await deleteProject(projRoot);
  });
});

async function testDeletion(projRoot: string, settings: { ios?: Boolean; android?: Boolean }) {
  const amplifyMeta = getProjectMeta(projRoot);
  const meta = amplifyMeta.providers.awscloudformation;
  const deploymentBucketName1 = meta.DeploymentBucketName;
  expect(meta.Region).toBeDefined();
  const { AuthRoleName, UnauthRoleName } = meta;
  await addEnvironment(projRoot, { envName: 'test' });
  await addApiWithoutSchema(projRoot);
  await addCodegen(projRoot, settings);
  const deploymentBucketName2 = getProjectMeta(projRoot).providers.awscloudformation.DeploymentBucketName;
  expect(await bucketExists(deploymentBucketName1)).toBe(true);
  expect(await bucketExists(deploymentBucketName2)).toBe(true);
  if (meta.AmplifyAppId) expect(await appExists(meta.AmplifyAppId, meta.Region)).toBe(true);
  await deleteProject(projRoot);
  if (meta.AmplifyAppId) expect(await appExists(meta.AmplifyAppId, meta.Region)).toBe(false);
  expect(await bucketNotExists(deploymentBucketName1)).toBe(true);
  expect(await bucketNotExists(deploymentBucketName2)).toBe(true);
  expect(AuthRoleName).not.toBeIAMRoleWithArn(AuthRoleName);
  expect(UnauthRoleName).not.toBeIAMRoleWithArn(UnauthRoleName);
  // check that config/exports file was deleted
  if (settings.ios) {
    expect(fs.existsSync(getAWSConfigIOSPath(projRoot))).toBe(false);
    expect(fs.existsSync(getAmplifyConfigIOSPath(projRoot))).toBe(false);
  } else if (settings.android) {
    expect(fs.existsSync(getAWSConfigAndroidPath(projRoot))).toBe(false);
    expect(fs.existsSync(getAmplifyConfigAndroidPath(projRoot))).toBe(false);
  } else {
    expect(fs.existsSync(getAWSExportsPath(projRoot))).toBe(false);
  }
}

async function putFiles(bucket: string, count = 1001) {
  const s3 = new S3();
  const s3Params = [...Array(count)].map((_, num) => {
    return {
      Bucket: bucket,
      Body: 'dummy body',
      Key: `${num}.txt`,
    };
  });
  await Promise.all(s3Params.map(p => s3.putObject(p).promise()));
}

async function bucketExists(bucket: string) {
  const s3 = new S3();
  const params = {
    Bucket: bucket,
  };
  try {
    await s3.headBucket(params).promise();
    return true;
  } catch (error) {
    if (error.statusCode === 404) {
      return false;
    }
    throw error;
  }
}

async function appExists(appId: string, region: string) {
  const amplify = new Amplify({ region });
  try {
    await amplify.getApp({ appId }).promise();
    return true;
  } catch (ex) {
    return false;
  }
}

async function timeout(timeout: number) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, timeout);
  });
}
