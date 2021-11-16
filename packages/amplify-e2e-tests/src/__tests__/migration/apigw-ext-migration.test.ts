import {
  addRestApi,
  amplifyPushAuth,
  cliVersionController,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getCLIInputs,
  getCLIPath,
  initJSProjectWithProfile,
  updateRestApi,
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
    await cliVersionController.resetCliVersion();
    await updateRestApi(projRoot, { updateOperation: 'Add another path', newPath: '/foo', expectMigration: true });
    await amplifyPushAuth(projRoot);
    const cliInputs = getCLIInputs(projRoot, 'api', 'restapimig');
    expect(cliInputs).toBeDefined();
  });
});
