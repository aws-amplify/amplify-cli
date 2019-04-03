require('../src/aws-matchers/'); // custom matcher for assertion
import {
  initProjectWithProfile,
  deleteProject,
  amplifyPushAuth
} from '../src/init';
import { addAuthWithDefault, addAuthWithDefaultSocial } from '../src/categories/auth';
import { createNewProjectDir, deleteProjectDir, getProjectMeta } from '../src/utils';
import * as AWS from 'aws-sdk';

AWS.config.update({ region: 'us-west-2' });
const CognitoIdentityServiceProvider = AWS.CognitoIdentityServiceProvider;

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
    // const id = Object.values(meta.auth)[0].output.UserPoolId;
    const userPool = await getUserPool(id);
    await expect(userPool.UserPool).toBeDefined()
  });

  it('init a project and add auth with defaultSocial', async () => {
    await initProjectWithProfile(projRoot, { });
    await addAuthWithDefaultSocial(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id);
    const clients = await getUserPoolClients(id);
    await expect(userPool.UserPool).toBeDefined();
    await expect(clients).toBeDefined();
    await expect(clients.length).toEqual(2);
    await expect(clients[0].UserPoolClient.CallbackURLs[0]).toEqual('https://www.google.com/');
    await expect(clients[0].UserPoolClient.LogoutURLs[0]).toEqual('https://www.nytimes.com/');
    await expect(clients[0].UserPoolClient.SupportedIdentityProviders.length).toEqual(4);

  });
});

const getUserPool = async (userpoolId) => {
  let res;
  try {
    res = await new CognitoIdentityServiceProvider().describeUserPool({UserPoolId: userpoolId}).promise();
  } catch (e) {
    console.log(e);
  }
  return res;
}

const getUserPoolClients = async (userpoolId) => {
  const provider = new CognitoIdentityServiceProvider();
  let res = [];
  try {
    let clients = await provider.listUserPoolClients({UserPoolId: userpoolId}).promise();
    for (let i = 0; i < clients.UserPoolClients.length; i++) {
      let clientData = await provider.describeUserPoolClient({
        UserPoolId: userpoolId,
        ClientId: clients.UserPoolClients[i].ClientId
      }).promise();
      res.push(clientData);
    }
  } catch (e) {
    console.log(e);
  }
  return res;
}
