/* eslint-disable spellcheck/spell-checker */
import {
  amplifyPushAuth,
  addAuthWithGroupTrigger,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getLambdaFunction,
  getProjectMeta,
  getUserPool,
  getUserPoolClients,
  initJSProjectWithProfile,
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

  it('...should init a project and add auth a PostConfirmation: add-to-group trigger', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithGroupTrigger(projRoot);
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);

    const functionName = `${Object.keys(meta.auth)[0]}PostConfirmation-integtest`;

    const authMeta = Object.keys(meta.auth).map((key) => meta.auth[key])[0];
    const id = authMeta.output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clientIds = [authMeta.output.AppClientIDWeb, authMeta.output.AppClientID];
    const clients = await getUserPoolClients(id, clientIds, meta.providers.awscloudformation.Region);

    const lambdaFunction = await getLambdaFunction(functionName, meta.providers.awscloudformation.Region);
    validateNodeModulesDirRemoval(projRoot);
    expect(userPool.UserPool).toBeDefined();
    expect(clients).toHaveLength(2);
    expect(lambdaFunction).toBeDefined();
    expect(lambdaFunction.Configuration.Environment.Variables.GROUP).toEqual('mygroup');
  });
});
