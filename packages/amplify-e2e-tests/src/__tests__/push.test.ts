/* eslint-disable spellcheck/spell-checker */
import {
  addAuthWithDefault,
  amplifyPushForce,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initJSProjectWithProfile,
  amplifyPushAuth,
} from '@aws-amplify/amplify-e2e-core';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

describe('amplify push ', () => {
  let pushProjRoot: string;
  beforeEach(async () => {
    pushProjRoot = await createNewProjectDir('push-test');
  });

  afterEach(async () => {
    await deleteProject(pushProjRoot);
    deleteProjectDir(pushProjRoot);
  });

  it('test push --force override current-cloud-backed zip', async () => {
    await initJSProjectWithProfile(pushProjRoot, {
      disableAmplifyAppCreation: false,
      name: 'testPush',
    });

    await addAuthWithDefault(pushProjRoot);
    const amplifyMeta = getProjectMeta(pushProjRoot);
    const meta = amplifyMeta.providers.awscloudformation;
    const bucketName = meta.DeploymentBucketName;

    const s3 = new S3Client();
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: '#current-cloud-backend.zip',
      }),
    );

    await expect(amplifyPushAuth(pushProjRoot)).rejects.toThrow();
    await amplifyPushForce(pushProjRoot);
  });
});
