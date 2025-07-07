import {
  amplifyPush,
  deleteProject,
  initJSProjectWithProfile,
  addApiWithoutSchema,
  updateApiSchema,
  createNewProjectDir,
  deleteProjectDir,
  getAppSyncApi,
  getProjectMeta,
  getDDBTable,
  addFunction,
  getBackendAmplifyMeta,
  amplifyPushUpdateForDependentModel,
  amplifyPushForce,
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

  it('init a project with a simple model , add a function and removes the dependent @model', async () => {
    const projectName = `simplemodel${generateRandomShortId()}`;
    const nextSchema = 'initial_key_blog.graphql';
    const initialSchema = 'two-model-schema.graphql';
    const fnName = `integtestfn${generateRandomShortId()}`;
    await initJSProjectWithProfile(projRoot, { name: projectName });
    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await updateApiSchema(projRoot, projectName, initialSchema);
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
    await amplifyPushUpdateForDependentModel(projRoot, undefined, true);
    const meta = getProjectMeta(projRoot);
    const region = meta.providers.awscloudformation.Region;
    const { output } = meta.api[projectName];
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    const { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, region);

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
    const tableName = `Comment-${GraphQLAPIIdOutput}-integtest`;
    let error: Error;
    try {
      const table = await getDDBTable(tableName, region);
      expect(table).toBeUndefined();
    } catch (ex) {
      error = ex;
    }
    expect(error).toBeDefined();
    expect(error.message).toContain(`${tableName} not found`);
  });

  it('api force push with no changes', async () => {
    const projectName = `apinochange${generateRandomShortId()}`;
    await initJSProjectWithProfile(projRoot, { name: projectName });
    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await updateApiSchema(projRoot, projectName, 'two-model-schema.graphql');
    await amplifyPush(projRoot);
    let meta = getBackendAmplifyMeta(projRoot);
    const { lastPushDirHash: beforeDirHash } = meta.api[projectName];
    await amplifyPushForce(projRoot);
    meta = getBackendAmplifyMeta(projRoot);
    const { lastPushDirHash: afterDirHash } = meta.api[projectName];
    expect(beforeDirHash).toBe(afterDirHash);
  });
});
