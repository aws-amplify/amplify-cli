import {
  amplifyPush,
  amplifyPushUpdate,
  deleteProject,
  initFlutterProjectWithProfile,
  initJSProjectWithProfile,
  addApiWithSchema,
  updateApiSchema,
  updateApiWithMultiAuth,
  createNewProjectDir,
  deleteProjectDir,
  getAppSyncApi,
  getProjectMeta,
  getTransformConfig,
  initIosProjectWithProfile,
  getDDBTable,
  removeHeadlessApi,
  getAwsIOSConfig,
  getAmplifyIOSConfig,
  amplifyPushWithoutCodegen,
  addFunction,
  getTable,
  amplifyPushUpdateForDependentModel,
} from 'amplify-e2e-core';
import path from 'path';
import { existsSync } from 'fs';
import { TRANSFORM_CURRENT_VERSION } from 'graphql-transformer-core';
import _ from 'lodash';

describe('amplify add api (GraphQL)', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('graphql-api');
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it('init a project and add the simple_model api', async () => {
    const envName = 'devtest';
    await initJSProjectWithProfile(projRoot, { name: 'simplemodel', envName });
    await addApiWithSchema(projRoot, 'simple_model.graphql');
    await amplifyPush(projRoot);

    const meta = getProjectMeta(projRoot);
    const region = meta.providers.awscloudformation.Region;
    const { output } = meta.api.simplemodel;
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    const { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, region);

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
    const tableName = `AmplifyDataStore-${graphqlApi.apiId}-${envName}`;
    const error = { message: null };
    try {
      const table = await getDDBTable(tableName, region);
      expect(table).toBeUndefined();
    } catch (ex) {
      Object.assign(error, ex);
    }
    expect(error).toBeDefined();
    expect(error.message).toContain(`${tableName} not found`);
  });

  it('init a project then add and remove api', async () => {
    const envName = 'devtest';
    await initIosProjectWithProfile(projRoot, { name: 'simplemodel', envName });
    await addApiWithSchema(projRoot, 'simple_model.graphql');
    await amplifyPush(projRoot);

    let meta = getProjectMeta(projRoot);
    const { output } = meta.api.simplemodel;
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    await removeHeadlessApi(projRoot, 'simplemodel');
    await amplifyPushUpdate(projRoot);

    meta = getProjectMeta(projRoot);
    expect(meta.api.simplemodle).toBeUndefined();
    const awsConfig: any = getAwsIOSConfig(projRoot);
    expect('AppSync' in awsConfig).toBe(false);
    const amplifyConfig: any = getAmplifyIOSConfig(projRoot);
    expect('api' in amplifyConfig).toBe(false);
  });

  it('init a Flutter project and add the simple_model api', async () => {
    const envName = 'devtest';
    await initFlutterProjectWithProfile(projRoot, { name: 'simplemodel', envName });
    await addApiWithSchema(projRoot, 'simple_model.graphql');
    await amplifyPushWithoutCodegen(projRoot);

    const meta = getProjectMeta(projRoot);
    const region = meta.providers.awscloudformation.Region;
    const { output } = meta.api.simplemodel;
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    const { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, region);

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
    const tableName = `AmplifyDataStore-${graphqlApi.apiId}-${envName}`;
    const error = { message: null };
    try {
      const table = await getDDBTable(tableName, region);
      expect(table).toBeUndefined();
    } catch (ex) {
      Object.assign(error, ex);
    }
    expect(error).toBeDefined();
    expect(error.message).toContain(`${tableName} not found`);
  });

  it('inits a project with a simple model and then migrates the api', async () => {
    const projectName = 'blogapp';
    const initialSchema = 'initial_key_blog.graphql';
    const nextSchema = 'next_key_blog.graphql';
    await initJSProjectWithProfile(projRoot, { name: projectName });
    await addApiWithSchema(projRoot, initialSchema);
    await amplifyPush(projRoot);
    updateApiSchema(projRoot, projectName, nextSchema);
    await amplifyPushUpdate(projRoot);
    const { output } = getProjectMeta(projRoot).api[projectName];
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();
  });

  it('init a project and add the simple_model api with multiple authorization providers', async () => {
    await initJSProjectWithProfile(projRoot, { name: 'simplemodelmultiauth' });
    await addApiWithSchema(projRoot, 'simple_model.graphql');
    await updateApiWithMultiAuth(projRoot, {});
    await amplifyPush(projRoot);

    const meta = getProjectMeta(projRoot);
    const { output } = meta.api.simplemodelmultiauth;
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    const { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, meta.providers.awscloudformation.Region);

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.authenticationType).toEqual('API_KEY');
    expect(graphqlApi.additionalAuthenticationProviders).toHaveLength(3);
    expect(graphqlApi.additionalAuthenticationProviders).toHaveLength(3);

    const cognito = graphqlApi.additionalAuthenticationProviders.filter(a => a.authenticationType === 'AMAZON_COGNITO_USER_POOLS')[0];

    expect(cognito).toBeDefined();
    expect(cognito.userPoolConfig).toBeDefined();

    const iam = graphqlApi.additionalAuthenticationProviders.filter(a => a.authenticationType === 'AWS_IAM')[0];

    expect(iam).toBeDefined();

    const oidc = graphqlApi.additionalAuthenticationProviders.filter(a => a.authenticationType === 'OPENID_CONNECT')[0];

    expect(oidc).toBeDefined();
    expect(oidc.openIDConnectConfig).toBeDefined();
    expect(oidc.openIDConnectConfig.issuer).toEqual('https://facebook.com/');
    expect(oidc.openIDConnectConfig.clientId).toEqual('clientId');
    expect(oidc.openIDConnectConfig.iatTTL).toEqual(1000);
    expect(oidc.openIDConnectConfig.authTTL).toEqual(2000);

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
  });

  it('init a project and add the simple_model api, match transformer version to current version', async () => {
    const name = `simplemodelv${TRANSFORM_CURRENT_VERSION}`;
    await initJSProjectWithProfile(projRoot, { name });
    await addApiWithSchema(projRoot, 'simple_model.graphql');
    await amplifyPush(projRoot);

    const meta = getProjectMeta(projRoot);
    const { output } = meta.api[name];
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    const { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, meta.providers.awscloudformation.Region);

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);

    const transformConfig = getTransformConfig(projRoot, name);
    expect(transformConfig).toBeDefined();
    expect(transformConfig.Version).toBeDefined();
    expect(transformConfig.Version).toEqual(TRANSFORM_CURRENT_VERSION);
  });

  it('inits a project with a simple model , add a function and removes the depedent @model', async () => {
    const random = Math.floor(Math.random() * 10000);
    const projectName = `blogapp`;
    const nextSchema = 'initial_key_blog.graphql';
    const initialSchema = 'two-model-schema.graphql';
    const fnName = `integtestfn${random}`;
    await initJSProjectWithProfile(projRoot, { name: projectName });
    await addApiWithSchema(projRoot, initialSchema);
    await addFunction(
      projRoot,
      {
        name: fnName,
        functionTemplate: 'Hello World',
        additionalPermissions: {
          permissions: ['storage'],
          choices: ['api', 'storage'],
          resources: ['Comment:@model(appsync)'],
          resourceChoices: ['Post:@model(appsync)', 'Comment:@model(appsync)'],
          operations: ['read'],
        },
      },
      'nodejs',
    );
    await amplifyPush(projRoot);
    updateApiSchema(projRoot, projectName, nextSchema);
    await amplifyPushUpdateForDependentModel(projRoot);
    const meta = getProjectMeta(projRoot);
    const region = meta.providers.awscloudformation.Region;
    const { output } = meta.api.blogapp;
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    const { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, region);

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
    const tableName = `Comment-${GraphQLAPIIdOutput}-integtest`;
    const error = { message: null };
    try {
      const table = await getDDBTable(tableName, region);
      expect(table).toBeUndefined();
    } catch (ex) {
      Object.assign(error, ex);
    }
    expect(error).toBeDefined();
    expect(error.message).toContain(`${tableName} not found`);
  });
});
