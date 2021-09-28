import {
  addAuthWithDefault,
  addAuthWithGroups,
  addAuthWithGroupsAndAdminAPI,
  addHeadlessStorage,
  addS3AndAuthWithAuthOnlyAccess,
  addS3WithGroupAccess,
  addS3WithGuestAccess,
  addS3WithTrigger,
  amplifyPushAuth,
  checkIfBucketExists,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initFlutterProjectWithProfile,
  initJSProjectWithProfile,
  removeHeadlessStorage,
  updateHeadlessStorage,
  updateS3AddTrigger,
} from 'amplify-e2e-core';
import { AddStorageRequest, CrudOperation, RemoveStorageRequest, UpdateStorageRequest } from 'amplify-headless-interface';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

async function validateS3Bucket(projRoot: string) {
  const meta = getProjectMeta(projRoot);
  const { BucketName: bucketName, Region: region } = Object.keys(meta.storage).map(key => meta.storage[key])[0].output;

  expect(bucketName).toBeDefined();
  expect(region).toBeDefined();

  const bucketExists = await checkIfBucketExists(bucketName, region);
  expect(bucketExists).toMatchObject({});
}

describe('amplify add/update storage(S3) interatively', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('s3-test');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project and add S3 bucket with Auth user access only', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addS3AndAuthWithAuthOnlyAccess(projRoot, {});
    await amplifyPushAuth(projRoot);
    await validateS3Bucket(projRoot);
  });

  it('init a javascript project and add S3 bucket with guest access', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot, {});
    await addS3WithGuestAccess(projRoot, {});
    await amplifyPushAuth(projRoot);
    await validateS3Bucket(projRoot);
  });

  it('init a flutter project and add S3 bucket with guest access', async () => {
    await initFlutterProjectWithProfile(projRoot, { name: 'storageTest' });
    await addAuthWithDefault(projRoot, {});
    await addS3WithGuestAccess(projRoot, {});
    await amplifyPushAuth(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'lib', 'amplifyconfiguration.dart'))).toBe(true);
    await validateS3Bucket(projRoot);
  });

  it('init a project and add S3 bucket with user pool groups and Admin API', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithGroupsAndAdminAPI(projRoot, {});
    await addS3WithGroupAccess(projRoot, {});
    await amplifyPushAuth(projRoot);
    await validateS3Bucket(projRoot);
  });

  it('init a project and add S3 bucket with trigger', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot, {});
    await addS3WithTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    await validateS3Bucket(projRoot);
  });

  it('init a project and add S3 bucket with user pool groups and then update S3 bucket to add trigger', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithGroupsAndAdminAPI(projRoot, {});
    await addS3WithGroupAccess(projRoot, {});
    await updateS3AddTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    await validateS3Bucket(projRoot);
  });
});

describe('amplify add/update storage(S3) headlessly', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('s3-test');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project and add/update/remove S3 headlessly', async () => {
    const [shortId] = uuid().split('-');
    const resourceName = 'headlessTest1';
    const bucketName = `storageintegtest${shortId}`;

    const addStorageRequest = {
      version: 1,
      serviceConfiguration: {
        serviceName: 'S3',
        permissions: {
          auth: [CrudOperation.CREATE_AND_UPDATE, CrudOperation.DELETE, CrudOperation.READ],
        },
        bucketName,
        resourceName,
      },
    };

    const updateStorageRequest = {
      version: 1,
      serviceConfiguration: {
        serviceName: 'S3',
        permissions: {
          auth: [CrudOperation.READ],
        },
        resourceName,
      },
    };

    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot, {});
    await addHeadlessStorage(projRoot, addStorageRequest as AddStorageRequest);
    await amplifyPushAuth(projRoot);
    await validateS3Bucket(projRoot);
    await updateHeadlessStorage(projRoot, updateStorageRequest as UpdateStorageRequest);
    await amplifyPushAuth(projRoot);
    await validateS3Bucket(projRoot);
  });

  it('init a project and headlessly add/update/remove S3 with Lambda trigger', async () => {
    const [shortId] = uuid().split('-');
    const resourceName = 'headlessTest2';
    const bucketName = `storageintegtest${shortId}`;
    const lambdaTriggerName = `lambdaTrigger${shortId}`;

    const addStorageRequest = {
      version: 1,
      serviceConfiguration: {
        serviceName: 'S3',
        permissions: {
          auth: [CrudOperation.CREATE_AND_UPDATE, CrudOperation.READ],
          guest: [CrudOperation.READ],
          groups: {
            Admins: [CrudOperation.CREATE_AND_UPDATE, CrudOperation.DELETE, CrudOperation.READ],
            Users: [CrudOperation.CREATE_AND_UPDATE, CrudOperation.READ],
          },
        },
        bucketName,
        resourceName,
        lambdaTrigger: {
          mode: 'new',
          name: lambdaTriggerName,
        },
      },
    };

    const updateStorageRequest = {
      version: 1,
      serviceConfiguration: {
        serviceName: 'S3',
        permissions: {
          auth: [CrudOperation.READ],
          groups: {
            Admins: [CrudOperation.CREATE_AND_UPDATE, CrudOperation.DELETE, CrudOperation.READ],
            Users: [CrudOperation.READ],
          },
        },
        resourceName,
        lambdaTrigger: {
          mode: 'existing',
          name: lambdaTriggerName,
        },
      },
    };

    const removeStorageRequest = {
      version: 1,
      serviceConfiguration: {
        serviceName: 'S3',
        resourceName,
      },
    };

    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithGroups(projRoot);
    await addHeadlessStorage(projRoot, addStorageRequest as AddStorageRequest);
    await amplifyPushAuth(projRoot);
    await validateS3Bucket(projRoot);
    await updateHeadlessStorage(projRoot, updateStorageRequest as UpdateStorageRequest);
    await amplifyPushAuth(projRoot);
    await validateS3Bucket(projRoot);
    await removeHeadlessStorage(projRoot, removeStorageRequest as RemoveStorageRequest);
    await amplifyPushAuth(projRoot);
  });
});
