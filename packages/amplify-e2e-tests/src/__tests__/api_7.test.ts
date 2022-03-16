import {
  addApiWithoutSchema,
  amplifyOverrideApi,
  amplifyPush,
  amplifyPushOverride,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppSyncApi,
  getDDBTable,
  getProjectMeta,
  initJSProjectWithProfile,
  updateApiSchema,
} from 'amplify-e2e-core';
import * as fs from 'fs-extra';
import path from 'path';

describe('amplify add api (GraphQL)', () => {
  let projRoot: string;
  let projFolderName: string;
  beforeEach(async () => {
    projFolderName = 'graphqlapi';
    projRoot = await createNewProjectDir(projFolderName);
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (fs.existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it('init a project and add the simple_model api with transformer version 1', async () => {
    const envName = 'devtest';
    const projName = 'simplemodel';
    const cliInputsFilePath = path.join(projRoot, 'amplify', 'backend', 'api', `${projName}`, 'cli-inputs.json');
    await initJSProjectWithProfile(projRoot, { name: projName, envName });
    await addApiWithoutSchema(projRoot);
    await updateApiSchema(projRoot, projName, 'simple_model.graphql');
    expect(fs.existsSync(cliInputsFilePath)).toBe(true);

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

    await amplifyOverrideApi(projRoot, {});
    const srcOverrideFilePath = path.join(__dirname, '..', '..', 'overrides', 'override-api-gql.ts');
    const destOverrideFilePath = path.join(projRoot, 'amplify', 'backend', 'api', `${projName}`, 'override.ts');
    fs.copyFileSync(srcOverrideFilePath, destOverrideFilePath);
    await amplifyPushOverride(projRoot);
    // check overidden config
    const overridenAppsyncApiOverrided = await getAppSyncApi(GraphQLAPIIdOutput, region);
    expect(overridenAppsyncApiOverrided.graphqlApi).toBeDefined();
    expect(overridenAppsyncApiOverrided.graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
    expect(overridenAppsyncApiOverrided.graphqlApi.xrayEnabled).toEqual(true);
  });
});
