import { CloudFront } from 'aws-sdk';
import { amplifyPublishWithoutUpdate, createReactTestProject, resetBuildCommand } from 'amplify-e2e-core';

import { initJSProjectWithProfile, deleteProject, deleteS3Bucket } from 'amplify-e2e-core';
import { addPRODHosting, removeHosting, amplifyPushWithoutCodegen } from 'amplify-e2e-core';
import { deleteProjectDir, getProjectMeta } from 'amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('amplify add hosting', () => {
  let projRoot: string;

  beforeAll(async () => {
    projRoot = await createReactTestProject();
    await initJSProjectWithProfile(projRoot, {});
    await addPRODHosting(projRoot);
    await amplifyPushWithoutCodegen(projRoot);
  });

  afterAll(async () => {
    const projectMeta = getProjectMeta(projRoot);
    const hostingBucket = projectMeta?.hosting?.S3AndCloudFront?.output?.HostingBucketName;
    await removeHosting(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    if (hostingBucket) {
      // Once the Hosting bucket is removed automatically we should get rid of this.
      await deleteS3Bucket(hostingBucket);
    }
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('push creates correct amplify artifacts', async () => {
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'S3AndCloudFront'))).toBe(true);
    const projectMeta = getProjectMeta(projRoot);
    expect(projectMeta.hosting).toBeDefined();
    expect(projectMeta.hosting.S3AndCloudFront).toBeDefined(); //CloudFrontDistributionID
    expect(projectMeta.hosting.S3AndCloudFront.output.CloudFrontDistributionID).toBeDefined();

    const cloudFrontDistribution = await getCloudFrontDistribution(projectMeta.hosting.S3AndCloudFront.output.CloudFrontDistributionID);
    expect(cloudFrontDistribution.DistributionConfig.HttpVersion).toEqual('http2');
  });

  it('publish successfully', async () => {
    let error;
    try {
      await amplifyPublishWithoutUpdate(projRoot);
    } catch (err) {
      error = err;
    }
    expect(error).not.toBeDefined();
  });

  it('publish throws error if build command is missing', async () => {
    const currentBuildCommand = resetBuildCommand(projRoot, '');
    let error;
    try {
      await amplifyPublishWithoutUpdate(projRoot);
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
    expect(error.message).toEqual('Process exited with non zero exit code 1');
    resetBuildCommand(projRoot, currentBuildCommand);
  });
});

async function getCloudFrontDistribution(cloudFrontDistributionID: string) {
  const cloudFrontClient = new CloudFront();
  const getDistributionResult = await cloudFrontClient
    .getDistribution({
      Id: cloudFrontDistributionID,
    })
    .promise();
  return getDistributionResult.Distribution;
}
