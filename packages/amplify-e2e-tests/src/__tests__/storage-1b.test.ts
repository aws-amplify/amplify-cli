import { $TSAny } from '@aws-amplify/amplify-cli-core';
import {
  addAuthWithDefault,
  addAuthWithGroupsAndAdminAPI,
  addS3WithGroupAccess,
  addS3WithTrigger,
  amplifyPushAuth,
  checkIfBucketExists,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initJSProjectWithProfile,
  updateS3AddTriggerNewFunctionWithFunctionExisting,
} from '@aws-amplify/amplify-e2e-core';

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

  it('init a project and add S3 bucket with user pool groups and Admin API', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithGroupsAndAdminAPI(projRoot);
    await addS3WithGroupAccess(projRoot);
    await amplifyPushAuth(projRoot);
    await validate(projRoot);
  });

  it('init a project and add S3 bucket with trigger', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addS3WithTrigger(projRoot);
    await amplifyPushAuth(projRoot);
    await validate(projRoot);
  });

  it('init a project and add S3 bucket with user pool groups and then update S3 bucket to add trigger', async () => {
    const settings = {
      userGroup1: 'Admins',
      userGroup2: 'Users',
    };
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithGroupsAndAdminAPI(projRoot);
    await addS3WithGroupAccess(projRoot);
    await updateS3AddTriggerNewFunctionWithFunctionExisting(projRoot, settings);
    await amplifyPushAuth(projRoot);
    await validate(projRoot);
  });
});
