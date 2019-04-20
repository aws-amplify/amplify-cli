require('../src/aws-matchers/'); // custom matcher for assertion
import {
  initProjectWithProfile,
  deleteProject,
  amplifyPushAuth
} from '../src/init';
import { addAuthWithDefault, addAuthWithDefaultSocial } from '../src/categories/auth';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, getUserPool, getUserPoolClients } from '../src/utils';


describe('amplify add auth', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
    jest.setTimeout(1000 * 60 * 60); // 1 hour
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project and add auth with defaults', async () => {
    await initProjectWithProfile(projRoot, { });
    await addAuthWithDefault(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    await expect(userPool.UserPool).toBeDefined()
  });

  it('init a project and add auth with defaultSocial', async () => {
    await initProjectWithProfile(projRoot, { });
    await addAuthWithDefaultSocial(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clients = await getUserPoolClients(id, meta.providers.awscloudformation.Region);
    await expect(userPool.UserPool).toBeDefined();
    await expect(clients).toHaveLength(2);
    await expect(clients[0].UserPoolClient.CallbackURLs[0]).toEqual('https://www.google.com/');
    await expect(clients[0].UserPoolClient.LogoutURLs[0]).toEqual('https://www.nytimes.com/');
    await expect(clients[0].UserPoolClient.SupportedIdentityProviders).toHaveLength(4);

  });
});
