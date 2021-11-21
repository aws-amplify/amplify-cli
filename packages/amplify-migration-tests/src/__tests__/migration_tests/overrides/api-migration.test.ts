import {
  addHeadlessApi,
  amplifyPush,
  amplifyPushUpdate,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppSyncApi,
  getCLIInputs,
  getProjectConfig,
  getProjectMeta,
  getProjectSchema,
  getSchemaPath,
  getTransformConfig,
  initJSProjectWithProfile,
  updateApiSchema,
  updateApiWithMultiAuth,
  updateAPIWithResolutionStrategyWithModels,
  updateHeadlessApi,
} from 'amplify-e2e-core';
import { AddApiRequest, UpdateApiRequest } from 'amplify-headless-interface';
import * as fs from 'fs-extra';
import { TRANSFORM_BASE_VERSION, TRANSFORM_CURRENT_VERSION } from 'graphql-transformer-core';
import { join } from 'path';
import { addApiWithoutSchemaOldDx, addApiWithSchemaAndConflictDetectionOldDx } from '../../../migration-helpers';

describe('api migration update test', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('graphql-api');
  });

  afterEach(async () => {
    const metaFilePath = join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (fs.existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it('api update migration with multiauth', async () => {
    // init and add api with installed CLI
    await initJSProjectWithProfile(projRoot, { name: 'simplemodelmultiauth' });
    await addApiWithoutSchemaOldDx(projRoot);
    await updateApiSchema(projRoot, 'simplemodelmultiauth', 'simple_model.graphql');
    await amplifyPush(projRoot);
    // update and push with codebase
    await updateApiWithMultiAuth(projRoot, { testingWithLatestCodebase: true });
    // cli-inputs should exist
    expect(getCLIInputs(projRoot, 'api', 'simplemodelmultiauth')).toBeDefined();
    await amplifyPushUpdate(projRoot, undefined, true, true);

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

  it('init a sync enabled project and update conflict resolution strategy', async () => {
    const name = `syncenabled`;
    // init and add api with locally installed cli
    await initJSProjectWithProfile(projRoot, { name });
    await addApiWithSchemaAndConflictDetectionOldDx(projRoot, 'simple_model.graphql');
    await amplifyPush(projRoot);
    let transformConfig = getTransformConfig(projRoot, name);
    expect(transformConfig).toBeDefined();
    expect(transformConfig.ResolverConfig).toBeDefined();
    expect(transformConfig.ResolverConfig.project).toBeDefined();
    expect(transformConfig.ResolverConfig.project.ConflictDetection).toEqual('VERSION');
    expect(transformConfig.ResolverConfig.project.ConflictHandler).toEqual('AUTOMERGE');

    //update and push with codebase
    await updateAPIWithResolutionStrategyWithModels(projRoot, { testingWithLatestCodebase: true });
    expect(getCLIInputs(projRoot, 'api', 'syncenabled')).toBeDefined();
    transformConfig = getTransformConfig(projRoot, name);
    expect(transformConfig).toBeDefined();
    expect(transformConfig.Version).toBeDefined();
    expect(transformConfig.Version).toEqual(TRANSFORM_CURRENT_VERSION);
    expect(transformConfig.ResolverConfig).toBeDefined();
    expect(transformConfig.ResolverConfig.project).toBeDefined();
    expect(transformConfig.ResolverConfig.project.ConflictDetection).toEqual('VERSION');
    expect(transformConfig.ResolverConfig.project.ConflictHandler).toEqual('OPTIMISTIC_CONCURRENCY');

    await amplifyPushUpdate(projRoot, undefined, true, true);
    const meta = getProjectMeta(projRoot);
    const { output } = meta.api[name];
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    const { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, meta.providers.awscloudformation.Region);

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
  });

  const addApiRequest: AddApiRequest = {
    version: 1,
    serviceConfiguration: {
      serviceName: 'AppSync',
      apiName: 'myApiName',
      transformSchema: fs.readFileSync(getSchemaPath('simple_model.graphql'), 'utf8'),
      defaultAuthType: {
        mode: 'API_KEY',
      },
    },
  };

  const updateApiRequest: UpdateApiRequest = {
    version: 1,
    serviceModification: {
      serviceName: 'AppSync',
      transformSchema: fs.readFileSync(getSchemaPath('simple_model_override.graphql'), 'utf8'),
      defaultAuthType: {
        mode: 'AWS_IAM',
      },
      additionalAuthTypes: [
        {
          mode: 'API_KEY',
        },
      ],
      conflictResolution: {
        defaultResolutionStrategy: {
          type: 'OPTIMISTIC_CONCURRENCY',
        },
      },
    },
  };
  it('updates AppSync API in headless mode', async () => {
    const name = `simplemodelv${TRANSFORM_BASE_VERSION}`;
    await initJSProjectWithProfile(projRoot, {});
    await addHeadlessApi(projRoot, addApiRequest, {
      allowDestructiveUpdates: false,
      testingWithLatestCodebase: false,
    });
    await amplifyPush(projRoot);
    await updateHeadlessApi(projRoot, updateApiRequest, true);
    expect(getCLIInputs(projRoot, 'api', 'myApiName')).toBeDefined();
    await amplifyPushUpdate(projRoot, undefined, undefined, true);

    //verify
    const meta = getProjectMeta(projRoot);
    const { output } = meta.api.myApiName;
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    const { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, meta.providers.awscloudformation.Region);

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);

    expect(getTransformConfig(projRoot, 'myApiName')).toMatchSnapshot();
    expect(output.authConfig).toMatchSnapshot();
    expect(getProjectSchema(projRoot, 'myApiName')).toMatchSnapshot();
  });
});
