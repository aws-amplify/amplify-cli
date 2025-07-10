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
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import path from 'path';

describe('amplify add api (GraphQL)', () => {
  let projRoot: string;
  let projFolderName: string;
  beforeEach(async () => {
    // eslint-disable-next-line spellcheck/spell-checker
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
    // eslint-disable-next-line spellcheck/spell-checker
    const envName = 'devtest';
    // eslint-disable-next-line spellcheck/spell-checker
    const projName = 'simplemodel';
    const cliInputsFilePath = path.join(projRoot, 'amplify', 'backend', 'api', `${projName}`, 'cli-inputs.json');
    await initJSProjectWithProfile(projRoot, { name: projName, envName });
    await addApiWithoutSchema(projRoot);
    await updateApiSchema(projRoot, projName, 'simple_model.graphql');
    expect(fs.existsSync(cliInputsFilePath)).toBe(true);

    await amplifyPush(projRoot);

    const meta = getProjectMeta(projRoot);
    const region = meta.providers.awscloudformation.Region;
    // eslint-disable-next-line spellcheck/spell-checker
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

    console.log('attempting to override api');
    await amplifyOverrideApi(projRoot);
    const srcOverrideFilePath = path.join(__dirname, '..', '..', 'overrides', 'override-api-gql.ts');
    const destOverrideFilePath = path.join(projRoot, 'amplify', 'backend', 'api', `${projName}`, 'override.ts');
    fs.copyFileSync(srcOverrideFilePath, destOverrideFilePath);
    console.log('should be pushing override');
    await amplifyPushOverride(projRoot);
    // check overridden config
    const overriddenAppsyncApiOverride = await getAppSyncApi(GraphQLAPIIdOutput, region);
    expect(overriddenAppsyncApiOverride.graphqlApi).toBeDefined();
    expect(overriddenAppsyncApiOverride.graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
    // eslint-disable-next-line spellcheck/spell-checker
    expect(overriddenAppsyncApiOverride.graphqlApi.xrayEnabled).toEqual(true);
  });
});
