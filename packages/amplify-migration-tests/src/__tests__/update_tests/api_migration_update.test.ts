import {
  amplifyPush,
  amplifyPushUpdate,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppSyncApi,
  getProjectMeta,
  getTransformConfig,
  updateApiSchema,
  updateApiWithMultiAuth,
  updateAPIWithResolutionStrategyWithModels,
  getProjectConfig,
} from 'amplify-e2e-core';
import { existsSync } from 'fs';
import { TRANSFORM_CURRENT_VERSION } from 'graphql-transformer-core';
import { join } from 'path';
import {
  initJSProjectWithProfile,
  versionCheck,
  addApiWithoutSchemaOldDx,
  addApiWithSchemaAndConflictDetectionOldDx,
} from '../../migration-helpers';

describe('api migration update test', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('graphql-api');
    await initJSProjectWithProfile(projRoot, { name: 'apimigration' });
    await versionCheck(projRoot, false);
    await versionCheck(projRoot, true);
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

    // toggle to latest version
    // update api and push with the CLI to be released (the codebase)
    updateApiSchema(projRoot, projectName, nextSchema);
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
});
