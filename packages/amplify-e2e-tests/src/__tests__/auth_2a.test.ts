/* eslint-disable spellcheck/spell-checker */
import {
  addAuthWithDefaultSocial,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  getUserPool,
  getUserPoolClients,
  initJSProjectWithProfile,
  isDeploymentSecretForEnvExists,
  validateNodeModulesDirRemoval,
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

  it('...should init a project and add auth with defaultSocial', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefaultSocial(projRoot);
    expect(isDeploymentSecretForEnvExists(projRoot, 'integtest')).toBeTruthy();
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    expect(isDeploymentSecretForEnvExists(projRoot, 'integtest')).toBeFalsy();
    const authMeta = Object.keys(meta.auth).map((key) => meta.auth[key])[0];
    const id = authMeta.output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clientIds = [authMeta.output.AppClientIDWeb, authMeta.output.AppClientID];
    const clients = await getUserPoolClients(id, clientIds, meta.providers.awscloudformation.Region);

    expect(userPool.UserPool).toBeDefined();
    expect(clients).toHaveLength(2);
    validateNodeModulesDirRemoval(projRoot);
    expect(clients[0].UserPoolClient.CallbackURLs[0]).toEqual('https://www.google.com/');
    expect(clients[0].UserPoolClient.LogoutURLs[0]).toEqual('https://www.nytimes.com/');
    expect(clients[0].UserPoolClient.SupportedIdentityProviders).toHaveLength(5);
  });
});
