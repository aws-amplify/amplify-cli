/* eslint-disable spellcheck/spell-checker */
import {
  amplifyPush,
  addUserToUserPool,
  addAuthwithUserPoolGroupsViaAPIWithTrigger,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  getUserPool,
  getUserPoolClients,
  initJSProjectWithProfile,
  invokeFunction,
  updateFunction,
  listUserPoolGroupsForUser,
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

  it('...should allow the user to add auth via API category, with a trigger and function dependsOn API', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthwithUserPoolGroupsViaAPIWithTrigger(projRoot, { transformerVersion: 1 });
    await updateFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        additionalPermissions: {
          permissions: ['storage'],
          choices: ['function', 'auth', 'api', 'storage'],
          resources: ['Todo:@model(appsync)'],
          resourceChoices: ['Todo:@model(appsync)'],
          operations: ['read'],
        },
      },
      'nodejs',
    );
    await amplifyPush(projRoot);
    const meta = getProjectMeta(projRoot);
    const authKey = Object.keys(meta.auth).find((key) => meta.auth[key].service === 'Cognito');
    const functionName = `${authKey}PostConfirmation-integtest`;
    const authMeta = meta.auth[authKey];
    const id = authMeta.output.UserPoolId;
    const region = meta.providers.awscloudformation.Region;
    const userPool = await getUserPool(id, region);
    const clientIds = [authMeta.output.AppClientIDWeb, authMeta.output.AppClientID];
    const clients = await getUserPoolClients(id, clientIds, region);
    await addUserToUserPool(id, region);
    const lambdaEvent = {
      userPoolId: id,
      userName: 'testUser',
    };
    const result = await invokeFunction(functionName, JSON.stringify(lambdaEvent), region);
    expect(result.StatusCode).toBe(200);
    const user1Groups = await listUserPoolGroupsForUser(id, lambdaEvent.userName, region);
    expect(user1Groups).toEqual(['mygroup']);
    expect(userPool.UserPool).toBeDefined();
    expect(Object.keys(userPool.UserPool.LambdaConfig)[0]).toBe('PostConfirmation');
    expect(Object.values(userPool.UserPool.LambdaConfig)[0]).toBe(meta.function[functionName.split('-')[0]].output.Arn);
    validateNodeModulesDirRemoval(projRoot);
    expect(clients).toHaveLength(2);
  });
});
