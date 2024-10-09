import { allowedVersionsToMigrateFrom, versionCheck } from '../../migration-helpers';
import {
  addAuthWithDefault,
  addS3WithFirstGroupAccess,
  amplifyPushAuth,
  amplifyPushForce,
  amplifyPushNonInteractive,
  configureAmplify,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  getS3StorageBucketName,
  getUserPoolId,
  setupUser,
  signInUser,
  signOutUser,
  updateAuthAddUserGroups,
  updateHeadlessAuth,
} from '@aws-amplify/amplify-e2e-core';
import { initJSProjectWithProfileV12 } from '../../migration-helpers-v12/init';
import { fetchAuthSession } from 'aws-amplify/auth';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { UpdateAuthRequest } from 'amplify-headless-interface';

describe('amplify auth group mapping', () => {
  beforeAll(async () => {
    const migrateFromVersion = { v: '12.0.3' };
    const migrateToVersion = { v: 'uninitialized' };

    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);

    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
  });

  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('groupMapping');
  });

  afterEach(async () => {
    await deleteProject(projRoot, null, true);
    deleteProjectDir(projRoot);
  });

  const defaultsSettings = {
    name: 'authS3Test',
  };

  const username1 = 'testUser1';
  const password1 = 'Password12#1';
  const username2 = 'testUser2';
  const password2 = 'Password12#2';

  const setupUsers = async () => {
    const meta = getProjectMeta(projRoot);
    const region = meta.providers.awscloudformation.Region;
    const userPoolId = getUserPoolId(projRoot);

    await configureAmplify(projRoot);
    await setupUser(userPoolId, username1, password1, 'group1', region);
    await setupUser(userPoolId, username2, password2, 'group2', region);
  };

  const verifyUserAccess = async () => {
    const meta = getProjectMeta(projRoot);
    const region = meta.providers.awscloudformation.Region;
    const bucketName = getS3StorageBucketName(projRoot);

    await configureAmplify(projRoot);

    const s3key = 'foo';
    const s3val = 'bar';

    // Check that user 1 can interact with S3 bucket
    await signInUser(username1, password1);
    const { credentials: user1Credentials } = await fetchAuthSession();

    const s3Client1 = new S3Client({
      region,
      credentials: user1Credentials,
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
    const { credentials: user2Credentials } = await fetchAuthSession();
    const s3Client2 = new S3Client({
      region,
      credentials: user2Credentials,
    });
    await expect(
      s3Client2.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: s3key,
        }),
      ),
    ).rejects.toThrow('Access Denied');
    await expect(
      s3Client2.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: s3key,
          Body: s3val,
        }),
      ),
    ).rejects.toThrow('Access Denied');
    await signOutUser();
  };

  describe('project with group mapping created by old version', () => {
    beforeEach(async () => {
      await initJSProjectWithProfileV12(projRoot, defaultsSettings);
      await addAuthWithDefault(projRoot);
      await updateAuthAddUserGroups(projRoot, ['group1', 'group2']);
      await addS3WithFirstGroupAccess(projRoot);
      await amplifyPushNonInteractive(projRoot);
      await setupUsers();
      await verifyUserAccess();
    });

    it('force pushes with latest and checks access', async () => {
      await amplifyPushForce(projRoot, true);
      await verifyUserAccess();
    });

    it('updates auth with latest, pushes and checks access', async () => {
      await updateAuthAddUserGroups(projRoot, ['group3'], { testingWithLatestCodebase: true, hasExistingUserPoolGroups: true });
      await amplifyPushAuth(projRoot, true);
      await verifyUserAccess();
    });

    it('updates auth headless with latest, pushes and checks access', async () => {
      const updateAuthRequest: UpdateAuthRequest = {
        version: 2,
        serviceModification: {
          serviceName: 'Cognito',
          userPoolModification: {
            autoVerifiedAttributes: [
              {
                type: 'EMAIL',
              },
            ],
            userPoolGroups: [
              {
                groupName: 'group1',
              },
              {
                groupName: 'group2',
              },
              {
                groupName: 'group3',
              },
            ],
          },
          includeIdentityPool: true,
          identityPoolModification: {},
        },
      };

      await updateHeadlessAuth(projRoot, updateAuthRequest, { testingWithLatestCodebase: true });
      await amplifyPushNonInteractive(projRoot, true);
      await verifyUserAccess();
    });
  });
});
