/* eslint-disable spellcheck/spell-checker */
import {
  amplifyPush,
  addAuthViaAPIWithTrigger,
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

  it('...should allow the user to add auth via API category, with a trigger', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthViaAPIWithTrigger(projRoot, { transformerVersion: 1 });
    await amplifyPush(projRoot);
    const meta = getProjectMeta(projRoot);

    const functionName = `${Object.keys(meta.auth)[0]}PostConfirmation-integtest`;
    const authMeta = Object.keys(meta.auth).map((key) => meta.auth[key])[0];
    const id = authMeta.output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clientIds = [authMeta.output.AppClientIDWeb, authMeta.output.AppClientID];
    const clients = await getUserPoolClients(id, clientIds, meta.providers.awscloudformation.Region);

    const lambdaFunction = await getLambdaFunction(functionName, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();
    expect(userPool.UserPool.AliasAttributes).not.toBeDefined();
    validateNodeModulesDirRemoval(projRoot);
    expect(clients).toHaveLength(2);
    expect(lambdaFunction).toBeDefined();
    expect(lambdaFunction.Configuration.Environment.Variables.GROUP).toEqual('mygroup');
  });
});
