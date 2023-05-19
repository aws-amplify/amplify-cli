import {
  addAuthWithDefaultSocial,
  addFunction,
  amplifyPushAuth,
  checkIfBucketExists,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  generateRandomShortId,
  getAmplifyInitConfig,
  getAwsProviderConfig,
  getProjectConfig,
  getProjectMeta,
  initJSProjectWithProfile,
  invokeFunction,
  nonInteractiveInitAttach,
  nonInteractiveInitWithForcePushAttach,
  overrideFunctionCodeNode,
  putSSMParameter,
  updateFunction,
} from '@aws-amplify/amplify-e2e-core';
import { addEnvironmentYes, listEnvironment, checkoutEnvironment } from '../environment/env';

const validateSecretWithLambda = async (projRoot: string, funcName: string, envName: string): Promise<void> => {
  const lambdaEvent = {
    secretNames: ['TEST_SECRET'],
  };

  const meta = getProjectMeta(projRoot);
  const { Region: region } = (Object.values(meta.function)[0] as any).output;

  // check that the lambda response includes the secret value
  const response = await invokeFunction(`${funcName}-${envName}`, JSON.stringify(lambdaEvent), region);
  expect(JSON.parse(response.Payload.toString())[0]?.Value).toEqual('testsecretvalue');
};

describe('environment commands with functions secrets handling', () => {
  let projRoot: string;
  const enva = 'dev';
  const envb = 'test';
  const funcName = `secretsTest${generateRandomShortId()}`;
  const funcName1 = `secretsTest${generateRandomShortId()}`;
  beforeAll(async () => {
    projRoot = await createNewProjectDir('env-test');
    // add func with secret
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false, envName: enva });
    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        name: funcName,
        secretsConfig: {
          operation: 'add',
          name: 'TEST_SECRET',
          value: 'testsecretvalue',
        },
      },
      'nodejs',
    );
    // override lambda code to fetch the secret and return the value
    overrideFunctionCodeNode(projRoot, funcName, 'retrieve-secret.js');
    await amplifyPushAuth(projRoot);
    await validateSecretWithLambda(projRoot, funcName, 'dev');
  });

  afterAll(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('headless case', async () => {
    await addEnvironmentYes(projRoot, { envName: 'next' });
    await listEnvironment(projRoot, { numEnv: 2 });
    const { projectName } = getProjectConfig(projRoot);
    await nonInteractiveInitWithForcePushAttach(projRoot, getAmplifyInitConfig(projectName, 'next'), getAwsProviderConfig());
    await validateSecretWithLambda(projRoot, funcName, 'next');
    // add a new function with secrets
    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        name: funcName1,
        secretsConfig: {
          operation: 'add',
          name: 'TEST_SECRET1',
          value: 'testsecretvalue1',
        },
      },
      'nodejs',
    );

    // remove the previous function
    await updateFunction(
      projRoot,
      {
        name: funcName,
        secretsConfig: {
          operation: 'delete',
          name: 'TEST_SECRET',
        },
      },
      'nodejs',
    );
    await nonInteractiveInitWithForcePushAttach(projRoot, getAmplifyInitConfig(projectName, 'next'), getAwsProviderConfig());
    await checkoutEnvironment(projRoot, { envName: 'dev' });
    // should fail
    await expect(
      nonInteractiveInitWithForcePushAttach(projRoot, getAmplifyInitConfig(projectName, 'dev'), getAwsProviderConfig()),
    ).rejects.toThrow();
    // add secret in parameter store
    await addParameterToParameterStore(projRoot, 'dev', funcName1, 'TEST_SECRET1', 'testsecretvalue1');
    // should pass
    await nonInteractiveInitWithForcePushAttach(projRoot, getAmplifyInitConfig(projectName, 'dev'), getAwsProviderConfig());
  });
});

const addParameterToParameterStore = async (
  projRoot: string,
  envName: string,
  funcName: string,
  parameterName: string,
  parameterValue: string,
) => {
  const meta = getProjectMeta(projRoot);
  const { AmplifyAppId: appId, Region: region } = meta?.providers?.awscloudformation;
  expect(appId).toBeDefined();
  const key = `/amplify/${appId}/${envName}/AMPLIFY_${funcName}_${parameterName}`;
  await putSSMParameter(region, appId, envName, funcName, key, parameterValue);
};
