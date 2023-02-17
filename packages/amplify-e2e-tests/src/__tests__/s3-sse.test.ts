import {
  addAuthWithDefault,
  addDEVHosting,
  addS3,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getBucketEncryption,
  getProjectMeta,
  initJSProjectWithProfile,
} from 'amplify-e2e-core';

describe('amplify always enables SSE on S3 buckets', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('s3-test');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });
  it('enables SSE on the deployment, category and hosting buckets', async () => {
    // setup
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot, {});
    await addS3(projRoot, {});
    await addDEVHosting(projRoot);
    await amplifyPushAuth(projRoot);

    const meta = getProjectMeta(projRoot);
    const deploymentBucket = meta?.providers?.awscloudformation?.DeploymentBucketName;
    const hostingBucket = (Object.values(meta?.hosting)?.[0] as any)?.output?.HostingBucketName;
    const categoryBucket = (Object.values(meta?.storage)?.[0] as any)?.output?.BucketName;
    await expectSSEEnabledForBucket(deploymentBucket);
    await expectSSEEnabledForBucket(hostingBucket);
    await expectSSEEnabledForBucket(categoryBucket);
  });
});

const expectSSEEnabledForBucket = async (bucket?: string) => {
  expect(bucket).toBeDefined();
  const result = await getBucketEncryption(bucket);
  expect(result?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
};
