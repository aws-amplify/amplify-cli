import {
  addApiWithoutSchema,
  addFeatureFlag,
  addFunction,
  addRestApi,
  amplifyPushGraphQlWithCognitoPrompt,
  amplifyPushUpdate,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppSyncApi,
  getProjectMeta,
  initJSProjectWithProfile,
  updateApiSchema,
  validateRestApiMeta,
} from '@aws-amplify/amplify-e2e-core';
import { readdirSync, readFileSync } from 'fs';
import * as path from 'path';

describe('amplify add api (REST and GRAPHQL)', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('rest-api');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('adds a rest api and then adds a path to the existing api', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await addRestApi(projRoot, { existingLambda: true });
    await addRestApi(projRoot, { isFirstRestApi: false, existingLambda: true, path: '/newpath' });
    await amplifyPushUpdate(projRoot);
    await validateRestApiMeta(projRoot);

    const apisDirectory = path.join(projRoot, 'amplify', 'backend', 'api');
    const apis = readdirSync(apisDirectory);
    const apiName = apis[0];
    const apiDirectory = path.join(apisDirectory, apiName);
    const cfnTemplateFile = path.join(apiDirectory, 'build', `${apiName}-cloudformation-template.json`);
    const cfnTemplate = JSON.parse(readFileSync(cfnTemplateFile, 'utf8'));
    // The ApiId output is required
    expect(cfnTemplate.Outputs.ApiId).toBeDefined();
  });

  it('amplify push prompt for cognito configuration if auth mode is missing', async () => {
    const envName = 'devtest';
    const projName = 'lambdaauthmode';
    await initJSProjectWithProfile(projRoot, { name: projName, envName });
    await addFeatureFlag(projRoot, 'graphqltransformer', 'useexperimentalpipelinedtransformer', true);
    await addFeatureFlag(projRoot, 'graphqltransformer', 'transformerversion', 2);
    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await updateApiSchema(projRoot, projName, 'cognito_simple_model.graphql');
    await amplifyPushGraphQlWithCognitoPrompt(projRoot);

    const meta = getProjectMeta(projRoot);
    const region = meta.providers.awscloudformation.Region;
    const { output } = meta.api.lambdaauthmode;
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    const { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, region);

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
    await validateRestApiMeta(projRoot, meta);
  });
});
