import { S3 } from 'aws-sdk';
import { initJSProjectWithProfile, initIosProjectWithProfile, initAndroidProjectWithProfile, deleteProject } from '../init';
import {
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
  getAWSExportsPath,
  getAWSConfigIOSPath,
  getAmplifyConfigIOSPath,
  getAWSConfigAndroidPath,
  getAmplifyConfigAndroidPath,
} from '../utils';
import { addEnvironment, checkoutEnvironment, removeEnvironment } from '../environment/add-env';
import { addApiWithoutSchema } from '../categories/api';
import { addCodegen } from '../codegen/add';
import * as fs from 'fs-extra';
import * as pinpointHelper from '../utils/pinpoint';

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
    await pinpointHelper.initProject(projRoot, true);
    const pinpointResourceName = await pinpointHelper.addPinpointAnalytics(projRoot, true);
    await pinpointHelper.pushToCloud(projRoot, true);
    const amplifyMeta = getProjectMeta(projRoot);
    const pintpointAppId = amplifyMeta.analytics[pinpointResourceName].output.Id;
    let pinpointAppExists = await pinpointHelper.pinpointAppExist(pintpointAppId);
    expect(pinpointAppExists).toBeTruthy();
    await pinpointHelper.amplifyDelete(projRoot, true);
    pinpointAppExists = await pinpointHelper.pinpointAppExist(pintpointAppId);
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
    await expect(await bucketExists(deploymentBucketName1)).toBe(false);
    await deleteProject(projRoot, true);
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
  await deleteProject(projRoot, true);
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

async function bucketNotExists(bucket: string) {
  const s3 = new S3();
  const params = {
    Bucket: bucket,
    $waiter: { maxAttempts: 10 },
  };
  try {
    await s3.waitFor('bucketNotExists', params).promise();
    return true;
  } catch (error) {
    if (error.statusCode === 200) {
      return false;
    }
    throw error;
  }
}
