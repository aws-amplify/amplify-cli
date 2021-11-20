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
  updateApiSchema,
  updateApiWithMultiAuth,
  updateAPIWithResolutionStrategyWithModels,
  updateHeadlessApi,
} from 'amplify-e2e-core';
import { AddApiRequest, UpdateApiRequest } from 'amplify-headless-interface';
import * as fs from 'fs-extra';
import { TRANSFORM_BASE_VERSION, TRANSFORM_CURRENT_VERSION } from 'graphql-transformer-core';
import { join } from 'path';
import {
  addApiWithoutSchemaOldDx,
  addApiWithSchemaAndConflictDetectionOldDx,
  allowedVersionsToMigrateFrom,
  initJSProjectWithProfile,
  versionCheck,
} from '../../migration-helpers';

describe('api migration update test', () => {
  let projRoot: string;

  beforeAll(async () => {
    const migrateFromVersion = { v: 'unintialized' };
    const migrateToVersion = { v: 'unintialized' };
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
  });

  beforeEach(async () => {
    projRoot = await createNewProjectDir('graphql-api');
    await initJSProjectWithProfile(projRoot, { name: 'apimigration' });
  });

  afterEach(async () => {
    const metaFilePath = join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot, null, true);
    }
    deleteProjectDir(projRoot);
  });

  it('init and add api with installed CLI then migrate for update and push', async () => {
    const initialSchema = 'initial_key_blog.graphql';
    const nextSchema = 'next_key_blog.graphql';
    // init the project and add api with installed cli
    const { projectName } = getProjectConfig(projRoot);
    await addApiWithoutSchemaOldDx(projRoot);
    updateApiSchema(projRoot, projectName, initialSchema);
    await amplifyPush(projRoot);

    // update api and push with the CLI to be released (the codebase)
    updateApiSchema(projRoot, projectName, nextSchema);
    expect(getCLIInputs(projRoot, 'api', projectName)).not.toBeDefined();
    // cli-inputs ot defined
    await amplifyPushUpdate(projRoot, undefined, true);
    const { output } = getProjectMeta(projRoot).api[projectName];
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();
  });

  it('api update migration with multiauth', async () => {
    // init and add api with installed CLI
    const { projectName } = getProjectConfig(projRoot);
    await addApiWithoutSchemaOldDx(projRoot);
    updateApiSchema(projRoot, projectName, 'simple_model.graphql');
    // update and push with codebase
    await updateApiWithMultiAuth(projRoot, { testingWithLatestCodebase: true });
    // cli-inputs should exist
    expect(getCLIInputs(projRoot, 'api', 'simplemodelmultiauth')).toBeDefined();
    expect(getCLIInputs(projRoot, 'api', 'simplemodelmultiauth')).toMatchSnapshot();
    await amplifyPush(projRoot, true);

    const meta = getProjectMeta(projRoot);
    const { output } = meta.api[projectName];
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
    // add api with locally installed cli
    const { projectName: name } = getProjectConfig(projRoot);
    await addApiWithSchemaAndConflictDetectionOldDx(projRoot, 'simple_model.graphql');

    let transformConfig = getTransformConfig(projRoot, name);
    expect(transformConfig).toBeDefined();
    expect(transformConfig.ResolverConfig).toBeDefined();
    expect(transformConfig.ResolverConfig.project).toBeDefined();
    expect(transformConfig.ResolverConfig.project.ConflictDetection).toEqual('VERSION');
    expect(transformConfig.ResolverConfig.project.ConflictHandler).toEqual('AUTOMERGE');

    //update and push with codebase
    await updateAPIWithResolutionStrategyWithModels(projRoot, { testingWithLatestCodebase: true });
    expect(getCLIInputs(projRoot, 'api', 'simplemodelmultiauth')).toBeDefined();
    expect(getCLIInputs(projRoot, 'api', 'simplemodelmultiauth')).toMatchSnapshot();
    transformConfig = getTransformConfig(projRoot, name);
    expect(transformConfig).toBeDefined();
    expect(transformConfig.Version).toBeDefined();
    expect(transformConfig.Version).toEqual(TRANSFORM_CURRENT_VERSION);
    expect(transformConfig.ResolverConfig).toBeDefined();
    expect(transformConfig.ResolverConfig.project).toBeDefined();
    expect(transformConfig.ResolverConfig.project.ConflictDetection).toEqual('VERSION');
    expect(transformConfig.ResolverConfig.project.ConflictHandler).toEqual('OPTIMISTIC_CONCURRENCY');

    await amplifyPush(projRoot, true);
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
  it.only('updates AppSync API in headless mode', async () => {
    const name = `simplemodelv${TRANSFORM_BASE_VERSION}`;
    await initJSProjectWithProfile(projRoot, { name });
    await addHeadlessApi(projRoot, addApiRequest);
    await amplifyPush(projRoot);
    await updateHeadlessApi(projRoot, updateApiRequest, true);
    expect(getCLIInputs(projRoot, 'api', name)).toBeDefined();
    expect(getCLIInputs(projRoot, 'api', name)).toMatchSnapshot();
    await amplifyPushUpdate(projRoot, undefined, undefined, true);

    // verify
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
