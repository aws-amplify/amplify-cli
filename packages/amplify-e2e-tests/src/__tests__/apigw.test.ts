import {
  addRestApi,
  createNewProjectDir,
  initJSProjectWithProfile,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  amplifyPushAuth,
  addAuthWithGroupsAndAdminAPI,
} from 'amplify-e2e-core';
import { v4 as uuid } from 'uuid';

const [shortId] = uuid().split('-');
const projName = `apigwtest${shortId}`;

let projRoot: string;
beforeAll(async () => {
  projRoot = await createNewProjectDir(projName);
  await initJSProjectWithProfile(projRoot, { name: projName });
});

afterAll(async () => {
  await deleteProject(projRoot);
  deleteProjectDir(projRoot);
});

describe('API Gateway e2e tests', () => {
  it('adds multiple rest apis and pushes', async () => {
    await addRestApi(projRoot, {});
    await amplifyPushAuth(projRoot);
    await addAuthWithGroupsAndAdminAPI(projRoot); // Groups: Admins, Users
    await amplifyPushAuth(projRoot);
    await addRestApi(projRoot, { isFirstRestApi: false, path: '/foo' });
    await addRestApi(projRoot, { restrictAccess: true, allowGuestUsers: true });
    await amplifyPushAuth(projRoot); // Pushes multiple rest api updates
    const projMeta = getProjectMeta(projRoot);
    expect(projMeta).toBeDefined();
    expect(projMeta.api).toBeDefined();
  });
});
