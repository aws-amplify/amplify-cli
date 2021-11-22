import {
  addRestApi,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getCLIInputs,
  initJSProjectWithProfile,
  updateRestApi,
  addAuthWithDefault,
  updateAuthAddAdminQueries,
  updateAuthAdminQueriesWithExtMigration,
  getProjectMeta,
} from 'amplify-e2e-core';
import { addRestApiOldDx } from '../../../migration-helpers/api';
import { v4 as uuid } from 'uuid';

describe('API Gateway CDK migration', () => {
  let projRoot: string;

  beforeEach(async () => {
    const [shortId] = uuid().split('-');
    const projName = `apigwmig${shortId}`;
    projRoot = await createNewProjectDir(projName);
    await initJSProjectWithProfile(projRoot, { name: projName });
  });

  afterEach(async () => {
    await deleteProject(projRoot, undefined, true);
    deleteProjectDir(projRoot);
  });

  it('migrates on api update', async () => {
    await addRestApiOldDx(projRoot, { existingLambda: false, apiName: 'restapimig' });
    await amplifyPushAuth(projRoot);
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

  it('migrates auth with admin queries', async () => {
    await addAuthWithDefault(projRoot);
    await updateAuthAddAdminQueries(projRoot);
    await amplifyPushAuth(projRoot);

    await updateAuthAdminQueriesWithExtMigration(projRoot, { testingWithLatestCodebase: true });
    await amplifyPushAuth(projRoot, true);

    const meta = getProjectMeta(projRoot);
    const authName = Object.keys(meta.auth)[0];

    const authCliInputs = getCLIInputs(projRoot, 'auth', authName);
    expect(authCliInputs).toBeDefined();

    const adminQueriesCliInputs = getCLIInputs(projRoot, 'api', 'AdminQueries');
    expect(adminQueriesCliInputs).toBeDefined();
  });
});
