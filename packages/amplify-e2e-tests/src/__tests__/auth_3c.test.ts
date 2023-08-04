import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  addAuthWithMaxOptions,
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
  getUserPool,
  getUserPoolClients,
  getLambdaFunction,
} from '@aws-amplify/amplify-e2e-core';

const defaultsSettings = {
  name: 'authTest',
};

describe('amplify add auth...c', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('...should init a project where all possible options are selected', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithMaxOptions(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);

    const createFunctionName = `${Object.keys(meta.auth)[1]}CreateAuthChallenge-integtest`;
    const defineFunctionName = `${Object.keys(meta.auth)[1]}DefineAuthChallenge-integtest`;

    const authMeta = Object.keys(meta.auth).map((key) => meta.auth[key])[1];
    const id = authMeta.output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clientIds = [authMeta.output.AppClientIDWeb, authMeta.output.AppClientID];
    const clients = await getUserPoolClients(id, clientIds, meta.providers.awscloudformation.Region);

    const createFunction = await getLambdaFunction(createFunctionName, meta.providers.awscloudformation.Region);
    const defineFunction = await getLambdaFunction(defineFunctionName, meta.providers.awscloudformation.Region);

    expect(userPool.UserPool).toBeDefined();
    expect(clients).toHaveLength(2);
    expect(createFunction).toBeDefined();
    expect(defineFunction).toBeDefined();

    expect(createFunction.Configuration.Environment.Variables.MODULES).toEqual('custom');
    expect(defineFunction.Configuration.Environment.Variables.MODULES).toEqual('custom');

    const { userPoolGroups } = meta.auth;
    expect(userPoolGroups.service).toEqual('Cognito-UserPool-Groups');
    expect(userPoolGroups.providerPlugin).toEqual('awscloudformation');
    expect(userPoolGroups.dependsOn.length).toBe(1);
    expect(userPoolGroups.dependsOn[0].category).toBe('auth');
    expect(userPoolGroups.dependsOn[0].attributes.length).toBe(4);
    expect(userPoolGroups.dependsOn[0].attributes).toContain('UserPoolId');
    expect(userPoolGroups.dependsOn[0].attributes).toContain('AppClientIDWeb');
    expect(userPoolGroups.dependsOn[0].attributes).toContain('AppClientID');
    expect(userPoolGroups.dependsOn[0].attributes).toContain('IdentityPoolId');
  });
});
