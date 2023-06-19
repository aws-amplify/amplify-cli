import {
  addS3AndAuthWithAuthOnlyAccess,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';

describe('amplify add/update storage(S3)', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('s3-test');
  });

  afterEach(async () => {
    // Disable deletion to test cleanup script
    // await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project and add S3 bucket with Auth user access only', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addS3AndAuthWithAuthOnlyAccess(projRoot);
    await amplifyPushAuth(projRoot);
  });
});
