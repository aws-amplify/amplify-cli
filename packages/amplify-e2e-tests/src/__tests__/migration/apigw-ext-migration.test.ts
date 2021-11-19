import {
  addRestApi,
  amplifyPushAuth,
  cliVersionController,
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
import { v4 as uuid } from 'uuid';

describe('API Gateway CDK migration', () => {
  let projRoot: string;

  beforeEach(async () => {
    const [shortId] = uuid().split('-');
    const projName = `apigwmig${shortId}`;
    projRoot = await createNewProjectDir(projName);
    await cliVersionController.useCliVersion('6.3.1');
    await initJSProjectWithProfile(projRoot, { name: projName });
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('migrates on api update', async () => {
    await addRestApi(projRoot, { existingLambda: false, apiName: 'restapimig' });
    await amplifyPushAuth(projRoot);
    cliVersionController.resetCliVersion();
    await updateRestApi(projRoot, { updateOperation: 'Add another path', newPath: '/foo', expectMigration: true });
    await amplifyPushAuth(projRoot);
    const cliInputs = getCLIInputs(projRoot, 'api', 'restapimig');
    expect(cliInputs).toBeDefined();
  });

  it('migrates auth with admin queries', async () => {
    await addAuthWithDefault(projRoot);
    await updateAuthAddAdminQueries(projRoot);
    await amplifyPushAuth(projRoot);

    cliVersionController.resetCliVersion();

    await updateAuthAdminQueriesWithExtMigration(projRoot);
    await amplifyPushAuth(projRoot);

    const meta = getProjectMeta(projRoot);
    const authName = Object.keys(meta.auth)[0];

    const authCliInputs = getCLIInputs(projRoot, 'auth', authName);
    expect(authCliInputs).toBeDefined();

    const adminQueriesCliInputs = getCLIInputs(projRoot, 'api', 'AdminQueries');
    expect(adminQueriesCliInputs).toBeDefined();
  });
});
