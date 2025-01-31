import {
  addAuthWithDefault,
  addS3WithFirstGroupAccess,
  amplifyPushNonInteractive,
  configureAmplify,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  getS3StorageBucketName,
  getUserPoolId,
  initJSProjectWithProfile,
  setupUser,
  signInUser,
  signOutUser,
  updateAuthAddUserGroups,
} from '@aws-amplify/amplify-e2e-core';
import { Auth } from 'aws-amplify';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const defaultsSettings = {
  name: 'authS3Test',
};

describe('user group tests', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('auths3');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('users in users group has correct access to s3 storage', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot);
    await updateAuthAddUserGroups(projRoot, ['group1', 'group2']);
    await addS3WithFirstGroupAccess(projRoot);
    await amplifyPushNonInteractive(projRoot);

    const meta = getProjectMeta(projRoot);
    const region = meta.providers.awscloudformation.Region;
    const userPoolId = getUserPoolId(projRoot);

    const bucketName = getS3StorageBucketName(projRoot);

    await configureAmplify(projRoot);

    const username1 = 'testUser1';
    const password1 = 'Password12#1';
    await setupUser(userPoolId, username1, password1, 'group1', region);

    const username2 = 'testUser2';
    const password2 = 'Password12#2';
    await setupUser(userPoolId, username2, password2, 'group2', region);

    const s3key = 'foo';
    const s3val = 'bar';

    // Check that user 1 can interact with S3 bucket
    await signInUser(username1, password1);
    const user1Credentials = await Auth.currentCredentials();

    const s3Client1 = new S3Client({
      region,
      credentials: Auth.essentialCredentials(user1Credentials),
    });
    await s3Client1.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3key,
        Body: s3val,
      }),
    );
    const valRes = await (
      await s3Client1.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: s3key,
        }),
      )
    ).Body.transformToString();
    expect(valRes).toEqual(s3val);
    await signOutUser();

    // Check that user 2 does not have permissions to interact with S3 bucket
    await signInUser(username2, password2);
    const user2Credentials = await Auth.currentCredentials();
    const s3Client2 = new S3Client({
      region,
      credentials: Auth.essentialCredentials(user2Credentials),
    });
    await expect(
      s3Client2.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: s3key,
        }),
      ),
    ).rejects.toThrow(/not authorized to perform/);
    await expect(
      s3Client2.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: s3key,
          Body: s3val,
        }),
      ),
    ).rejects.toThrow(/not authorized to perform/);
    await signOutUser();
  });
});
