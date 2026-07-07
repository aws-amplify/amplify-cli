import {
  deleteProject,
  amplifyPushAuth,
  getAwsIOSConfig,
  getUserPoolClients,
  initIosProjectWithProfile,
  addAuthWithDefault,
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
  updateCLIParametersToGenerateUserPoolClientSecret,
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

    updateCLIParametersToGenerateUserPoolClientSecret(projRoot);

    await amplifyPushAuth(projRoot);

    config = await getAwsIOSConfig(projRoot);
    const clientSecretInAwsIOSConfig = config.CognitoUserPool.Default.AppClientSecret;
    expect(clientSecretInAwsIOSConfig).toBeDefined();
    meta = getProjectMeta(projRoot);
    id = Object.keys(meta.auth)[0];
    authMeta = meta.auth[id];
    clientIds = [authMeta.output.AppClientID];
    const clientSecretInMetaFile = authMeta.output.AppClientSecret;
    // compare client secret in meta file and ios config file
    expect(clientSecretInMetaFile).toBeDefined();
    expect(clientSecretInAwsIOSConfig).toEqual(clientSecretInMetaFile);
    clients = await getUserPoolClients(authMeta.output.UserPoolId, clientIds, meta.providers.awscloudformation.Region);
    expect(clients[0].UserPoolClient.ClientSecret).toBeDefined();
    // compare client secret in meta file with cloud value
    expect(clients[0].UserPoolClient.ClientSecret).toEqual(clientSecretInMetaFile);
  });
});
