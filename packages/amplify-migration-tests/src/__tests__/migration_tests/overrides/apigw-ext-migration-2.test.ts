import {
  addAuthWithDefault,
  amplifyPushAuth,
  amplifyPushAuthV5V6,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getCLIInputs,
  getProjectMeta,
  initJSProjectWithProfile,
  updateAuthAddAdminQueries,
  updateAuthAdminQueriesWithExtMigration,
} from '@aws-amplify/amplify-e2e-core';
import { v4 as uuid } from 'uuid';

describe('API Gateway CDK migration', () => {
  let projRoot: string;

  beforeEach(async () => {
    const [shortId] = uuid().split('-');
    const projName = `apigwmig${shortId}`;
    projRoot = await createNewProjectDir(projName);
    await initJSProjectWithProfile(projRoot, {
      name: projName,
      includeUsageDataPrompt: false
    });
  });

  afterEach(async () => {
    await deleteProject(projRoot, undefined, true);
    deleteProjectDir(projRoot);
  });

  it('migrates auth with admin queries', async () => {
    await addAuthWithDefault(projRoot);
    await updateAuthAddAdminQueries(projRoot);
    await amplifyPushAuthV5V6(projRoot);

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
