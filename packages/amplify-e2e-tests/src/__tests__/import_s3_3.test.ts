import * as aws from 'aws-sdk';
import {
  addAuthWithDefault,
  amplifyPushAuth,
  amplifyStatus,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  importHeadlessStorage,
  removeHeadlessStorage,
} from '@aws-amplify/amplify-e2e-core';
import {
  expectLocalAndCloudMetaFilesMatching,
  getShortId,
  getStorageProjectDetails,
  expectNoStorageInMeta,
  expectLocalTeamInfoHasOnlyAuthCategoryAndNoStorage,
  getS3ResourceName,
} from '../import-helpers';

describe('headless s3 import', () => {
  const projectPrefix = 'sssheadimp';
  const bucketPrefix = 'sss-headless-import-test';

  const projectSettings = {
    name: projectPrefix,
  };

  let projectRoot: string;
  let ignoreProjectDeleteErrors = false;
  let bucketNameToImport: string;
  let bucketLocation: string;

  beforeAll(async () => {
    process.env.AMPLIFY_ENABLE_DEBUG_OUTPUT = 'true';
    const shortId = getShortId();
    bucketNameToImport = `${bucketPrefix}${shortId}`;

    const s3 = new aws.S3();

    await s3
      .createBucket({
        Bucket: bucketNameToImport,
      })
      .promise();

    const locationResponse = await s3
      .getBucketLocation({
        Bucket: bucketNameToImport,
      })
      .promise();

    // For us-east-1 buckets the LocationConstraint is always emtpy, we have to return a
    // region in every case.
    // https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketLocation.html
    if (
      locationResponse.LocationConstraint === undefined ||
      locationResponse.LocationConstraint === '' ||
      locationResponse.LocationConstraint === null
    ) {
      bucketLocation = 'us-east-1';
    } else {
      bucketLocation = locationResponse.LocationConstraint;
    }
  });

  afterAll(async () => {
    // Delete bucket
    const s3 = new aws.S3();

    await s3
      .deleteBucket({
        Bucket: bucketNameToImport,
      })
      .promise();
  });

  beforeEach(async () => {
    projectRoot = await createNewProjectDir(projectPrefix);
    ignoreProjectDeleteErrors = false;
  });

  afterEach(async () => {
    try {
      await deleteProject(projectRoot);
    } catch (error) {
      // In some tests where project initialization fails it can lead to errors on cleanup which we
      // can ignore if set by the test
      if (!ignoreProjectDeleteErrors) {
        throw error;
      }
    }

    deleteProjectDir(projectRoot);
  });

  it('import storage when no auth resource is in the project', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);

    const processResult = await importHeadlessStorage(
      projectRoot,
      {
        version: 1,
        serviceConfiguration: {
          serviceName: 'S3',
          bucketName: bucketNameToImport,
        },
      },
      false,
    );

    expect(processResult.exitCode).toBe(1);
    expect(processResult.stderr).toContain(
      'Cannot headlessly import storage resource without an existing auth resource. It can be added with \\"amplify add auth\\"',
    );
  });

  it('import storage when there is already a storage resource in the project', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await addAuthWithDefault(projectRoot);

    const processResult = await importHeadlessStorage(
      projectRoot,
      {
        version: 1,
        serviceConfiguration: {
          serviceName: 'S3',
          bucketName: bucketNameToImport,
        },
      },
      false,
    );

    expect(processResult.exitCode).toBe(0);
    expect(processResult.stdout).toEqual('');

    const processResultFail = await importHeadlessStorage(
      projectRoot,
      {
        version: 1,
        serviceConfiguration: {
          serviceName: 'S3',
          bucketName: bucketNameToImport,
        },
      },
      false,
    );

    expect(processResultFail.exitCode).toBe(1);
    expect(processResultFail.stderr).toContain('Amazon S3 storage was already added to your project');
  });

  it('import storage with non-existent bucket`', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await addAuthWithDefault(projectRoot);

    const fakeBucketName = `fake-bucket-name-${getShortId()}`;

    const processResult = await importHeadlessStorage(
      projectRoot,
      {
        version: 1,
        serviceConfiguration: {
          serviceName: 'S3',
          bucketName: fakeBucketName,
        },
      },
      false,
    );

    expect(processResult.exitCode).toBe(1);
    expect(processResult.stderr).toContain(`The specified bucket: \\"${fakeBucketName}\\" does not exist.`);
  });

  it('import storage successfully and push, remove storage and push`', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    await addAuthWithDefault(projectRoot);

    const processResult = await importHeadlessStorage(projectRoot, {
      version: 1,
      serviceConfiguration: {
        serviceName: 'S3',
        bucketName: bucketNameToImport,
      },
    });

    expect(processResult.exitCode).toBe(0);
    expect(processResult.stdout).toEqual('');

    await amplifyStatus(projectRoot, 'Import');
    await amplifyPushAuth(projectRoot);
    await amplifyStatus(projectRoot, 'No Change');

    const storageResourceName = getS3ResourceName(projectRoot);

    expectLocalAndCloudMetaFilesMatching(projectRoot);

    const projectDetails = getStorageProjectDetails(projectRoot);

    expect(projectDetails.meta.BucketName).toEqual(bucketNameToImport);
    expect(projectDetails.meta.Region).toEqual(bucketLocation);

    expect(projectDetails.team.bucketName).toEqual(bucketNameToImport);
    expect(projectDetails.team.region).toEqual(bucketLocation);

    await removeHeadlessStorage(projectRoot, {
      version: 1,
      serviceConfiguration: {
        serviceName: 'S3',
        resourceName: storageResourceName,
        // deleteBucketAndContents: true,
      },
    });

    await amplifyStatus(projectRoot, 'Unlink');

    await amplifyPushAuth(projectRoot);

    expectNoStorageInMeta(projectRoot);

    expectLocalTeamInfoHasOnlyAuthCategoryAndNoStorage(projectRoot);
  });
});
