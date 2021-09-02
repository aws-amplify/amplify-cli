import {
  addAuthWithDefault,
  addSimpleDDBwithGSI,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  updateSimpleDDBwithGSI,
} from 'amplify-e2e-core';

describe('amplify add/update storage(DDB) with GSI', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('ddb-gsi');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project add a GSI and then update with another GSI', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot, {});
    await addSimpleDDBwithGSI(projRoot, {});
    await updateSimpleDDBwithGSI(projRoot, {});
    await amplifyPushAuth(projRoot);
  });
});
