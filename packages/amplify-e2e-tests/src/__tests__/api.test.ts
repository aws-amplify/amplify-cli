import { initJSProjectWithProfile, deleteProject, amplifyPush, amplifyPushUpdate } from '../init';
import * as path from 'path';
import { existsSync } from 'fs';
import { addApiWithSchema, updateApiSchema, updateApiWithMultiAuth } from '../categories/api';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, getTransformConfig, getAppSyncApi } from '../utils';
import { TRANSFORM_CURRENT_VERSION, TRANSFORM_BASE_VERSION, writeTransformerConfiguration } from 'graphql-transformer-core';

describe('amplify add api', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it('init a project and add the simple_model api', async () => {
    await initJSProjectWithProfile(projRoot, { name: 'simplemodel' });
    await addApiWithSchema(projRoot, 'simple_model.graphql');
    await amplifyPush(projRoot);

    const meta = getProjectMeta(projRoot);
    const { output } = meta.api.simplemodel;
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    const { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, meta.providers.awscloudformation.Region);

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
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

  it('init a project and add the simple_model api, change transformer version to base version and push', async () => {
    const name = `simplemodelv${TRANSFORM_BASE_VERSION}`;
    await initJSProjectWithProfile(projRoot, { name });
    await addApiWithSchema(projRoot, 'simple_model.graphql');

    const transformConfig = getTransformConfig(projRoot, name);
    expect(transformConfig).toBeDefined();
    expect(transformConfig.Version).toBeDefined();
    expect(transformConfig.Version).toEqual(TRANSFORM_CURRENT_VERSION);

    transformConfig.Version = TRANSFORM_BASE_VERSION;
    const apiRoot = path.join(projRoot, 'amplify', 'backend', 'api', name);
    writeTransformerConfiguration(apiRoot, transformConfig);

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
  });

  // TODO: Disabling for now until further conversation.
  // it('inits a project with a simple model with deletion protection enabled and then migrates the api', async () => {
  //   const projectName = 'retaintables';
  //   const initialSchema = 'simple_model.graphql';
  //   console.log(projRoot);
  //   await initJSProjectWithProfile(projRoot, { name: projectName });
  //   await addApiWithSchema(projRoot, initialSchema);
  //   updateConfig(projRoot, projectName, {
  //     TransformerOptions: {
  //       '@model': { EnableDeletionProtection: true }
  //     }
  //   });
  //   await amplifyPush(projRoot);
  //   const projectMeta = getProjectMeta(projRoot);
  //   const region = projectMeta.providers.awscloudformation.Region;
  //   const { output } = projectMeta.api[projectName];
  //   const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
  //   await expect(GraphQLAPIIdOutput).toBeDefined()
  //   await expect(GraphQLAPIEndpointOutput).toBeDefined()
  //   await expect(GraphQLAPIKeyOutput).toBeDefined()
  //   await deleteProject(projRoot);
  //   const tableName = `Todo-${GraphQLAPIIdOutput}-integtest`;
  //   const table = await getTable(tableName, region);
  //   expect(table.Table).toBeDefined()
  //   if (table.Table) {
  //     const del = await deleteTable(tableName, region);
  //     expect(del.TableDescription).toBeDefined()
  //   }
  // });
});
