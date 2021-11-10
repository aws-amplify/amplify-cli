import { CloudFront } from 'aws-sdk';
import { amplifyPublishWithoutUpdate, amplifyPublishWithUpdate, createReactTestProject, resetBuildCommand } from 'amplify-e2e-core';

import { initJSProjectWithProfile, deleteProject, deleteS3Bucket } from 'amplify-e2e-core';
import { addPRODHosting, removePRODCloudFront, removeHosting, amplifyPushWithoutCodegen } from 'amplify-e2e-core';
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
    expect(projectMeta.hosting.S3AndCloudFront).toBeDefined();
    expect(projectMeta.hosting.S3AndCloudFront.output.CloudFrontDistributionID).toBeDefined();

    const cloudFrontDistribution = await getCloudFrontDistribution(projectMeta.hosting.S3AndCloudFront.output.CloudFrontDistributionID);
    expect(cloudFrontDistribution.DistributionConfig.HttpVersion).toEqual('http2');
  });

  it('publish successfully', async () => {
    let error;
    try {
      // root stack updated
      await amplifyPublishWithUpdate(projRoot);
    } catch (err) {
      error = err;
    }
    expect(error).not.toBeDefined();
  });

  it('publish throws error if build command is missing', async () => {
    const currentBuildCommand = resetBuildCommand(projRoot, '');
    let error;
    try {
      await amplifyPublishWithUpdate(projRoot);
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
    expect(error.message).toEqual('Process exited with non zero exit code 1');
    resetBuildCommand(projRoot, currentBuildCommand);
  });

  it('correctly updates hosting meta output after CloudFront is removed', async () => {
    await removePRODCloudFront(projRoot);
    await amplifyPushWithoutCodegen(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'S3AndCloudFront'))).toBe(true);
    const projectMeta = getProjectMeta(projRoot);
    expect(projectMeta.hosting).toBeDefined();
    expect(projectMeta.hosting.S3AndCloudFront).toBeDefined();
    expect(projectMeta.hosting.S3AndCloudFront.output.CloudFrontSecureURL).not.toBeDefined();
    expect(projectMeta.hosting.S3AndCloudFront.output.CloudFrontOriginAccessIdentity).not.toBeDefined();
    expect(projectMeta.hosting.S3AndCloudFront.output.CloudFrontDistributionID).not.toBeDefined();
    expect(projectMeta.hosting.S3AndCloudFront.output.CloudFrontDomainName).not.toBeDefined();
    expect(projectMeta.hosting.S3AndCloudFront.output.WebsiteURL).toBeDefined();
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
