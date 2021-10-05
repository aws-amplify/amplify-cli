import { JSONUtilities } from 'amplify-cli-core';
import { initJSProjectWithProfile, initFlutterProjectWithProfile, deleteProject, amplifyPushAuth } from 'amplify-e2e-core';
import { addAuthWithDefault, addAuthWithGroupsAndAdminAPI } from 'amplify-e2e-core';
import {
  addSimpleDDB,
  overrideDDB,
  buildOverrideStorage,
  addDDBWithTrigger,
  updateDDBWithTrigger,
  addSimpleDDBwithGSI,
  updateSimpleDDBwithGSI,
  addS3AndAuthWithAuthOnlyAccess,
  addS3WithGuestAccess,
  addS3WithGroupAccess,
  addS3WithTrigger,
  updateS3AddTrigger,
} from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, getDDBTable, checkIfBucketExists } from 'amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import uuid from 'uuid';

describe('amplify add/update storage(S3)', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('s3-test');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  async function validate(projRoot) {
    const meta = getProjectMeta(projRoot);
    const { BucketName: bucketName, Region: region } = Object.keys(meta.storage).map(key => meta.storage[key])[0].output;

    expect(bucketName).toBeDefined();
    expect(region).toBeDefined();

    const bucketExists = await checkIfBucketExists(bucketName, region);
    expect(bucketExists).toMatchObject({});
  }

  it('init a project and add S3 bucket with Auth user access only', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addS3AndAuthWithAuthOnlyAccess(projRoot, {});
    await amplifyPushAuth(projRoot);
    await validate(projRoot);
  });

  it('init a javascript project and add S3 bucket with guest access', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot, {});
    await addS3WithGuestAccess(projRoot, {});
    await amplifyPushAuth(projRoot);
    await validate(projRoot);
  });

  it('init a flutter project and add S3 bucket with guest access', async () => {
    await initFlutterProjectWithProfile(projRoot, { name: 'storageTest' });
    await addAuthWithDefault(projRoot, {});
    await addS3WithGuestAccess(projRoot, {});
    await amplifyPushAuth(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'lib', 'amplifyconfiguration.dart'))).toBe(true);
    await validate(projRoot);
  });

  it('init a project and add S3 bucket with user pool groups and Admin API', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithGroupsAndAdminAPI(projRoot, {});
    await addS3WithGroupAccess(projRoot, {});
    await amplifyPushAuth(projRoot);
    await validate(projRoot);
  });

  it('init a project and add S3 bucket with trigger', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot, {});
    await addS3WithTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    await validate(projRoot);
  });

  it('init a project and add S3 bucket with user pool groups and then update S3 bucket to add trigger', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithGroupsAndAdminAPI(projRoot, {});
    await addS3WithGroupAccess(projRoot, {});
    await updateS3AddTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    await validate(projRoot);
  });
});
