import { $TSAny } from '@aws-amplify/amplify-cli-core';
import {
  addAuthWithDefault,
  addS3AndAuthWithAuthOnlyAccess,
  addS3WithGuestAccess,
  amplifyPushAuth,
  checkIfBucketExists,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initFlutterProjectWithProfile,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';

function getServiceMeta(projectRoot: string, category: string, service: string): $TSAny {
  const meta = getProjectMeta(projectRoot);
  for (const storageResourceName of Object.keys(meta[category])) {
    if (meta.storage[storageResourceName].service.toUpperCase() === service.toUpperCase()) {
      return meta.storage[storageResourceName];
    }
  }
  return undefined;
}

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
    const serviceMeta = getServiceMeta(projRoot, 'storage', 'S3');
    const { BucketName: bucketName, Region: region } = serviceMeta.output;

    expect(bucketName).toBeDefined();
    expect(region).toBeDefined();

    const bucketExists = await checkIfBucketExists(bucketName, region);
    expect(bucketExists).toMatchObject({});
  }

  it('init a project and add S3 bucket with Auth user access only', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addS3AndAuthWithAuthOnlyAccess(projRoot);
    await amplifyPushAuth(projRoot);
    await validate(projRoot);
  });

  it('init a javascript project and add S3 bucket with guest access', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addS3WithGuestAccess(projRoot);
    await amplifyPushAuth(projRoot);
    await validate(projRoot);
  });

  it('init a flutter project and add S3 bucket with guest access', async () => {
    await initFlutterProjectWithProfile(projRoot, { name: 'storageTest' });
    await addAuthWithDefault(projRoot);
    await addS3WithGuestAccess(projRoot);
    await amplifyPushAuth(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'lib', 'amplifyconfiguration.dart'))).toBe(true);
    await validate(projRoot);
  });
});
