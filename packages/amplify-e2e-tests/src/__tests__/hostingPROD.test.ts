import { CloudFrontClient, GetDistributionCommand } from '@aws-sdk/client-cloudfront';
import {
  amplifyPublishWithoutUpdate,
  createReactTestProject,
  resetBuildCommand,
  initJSProjectWithProfile,
  deleteProject,
  deleteS3Bucket,
  addPRODHosting,
  removeHosting,
  amplifyPushWithoutCodegen,
  deleteProjectDir,
  getProjectMeta,
} from '@aws-amplify/amplify-e2e-core';

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
    await deleteProject(projRoot);
    if (hostingBucket) {
      // Once the Hosting bucket is removed automatically we should get rid of this.
      await deleteS3Bucket(hostingBucket);
    }
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
    } finally {
      resetBuildCommand(projRoot, currentBuildCommand);
    }
    expect(error).toBeDefined();
    expect(error.message).toEqual('Process exited with non zero exit code 1');
  });
});

async function getCloudFrontDistribution(cloudFrontDistributionID: string) {
  const cloudFrontClient = new CloudFrontClient();
  const getDistributionResult = await cloudFrontClient.send(
    new GetDistributionCommand({
      Id: cloudFrontDistributionID,
    }),
  );
  return getDistributionResult.Distribution;
}
