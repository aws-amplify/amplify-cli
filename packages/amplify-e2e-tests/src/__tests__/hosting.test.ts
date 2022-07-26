import {
  amplifyPublishWithoutUpdate,
  createReactTestProject,
  resetBuildCommand,
  initJSProjectWithProfile,
  deleteProject,
  addDEVHosting,
  removeHosting,
  amplifyPushWithoutCodegen,
  extractHostingBucketInfo,
  deleteS3Bucket,
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
    await addDEVHosting(projRoot);
    await amplifyPushWithoutCodegen(projRoot);
  });

  afterAll(async () => {
    const hostingBucket = extractHostingBucketInfo(projRoot);
    await removeHosting(projRoot);
    await amplifyPushWithoutCodegen(projRoot);
    await deleteProject(projRoot);
    if (hostingBucket) {
      try {
        await deleteS3Bucket(hostingBucket);
      } catch {}
    }
    deleteProjectDir(projRoot);
  });

  it('push creates correct amplify artifacts', async () => {
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'S3AndCloudFront'))).toBe(true);
    const projectMeta = getProjectMeta(projRoot);
    expect(projectMeta.hosting).toBeDefined();
    expect(projectMeta.hosting.S3AndCloudFront).toBeDefined();
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
