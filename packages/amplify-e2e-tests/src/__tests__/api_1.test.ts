import {
  amplifyPush,
  amplifyPushUpdate,
  deleteProject,
  initFlutterProjectWithProfile,
  initJSProjectWithProfile,
  addApiWithoutSchema,
  updateApiSchema,
  createNewProjectDir,
  deleteProjectDir,
  getAppSyncApi,
  getProjectMeta,
  initIosProjectWithProfile,
  getDDBTable,
  removeHeadlessApi,
  getAwsIOSConfig,
  getAmplifyIOSConfig,
  amplifyPushWithoutCodegen,
  generateRandomShortId,
} from '@aws-amplify/amplify-e2e-core';
import path from 'path';
import { existsSync } from 'fs';

describe('amplify add api (GraphQL)', () => {
  let projRoot: string;
  let projFolderName: string;
  beforeEach(async () => {
    projFolderName = `graphqlApi${generateRandomShortId()}`;
    projRoot = await createNewProjectDir(projFolderName);
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
    const projName = `simplemodel${generateRandomShortId()}`;
    await initJSProjectWithProfile(projRoot, { name: projName, envName });
    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await updateApiSchema(projRoot, projName, 'simple_model.graphql');
    await amplifyPush(projRoot);

    const meta = getProjectMeta(projRoot);
    const region = meta.providers.awscloudformation.Region;
    const { output } = meta.api[projName];
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    const { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, region);

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
    const tableName = `AmplifyDataStore-${graphqlApi.apiId}-${envName}`;
    let error: Error;
    try {
      const table = await getDDBTable(tableName, region);
      expect(table.Table).toBeUndefined();
    } catch (ex) {
      error = ex;
    }
    expect(error).toBeDefined();
    expect(error.message).toContain(`${tableName} not found`);
  });

  it('init a project then add and remove api', async () => {
    const envName = 'devtest';
    const projName = `simplemodel${generateRandomShortId()}`;
    await initIosProjectWithProfile(projRoot, { name: projName, envName });
    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await updateApiSchema(projRoot, projName, 'simple_model.graphql');
    await amplifyPush(projRoot);

    let meta = getProjectMeta(projRoot);
    const { output } = meta.api[projName];
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    await removeHeadlessApi(projRoot, projName);
    await amplifyPushUpdate(projRoot);

    meta = getProjectMeta(projRoot);
    expect(meta.api[projName]).toBeUndefined();
    const awsConfig: any = getAwsIOSConfig(projRoot);
    expect('AppSync' in awsConfig).toBe(false);
    const amplifyConfig: any = getAmplifyIOSConfig(projRoot);
    expect('api' in amplifyConfig).toBe(false);
  });

  it('init a Flutter project and add the simple_model api', async () => {
    const envName = 'devtest';
    const projName = `simplemodel${generateRandomShortId()}`;
    await initFlutterProjectWithProfile(projRoot, { name: projName, envName });
    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await updateApiSchema(projRoot, projName, 'simple_model.graphql');
    await amplifyPushWithoutCodegen(projRoot);

    const meta = getProjectMeta(projRoot);
    const region = meta.providers.awscloudformation.Region;
    const { output } = meta.api[projName];
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    const { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, region);

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
    const tableName = `AmplifyDataStore-${graphqlApi.apiId}-${envName}`;
    let error: Error;
    try {
      const table = await getDDBTable(tableName, region);
      expect(table.Table).toBeUndefined();
    } catch (ex) {
      error = ex;
    }
    expect(error).toBeDefined();
    expect(error.message).toContain(`${tableName} not found`);
  });

  it('init a project with a simple model and then migrates the api', async () => {
    const projectName = `blogapp${generateRandomShortId()}`;
    const initialSchema = 'initial_key_blog.graphql';
    const nextSchema = 'next_key_blog.graphql';
    await initJSProjectWithProfile(projRoot, { name: projectName });
    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await updateApiSchema(projRoot, projectName, initialSchema);
    await amplifyPush(projRoot);
    updateApiSchema(projRoot, projectName, nextSchema);
    await amplifyPushUpdate(projRoot);
    const meta = getProjectMeta(projRoot);
    const { output } = meta.api[projectName];
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();
  });
});
