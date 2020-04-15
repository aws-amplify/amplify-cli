import { S3, Amplify } from 'aws-sdk';
import { initJSProjectWithProfile, initIosProjectWithProfile, initAndroidProjectWithProfile, deleteProject, pullProject } from '../init';
import {
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
  getS3StorageBucketName,
  getAWSExportsPath,
  getAWSConfigIOSPath,
  getAmplifyConfigIOSPath,
  getAWSConfigAndroidPath,
  getAmplifyConfigAndroidPath,
} from '../utils';
import { addEnvironment, checkoutEnvironment, removeEnvironment } from '../environment/add-env';
import { addApiWithoutSchema } from '../categories/api';
import { addCodegen } from '../codegen/add';
import { addS3 } from '../categories/storage';
import { amplifyPush } from '../categories/hosting';
import { addAuthWithDefault } from '../categories/auth';
import * as fs from 'fs-extra';
import * as pinpointHelper from '../utils/pinpoint';
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

  // it('should not delete amplify app', async () => {
  //   const projRoot2 = await createNewProjectDir('delete-dep');
  //   const envName = 'testdelete';
  //   await initJSProjectWithProfile(projRoot, {});
  //   await addApiWithoutSchema(projRoot);
  //   const amplifyMeta = getProjectMeta(projRoot);
  //   const meta = amplifyMeta.providers.awscloudformation;
  //   const { AmplifyAppId, Region, StackName, DeploymentBucketName } = meta;
  //   expect(AmplifyAppId).toBeDefined();
  //   await createEnv(AmplifyAppId, envName, Region, StackName, DeploymentBucketName);
  //   await pullProject(projRoot2, { appId: AmplifyAppId, envName });
  //   await initIosProjectWithProfile(projRoot2, {});
  //   await deleteProject(projRoot);
  //   expect(await appExists(AmplifyAppId, Region)).toBeTruthy();
  //   // clean up
  //   await deleteProject(projRoot2);
  //   deleteProjectDir(projRoot2);
  //   await deleteAmplifyApp(AmplifyAppId, Region);
  // });
  it('should delete pinpoint project', async () => {
    await pinpointHelper.initProject(projRoot);
    const pinpointResourceName = await pinpointHelper.addPinpointAnalytics(projRoot);
    await pinpointHelper.pushToCloud(projRoot);
    const amplifyMeta = getProjectMeta(projRoot);
    const pintpointAppId = amplifyMeta.analytics[pinpointResourceName].output.Id;
    let pinpointAppExists = await pinpointHelper.pinpointAppExist(pintpointAppId);
    expect(pinpointAppExists).toBeTruthy();
    await pinpointHelper.amplifyDelete(projRoot);
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
    await expect(await bucketNotExists(deploymentBucketName1)).toBe(true);
    await deleteProject(projRoot);
  });

  it('should delete bucket', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot, {});
    await addS3(projRoot, {});
    await amplifyPush(projRoot);
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
    await deleteBucket(bucketName);
    expect(await bucketNotExists(bucketName)).toBeTruthy();
    await deleteProject(projRoot);
    expect(await bucketNotExists(bucketName)).toBeTruthy();
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
  await deleteProject(projRoot, true);
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

async function deleteAmplifyApp(appId, region) {
  const amplify = new Amplify({ region });
  await amplify.deleteApp({ appId }).promise();
}

async function createEnv(appId, envName, region, stackName, deploymentArtifacts) {
  const amplify = new Amplify({ region });
  await amplify
    .createBackendEnvironment({
      appId,
      environmentName: envName,
      stackName,
      deploymentArtifacts,
    })
    .promise();
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

async function deleteBucket(bucket: string) {
  const s3 = new S3();
  let continuationToken = null;
  const objectKey = [];
  let truncated = false;
  do {
    const results = await s3
      .listObjectsV2({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      })
      .promise();
    results.Contents.forEach(r => {
      objectKey.push({ Key: r.Key });
    });

    continuationToken = results.NextContinuationToken;
    truncated = results.IsTruncated;
  } while (truncated);
  const chunkedResult = _.chunk(objectKey, 1000);
  const deleteReq = chunkedResult
    .map(r => {
      return {
        Bucket: bucket,
        Delete: {
          Objects: r,
          Quiet: true,
        },
      };
    })
    .map(delParams => s3.deleteObjects(delParams).promise());
  await Promise.all(deleteReq);
  await s3
    .deleteBucket({
      Bucket: bucket,
    })
    .promise();
}
