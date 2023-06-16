import {
  addAuthWithEmailVerificationAndUserPoolGroupTriggers,
  amplifyPushAuth,
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

describe('amplify init and add auth...', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth');
    await initJSProjectWithProfile(projRoot);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('...should add multiple auth triggers and push successfully', async () => {
    await addAuthWithEmailVerificationAndUserPoolGroupTriggers(projRoot);
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);

    const emailVerificationTriggerName = `${Object.keys(meta.auth)[0]}CustomMessage-integtest`;
    const addUserToGroupTriggerName = `${Object.keys(meta.auth)[0]}PostConfirmation-integtest`;

    const authMeta = Object.keys(meta.auth).map((key) => meta.auth[key])[0];
    const id = authMeta.output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clientIds = [authMeta.output.AppClientIDWeb, authMeta.output.AppClientID];
    const clients = await getUserPoolClients(id, clientIds, meta.providers.awscloudformation.Region);

    const emailVerificationTrigger = await getLambdaFunction(emailVerificationTriggerName, meta.providers.awscloudformation.Region);
    const addUserToGroupTrigger = await getLambdaFunction(addUserToGroupTriggerName, meta.providers.awscloudformation.Region);

    validateNodeModulesDirRemoval(projRoot);
    expect(userPool.UserPool).toBeDefined();
    expect(clients).toHaveLength(2);
    expect(emailVerificationTrigger).toBeDefined();
    expect(addUserToGroupTrigger).toBeDefined();
    expect(addUserToGroupTrigger.Configuration.Environment.Variables.GROUP).toEqual('admin');
  });
});
