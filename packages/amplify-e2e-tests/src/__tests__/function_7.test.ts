import {
  addFunction,
  amplifyPushAuth,
  amplifyPushMissingFuncSecret,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getCategoryParameters,
  getParameters,
  getProjectMeta,
  getSSMParameters,
  initJSProjectWithProfile,
  invokeFunction,
  overrideFunctionCodeNode,
  removeFunction,
  setCategoryParameters,
  updateFunction,
} from 'amplify-e2e-core';
import { addEnvironment, addEnvironmentYes, removeEnvironment } from '../environment/env';

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
    const random = Math.floor(Math.random() * 10000);
    const funcName = `secretsTest${random}`;
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
    const random = Math.floor(Math.random() * 10000);
    const funcName = `secretsTest${random}`;
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
    const { AmplifyAppId: appId, Region: region } = meta?.providers?.awscloudformation;
    expect(appId).toBeDefined();
    const result = await getSSMParameters(region, appId, 'integtest', funcName, ['TEST_SECRET']);
    expect(result.InvalidParameters).toEqual([`/amplify/${appId}/integtest/AMPLIFY_${funcName}_TEST_SECRET`]);
    expect(result.Parameters.length).toBe(0);
  });

  it('removes secrets immediately when unpushed function is removed from project', async () => {
    // add func w/ secret
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
    const random = Math.floor(Math.random() * 10000);
    const funcName = `secretsTest${random}`;
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
    const { AmplifyAppId: appId, Region: region } = meta?.providers?.awscloudformation;
    expect(appId).toBeDefined();
    const result = await getSSMParameters(region, appId, 'integtest', funcName, ['TEST_SECRET']);
    expect(result.InvalidParameters).toEqual([`/amplify/${appId}/integtest/AMPLIFY_${funcName}_TEST_SECRET`]);
    expect(result.Parameters.length).toBe(0);
  });

  it('removes secrets on push when func is already pushed', async () => {
    // add func w/ secret
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
    const random = Math.floor(Math.random() * 10000);
    const funcName = `secretsTest${random}`;
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
    let meta = getProjectMeta(projRoot);
    let { AmplifyAppId: appId, Region: region } = meta?.providers?.awscloudformation;
    expect(appId).toBeDefined();
    let result = await getSSMParameters(region, appId, 'integtest', funcName, ['TEST_SECRET']);
    expect(result.Parameters.length).toBe(1);
    expect(result.Parameters[0].Name).toEqual(`/amplify/${appId}/integtest/AMPLIFY_${funcName}_TEST_SECRET`);
    expect(result.Parameters[0].Value).toEqual('testsecretvalue');
    expect(result.InvalidParameters.length).toBe(0);

    await amplifyPushAuth(projRoot);

    // check that ssm param doesn't exist
    meta = getProjectMeta(projRoot);
    ({ AmplifyAppId: appId, Region: region } = meta?.providers?.awscloudformation);
    expect(appId).toBeDefined();
    result = await getSSMParameters(region, appId, 'integtest', funcName, ['TEST_SECRET']);
    expect(result.InvalidParameters).toEqual([`/amplify/${appId}/integtest/AMPLIFY_${funcName}_TEST_SECRET`]);
    expect(result.Parameters.length).toBe(0);
  });

  it('removes secrets on push when pushed function is removed', async () => {
    // add func w/ secret
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
    const random = Math.floor(Math.random() * 10000);
    const funcName = `secretsTest${random}`;
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
    let meta = getProjectMeta(projRoot);
    let { AmplifyAppId: appId, Region: region } = meta?.providers?.awscloudformation;
    expect(appId).toBeDefined();
    let result = await getSSMParameters(region, appId, 'integtest', funcName, ['TEST_SECRET']);
    expect(result.Parameters.length).toBe(1);
    expect(result.Parameters[0].Name).toEqual(`/amplify/${appId}/integtest/AMPLIFY_${funcName}_TEST_SECRET`);
    expect(result.Parameters[0].Value).toEqual('testsecretvalue');
    expect(result.InvalidParameters.length).toBe(0);

    await amplifyPushAuth(projRoot);

    // check that ssm param doesn't exist
    meta = getProjectMeta(projRoot);
    ({ AmplifyAppId: appId, Region: region } = meta?.providers?.awscloudformation);
    expect(appId).toBeDefined();
    result = await getSSMParameters(region, appId, 'integtest', funcName, ['TEST_SECRET']);
    expect(result.InvalidParameters).toEqual([`/amplify/${appId}/integtest/AMPLIFY_${funcName}_TEST_SECRET`]);
    expect(result.Parameters.length).toBe(0);
  });

  it('removes / copies secrets when env removed / added, respectively', async () => {
    // add func w/ secret
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
    const random = Math.floor(Math.random() * 10000);
    const funcName = `secretsTest${random}`;
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
    let meta = getProjectMeta(projRoot);
    let { AmplifyAppId: appId, Region: region } = meta?.providers?.awscloudformation;
    expect(appId).toBeDefined();
    let result = await getSSMParameters(region, appId, newEnvName, funcName, ['TEST_SECRET']);
    expect(result.Parameters.length).toBe(1);
    expect(result.Parameters[0].Name).toEqual(`/amplify/${appId}/${newEnvName}/AMPLIFY_${funcName}_TEST_SECRET`);
    expect(result.Parameters[0].Value).toEqual('testsecretvalue');
    expect(result.InvalidParameters.length).toBe(0);

    await removeEnvironment(projRoot, { envName: 'integtest' });

    // check that ssm param doesn't exist in removed env
    meta = getProjectMeta(projRoot);
    ({ AmplifyAppId: appId, Region: region } = meta?.providers?.awscloudformation);
    expect(appId).toBeDefined();
    result = await getSSMParameters(region, appId, 'integtest', funcName, ['TEST_SECRET']);
    expect(result.InvalidParameters).toEqual([`/amplify/${appId}/integtest/AMPLIFY_${funcName}_TEST_SECRET`]);
    expect(result.Parameters.length).toBe(0);
  });

  it('prompts for missing secrets and removes unused secrets on push', async () => {
    // add func w/ secret
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
    const random = Math.floor(Math.random() * 10000);
    const funcName = `secretsTest${random}`;
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
    const { AmplifyAppId: appId, Region: region } = meta?.providers?.awscloudformation;
    expect(appId).toBeDefined();

    // check that old value is removed and new one is added
    const result = await getSSMParameters(region, appId, 'integtest', funcName, ['TEST_SECRET', 'A_NEW_SECRET']);
    expect(result.InvalidParameters).toEqual([`/amplify/${appId}/integtest/AMPLIFY_${funcName}_TEST_SECRET`]);
    expect(result.Parameters.length).toBe(1);
    expect(result.Parameters[0].Name).toEqual(`/amplify/${appId}/integtest/AMPLIFY_${funcName}_A_NEW_SECRET`);
    expect(result.Parameters[0].Value).toEqual('anewtestsecretvalue');
  });
});
