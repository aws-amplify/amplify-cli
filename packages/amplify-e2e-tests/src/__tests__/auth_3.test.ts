import {
  initJSProjectWithProfile, deleteProject, amplifyPushAuth, setAmplifyAppIdInBackendAmplifyMeta,
} from 'amplify-e2e-core';
import {
  addAuthWithDefault,
  removeAuthWithDefault,
  addAuthWithMaxOptions,
  addAuthUserPoolOnly,
  getBackendAmplifyMeta,
} from 'amplify-e2e-core';
import {
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
  getUserPool,
  getUserPoolClients,
  getLambdaFunction,
} from 'amplify-e2e-core';
import _ from 'lodash';

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

  it('...should init a project and add auth with defaults and push, then remove auth and push should clean up trust relationship conditions', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot, {});
    await amplifyPushAuth(projRoot);

    const amplifyMeta = getBackendAmplifyMeta(projRoot);
    const { AuthRoleName, UnauthRoleName } = amplifyMeta.providers.awscloudformation;
    const cognitoResource = Object.values(amplifyMeta.auth).find((res: any) => res.service === 'Cognito') as any;
    const idpId = cognitoResource.output.IdentityPoolId;

    expect(AuthRoleName).toHaveValidPolicyConditionMatchingIdpId(idpId);
    expect(UnauthRoleName).toHaveValidPolicyConditionMatchingIdpId(idpId);

    await removeAuthWithDefault(projRoot);
    await amplifyPushAuth(projRoot);

    expect(AuthRoleName).not.toHaveValidPolicyConditionMatchingIdpId(idpId);
    expect(UnauthRoleName).not.toHaveValidPolicyConditionMatchingIdpId(idpId);
  });

  it('...should init a project with only user pool and no identity pool', async () => {
    await initJSProjectWithProfile(projRoot, { ...defaultsSettings, disableAmplifyAppCreation: false });
    //setAmplifyAppIdInBackendAmplifyMeta(projRoot);
    await addAuthUserPoolOnly(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[1].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);

    expect(userPool.UserPool).toBeDefined();
  });

  it('...should init a project where all possible options are selected', async () => {
    await initJSProjectWithProfile(projRoot, { ...defaultsSettings, disableAmplifyAppCreation: false });
    //setAmplifyAppIdInBackendAmplifyMeta(projRoot);
    await addAuthWithMaxOptions(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);

    const createFunctionName = `${Object.keys(meta.auth)[1]}CreateAuthChallenge-integtest`;
    const defineFunctionName = `${Object.keys(meta.auth)[1]}DefineAuthChallenge-integtest`;

    const authMeta = Object.keys(meta.auth).map(key => meta.auth[key])[1];
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
  });
});
