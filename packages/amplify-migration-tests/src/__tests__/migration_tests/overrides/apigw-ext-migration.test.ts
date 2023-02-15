import {
  amplifyPushAuth,
  amplifyPushAuthV5V6,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getCLIInputs,
  updateRestApi,
} from '@aws-amplify/amplify-e2e-core';
import { addRestApiOldDx } from '../../../migration-helpers/api';
import { initJSProjectWithProfileV4_52_0 } from '../../../migration-helpers';
import { v4 as uuid } from 'uuid';

describe('API Gateway CDK migration', () => {
  let projRoot: string;

  beforeEach(async () => {
    const [shortId] = uuid().split('-');
    const projName = `apigwmig${shortId}`;
    projRoot = await createNewProjectDir(projName);
    await initJSProjectWithProfileV4_52_0(projRoot, { name: projName });
  });

  afterEach(async () => {
    await deleteProject(projRoot, undefined, true);
    deleteProjectDir(projRoot);
  });

  it('migrates on api update', async () => {
    await addRestApiOldDx(projRoot, { existingLambda: false, apiName: 'restapimig' });
    await amplifyPushAuthV5V6(projRoot);
    await updateRestApi(projRoot, {
      updateOperation: 'Add another path',
      newPath: '/foo',
      expectMigration: true,
      testingWithLatestCodebase: true,
    });
    await amplifyPushAuth(projRoot, true);
    const cliInputs = getCLIInputs(projRoot, 'api', 'restapimig');
    expect(cliInputs).toBeDefined();
  });
});
