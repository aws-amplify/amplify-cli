import {
  deleteProject,
  amplifyPushAuth,
  getAwsIOSConfig,
  getUserPoolClients,
  initIosProjectWithProfile,
  getCLIInputs,
  setCLIInputs,
  addAuthWithDefault,
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
} from '@aws-amplify/amplify-e2e-core';

const defaultsSettings = {
  name: 'authTest',
};

describe('amplify add auth...', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('...should init an IOS project and add default auth', async () => {
    await initIosProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot);
    await amplifyPushAuth(projRoot);
    let config = await getAwsIOSConfig(projRoot);
    expect(config.CognitoUserPool.Default.AppClientSecret).toBeUndefined();
    let meta = getProjectMeta(projRoot);
    let id = Object.keys(meta.auth)[0];
    let authMeta = meta.auth[id];
    let clientIds = [authMeta.output.AppClientID];
    let clients = await getUserPoolClients(authMeta.output.UserPoolId, clientIds, meta.providers.awscloudformation.Region);
    expect(clients[0].UserPoolClient.ClientSecret).toBeUndefined();

    // update parameter to generate client Secret
    const parameters = getCLIInputs(projRoot, 'auth', id);
    parameters.cognitoConfig.userpoolClientGenerateSecret = true;
    setCLIInputs(projRoot, 'auth', id, parameters);

    await amplifyPushAuth(projRoot);

    config = await getAwsIOSConfig(projRoot);
    expect(config.CognitoUserPool.Default.AppClientSecret).toBeDefined();
    meta = getProjectMeta(projRoot);
    id = Object.keys(meta.auth)[0];
    authMeta = meta.auth[id];
    clientIds = [authMeta.output.AppClientID];
    clients = await getUserPoolClients(authMeta.output.UserPoolId, clientIds, meta.providers.awscloudformation.Region);
    expect(clients[0].UserPoolClient.ClientSecret).toBeDefined();
  });
});
