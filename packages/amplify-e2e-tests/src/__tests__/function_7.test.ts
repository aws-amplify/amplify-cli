import {
  addFunction,
  amplifyPushAuth,
  amplifyPushMissingFuncSecret,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  generateRandomShortId,
  getCategoryParameters,
  getProjectMeta,
  getSSMParameters,
  initJSProjectWithProfile,
  invokeFunction,
  overrideFunctionCodeNode,
  removeFunction,
  setCategoryParameters,
  updateFunction,
} from '@aws-amplify/amplify-e2e-core';
import { addEnvironmentYes, checkoutEnvironment, removeEnvironment } from '../environment/env';

describe('function secret value', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('funcsecrets');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('configures secret that is accessible in the cloud', async () => {
    // add func with secret
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
    const funcName = `secretsTest${generateRandomShortId()}`;
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

    const lambdaEvent = {
      secretNames: ['TEST_SECRET'],
    };

    const meta = getProjectMeta(projRoot);
    const { Region: region } = (Object.values(meta.function)[0] as any).output;

    // check that the lambda response includes the secret value
    const response = await invokeFunction(`${funcName}-integtest`, JSON.stringify(lambdaEvent), region);
    expect(JSON.parse(response.Payload.toString())[0]?.Value).toEqual('testsecretvalue');
  });

  it('removes secrets immediately when func not pushed', async () => {
    // add func w/ secret
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
    const funcName = `secretsTest${generateRandomShortId()}`;
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

    // remove secret
    await updateFunction(
      projRoot,
      {
        secretsConfig: {
          operation: 'delete',
          name: 'TEST_SECRET',
        },
      },
      'nodejs',
    );

    // check that ssm param doesn't exist
    const meta = getProjectMeta(projRoot);
    const { AmplifyAppId: appId, Region: region } = meta!.providers!.awscloudformation;
    expect(appId).toBeDefined();
    await expectParams([], ['TEST_SECRET'], region, appId, 'integtest', funcName);
  });

  it('removes secrets immediately when unpushed function is removed from project', async () => {
    // add func w/ secret
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
    const funcName = `secretsTest${generateRandomShortId()}`;
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

    await removeFunction(projRoot, funcName);

    // check that ssm param doesn't exist
    const meta = getProjectMeta(projRoot);
    const { AmplifyAppId: appId, Region: region } = meta!.providers!.awscloudformation;
    expect(appId).toBeDefined();
    await expectParams([], ['TEST_SECRET'], region, appId, 'integtest', funcName);
  });

  it('removes secrets on push when func is already pushed', async () => {
    // add func w/ secret
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
    const funcName = `secretsTest${generateRandomShortId()}`;
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

    await amplifyPushAuth(projRoot);

    // remove secret
    await updateFunction(
      projRoot,
      {
        secretsConfig: {
          operation: 'delete',
          name: 'TEST_SECRET',
        },
      },
      'nodejs',
    );

    // check that ssm param still exists
    const meta = getProjectMeta(projRoot);
    const { AmplifyAppId: appId, Region: region } = meta!.providers!.awscloudformation;
    expect(appId).toBeDefined();
    await expectParams([{ name: 'TEST_SECRET', value: 'testsecretvalue' }], [], region, appId, 'integtest', funcName);

    await amplifyPushAuth(projRoot);

    // check that ssm param doesn't exist
    await expectParams([], ['TEST_SECRET'], region, appId, 'integtest', funcName);
  });

  it('removes secrets on push when pushed function is removed', async () => {
    // add func w/ secret
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
    const funcName = `secretsTest${generateRandomShortId()}`;
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

    await amplifyPushAuth(projRoot);

    // remove function
    await removeFunction(projRoot, funcName);

    // check that ssm param still exists
    const meta = getProjectMeta(projRoot);
    const { AmplifyAppId: appId, Region: region } = meta!.providers!.awscloudformation;
    expect(appId).toBeDefined();
    await expectParams([{ name: 'TEST_SECRET', value: 'testsecretvalue' }], [], region, appId, 'integtest', funcName);

    await amplifyPushAuth(projRoot);

    // check that ssm param doesn't exist
    await expectParams([], ['TEST_SECRET'], region, appId, 'integtest', funcName);
  });

  it('removes / copies secrets when env removed / added, respectively', async () => {
    // add func w/ secret
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
    const funcName = `secretsTest${generateRandomShortId()}`;
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

    const newEnvName = 'testtest';
    await addEnvironmentYes(projRoot, { envName: newEnvName });

    // check that ssm param exists for new env
    const meta = getProjectMeta(projRoot);
    const { AmplifyAppId: appId, Region: region } = meta!.providers!.awscloudformation;
    expect(appId).toBeDefined();
    await expectParams([{ name: 'TEST_SECRET', value: 'testsecretvalue' }], [], region, appId, newEnvName, funcName);

    await removeEnvironment(projRoot, { envName: 'integtest' });

    // check that ssm param doesn't exist in removed env
    await expectParams([], ['TEST_SECRET'], region, appId, 'integtest', funcName);
  });

  it('prompts for missing secrets and removes unused secrets on push', async () => {
    // add func w/ secret
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
    const funcName = `secretsTest${generateRandomShortId()}`;
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

    await amplifyPushAuth(projRoot);

    // replace contents of function-parameters.json with a different secret name
    // this will make amplify think the original secret has been removed and a new one has been added
    const funcParams = getCategoryParameters(projRoot, 'function', funcName);
    funcParams.secretNames = ['A_NEW_SECRET'];
    setCategoryParameters(projRoot, 'function', funcName, funcParams);
    // trigger a func update
    overrideFunctionCodeNode(projRoot, funcName, 'retrieve-secret.js');

    // push -> should prompt for value for new secret
    await amplifyPushMissingFuncSecret(projRoot, 'anewtestsecretvalue');

    const meta = getProjectMeta(projRoot);
    const { AmplifyAppId: appId, Region: region } = meta!.providers!.awscloudformation;
    expect(appId).toBeDefined();

    // check that old value is removed and new one is added
    await expectParams([{ name: 'A_NEW_SECRET', value: 'anewtestsecretvalue' }], ['TEST_SECRET'], region, appId, 'integtest', funcName);
  });

  it('keeps old secrets when pushing secrets added in another env', async () => {
    // add func w/ secret
    const envName = 'enva';
    await initJSProjectWithProfile(projRoot, { envName, disableAmplifyAppCreation: false });
    const funcName = `secretsTest${generateRandomShortId()}`;
    const funcSecretName = 'TEST_SECRET';
    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        name: funcName,
        secretsConfig: {
          operation: 'add',
          name: funcSecretName,
          value: 'testsecretvalue',
        },
      },
      'nodejs',
    );

    await amplifyPushAuth(projRoot);

    // add new env and add new secret to func
    await addEnvironmentYes(projRoot, { envName: 'envb' });
    await amplifyPushAuth(projRoot);
    const newFuncSecretName = 'NEW_TEST_SECRET';
    await updateFunction(
      projRoot,
      {
        secretsConfig: {
          operation: 'add',
          name: newFuncSecretName,
          value: 'testsecretvalue',
        },
      },
      'nodejs',
    );

    // push updated func w/ new secret
    await amplifyPushAuth(projRoot);

    await checkoutEnvironment(projRoot, { envName });

    // check contents of function-parameters.json for new secret
    const expectedFuncSecrets = [funcSecretName, newFuncSecretName];
    const funcParams = getCategoryParameters(projRoot, 'function', funcName);
    expect(funcParams.secretNames).toEqual(expectedFuncSecrets);

    // push with original env and assert all secrets are in function-parameters.json
    await amplifyPushMissingFuncSecret(projRoot, 'anewtestsecretvalue');
    const funcParamsPostPush = getCategoryParameters(projRoot, 'function', funcName);
    expect(funcParamsPostPush.secretNames).toEqual(expectedFuncSecrets);
  });
});

const expectParams = async (
  expectToExist: NameValuePair[],
  expectNotExist: string[],
  region: string,
  appId: string,
  envName: string,
  funcName: string,
) => {
  const result = await getSSMParameters(region, appId, envName, funcName, expectToExist.map((exist) => exist.name).concat(expectNotExist));

  const mapName = (name: string) => `/amplify/${appId}/${envName}/AMPLIFY_${funcName}_${name}`;

  expect(result.InvalidParameters.length).toBe(expectNotExist.length);
  expect(result.InvalidParameters.sort()).toEqual(expectNotExist.map(mapName).sort());

  expect(result.Parameters.length).toBe(expectToExist.length);
  const mappedResult = result.Parameters.map((param) => ({ name: param.Name, value: param.Value })).sort(sortByName);
  const mappedExpect = expectToExist
    .map((exist) => ({ name: `/amplify/${appId}/${envName}/AMPLIFY_${funcName}_${exist.name}`, value: exist.value }))
    .sort(sortByName);
  expect(mappedResult).toEqual(mappedExpect);
};

const sortByName = (a: NameValuePair, b: NameValuePair) => a.name.localeCompare(b.name);

type NameValuePair = { name: string; value: string };
