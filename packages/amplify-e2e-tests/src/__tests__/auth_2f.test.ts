/* eslint-disable spellcheck/spell-checker */
import {
  amplifyPushAuth,
  addAuthWithRecaptchaTrigger,
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
    process.env.AMPLIFY_ENABLE_DEBUG_OUTPUT = 'true';
    projRoot = await createNewProjectDir('auth');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('...should init a project and add 3 custom auth flow triggers for Google reCaptcha', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithRecaptchaTrigger(projRoot);
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);

    const createFunctionName = `${Object.keys(meta.auth)[0]}CreateAuthChallenge-integtest`;
    const defineFunctionName = `${Object.keys(meta.auth)[0]}DefineAuthChallenge-integtest`;
    const verifyFunctionName = `${Object.keys(meta.auth)[0]}VerifyAuthChallengeResponse-integtest`;

    const authMeta = Object.keys(meta.auth).map((key) => meta.auth[key])[0];
    const id = authMeta.output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const clientIds = [authMeta.output.AppClientIDWeb, authMeta.output.AppClientID];
    const clients = await getUserPoolClients(id, clientIds, meta.providers.awscloudformation.Region);

    const createFunction = await getLambdaFunction(createFunctionName, meta.providers.awscloudformation.Region);
    const defineFunction = await getLambdaFunction(defineFunctionName, meta.providers.awscloudformation.Region);
    const verifyFunction = await getLambdaFunction(verifyFunctionName, meta.providers.awscloudformation.Region);

    expect(userPool.UserPool).toBeDefined();
    validateNodeModulesDirRemoval(projRoot);
    expect(clients).toHaveLength(2);
    expect(createFunction).toBeDefined();
    expect(defineFunction).toBeDefined();
    expect(verifyFunction).toBeDefined();
    expect(verifyFunction.Configuration.Environment.Variables.RECAPTCHASECRET).toEqual('dummykey');
  });
});
