import { initJSProjectWithProfile, initFlutterProjectWithProfile, deleteProject, amplifyPushAuth } from 'amplify-e2e-core';
import { addAuthWithDefault, addAuthWithGroupsAndAdminAPI } from 'amplify-e2e-core';
import {
  addSimpleDDB,
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
