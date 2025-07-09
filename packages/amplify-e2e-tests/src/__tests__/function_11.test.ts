import {
  addFunction,
  amplifyPush,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getBackendConfig,
  initJSProjectWithProfile,
  getProjectMeta,
  getFunction,
  functionBuild,
  invokeFunction,
  updateApiSchema,
  generateRandomShortId,
  addApi,
} from '@aws-amplify/amplify-e2e-core';

describe('Lambda AppSync nodejs:', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('lambda-appsync-nodejs');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('Test case for when API is not present', async () => {
    const projName = `iammodel${generateRandomShortId()}`;

    await initJSProjectWithProfile(projRoot, { name: projName });
    await addFunction(
      projRoot,
      {
        functionTemplate: 'AppSync - GraphQL API request (with IAM)',
        expectFailure: true,
        additionalPermissions: {
          permissions: ['api'],
          choices: ['api'],
          resources: ['Test_API'],
          operations: ['Query'],
        },
      },
      'nodejs',
    );
  });

  it('Test case for when IAM Auth is not present', async () => {
    const projName = `iammodel${generateRandomShortId()}`;

    await initJSProjectWithProfile(projRoot, { name: projName });

    await addApi(projRoot, {
      'API key': {},
    });

    expect(getBackendConfig(projRoot)).toBeDefined();

    await addFunction(
      projRoot,
      {
        functionTemplate: 'AppSync - GraphQL API request (with IAM)',
        expectFailure: true,
      },
      'nodejs',
    );
  });

  it('Test case when IAM is set as default auth', async () => {
    const projName = `iammodel${generateRandomShortId()}`;

    await initJSProjectWithProfile(projRoot, { name: projName });

    await addApi(projRoot, { IAM: {}, transformerVersion: 2 });
    await updateApiSchema(projRoot, projName, 'iam_simple_model.graphql');

    expect(getBackendConfig(projRoot)).toBeDefined();

    const beforeMeta = getBackendConfig(projRoot);
    const apiName = Object.keys(beforeMeta.api)[0];

    expect(apiName).toBeDefined();

    await addFunction(
      projRoot,
      {
        functionTemplate: 'AppSync - GraphQL API request (with IAM)',
        additionalPermissions: {
          permissions: ['api'],
          choices: ['api'],
          resources: [apiName],
          operations: ['Query'],
        },
      },
      'nodejs',
    );

    await functionBuild(projRoot);
    await amplifyPush(projRoot);

    const meta = getProjectMeta(projRoot);
    const { Arn: functionArn, Name: functionName, Region: region } = Object.keys(meta.function).map((key) => meta.function[key])[0].output;

    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();

    const cloudFunction = await getFunction(functionName, region);
    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);

    const payloadObj = { test: 'test' };
    const fnResponse = await invokeFunction(functionName, JSON.stringify(payloadObj), region);

    expect(fnResponse.StatusCode).toBe(200);
    expect(fnResponse.Payload).toBeDefined();

    const gqlResponse = JSON.parse(fnResponse.Payload.toString());

    expect(gqlResponse.body).toBeDefined();
  });

  it('Test case for when IAM auth is set as secondary auth type', async () => {
    const projName = `iammodel${generateRandomShortId()}`;
    await initJSProjectWithProfile(projRoot, { name: projName });
    await addApi(projRoot, { transformerVersion: 2, 'API key': {}, IAM: {} });
    await updateApiSchema(projRoot, projName, 'iam_simple_model.graphql');

    expect(getBackendConfig(projRoot)).toBeDefined();

    const beforeMeta = getBackendConfig(projRoot);
    const apiName = Object.keys(beforeMeta.api)[0];

    expect(apiName).toBeDefined();

    await addFunction(
      projRoot,
      {
        functionTemplate: 'AppSync - GraphQL API request (with IAM)',
        additionalPermissions: {
          permissions: ['api'],
          choices: ['api'],
          resources: [apiName],
          operations: ['Query'],
        },
      },
      'nodejs',
    );

    await functionBuild(projRoot);
    await amplifyPush(projRoot);

    const meta = getProjectMeta(projRoot);
    const { Arn: functionArn, Name: functionName, Region: region } = Object.keys(meta.function).map((key) => meta.function[key])[0].output;

    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();

    const cloudFunction = await getFunction(functionName, region);
    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);

    const payloadObj = { test: 'test' };
    const fnResponse = await invokeFunction(functionName, JSON.stringify(payloadObj), region);

    expect(fnResponse.StatusCode).toBe(200);
    expect(fnResponse.Payload).toBeDefined();

    const gqlResponse = JSON.parse(fnResponse.Payload.toString());

    expect(gqlResponse.body).toBeDefined();
  });
});
