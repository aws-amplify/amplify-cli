import {
  addApi,
  addFunction,
  amplifyPushCategoryWithYesFlag,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  generateRandomShortId,
  getProjectMeta,
  initJSProjectWithProfile,
  updateApiSchema,
} from '@aws-amplify/amplify-e2e-core';

describe('amplify push function cases:', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('lambda-appsync-nodejs');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('Test case when IAM is set as default auth', async () => {
    const projName = `iammodel${generateRandomShortId()}`;

    await initJSProjectWithProfile(projRoot, { name: projName });

    await addApi(projRoot, { IAM: {}, transformerVersion: 2 });
    updateApiSchema(projRoot, projName, 'iam_simple_model.graphql');
    // should not build and deploy api
    await amplifyPushCategoryWithYesFlag(projRoot, 'function', false);
    const meta = getProjectMeta(projRoot);
    expect(meta?.function).toBeUndefined();
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    // should only push function
    await amplifyPushCategoryWithYesFlag(projRoot, 'function', true);
    const metaUpdated = getProjectMeta(projRoot);
    const { Arn: functionArn } = Object.keys(metaUpdated.function).map((key) => metaUpdated.function[key])[0].output;
    const { GraphQLAPIEndpointOutput: graphqlEndpoint } = Object.keys(metaUpdated.api).map((key) => metaUpdated.api[key])[0].output;
    expect(functionArn).toBeDefined();
    expect(graphqlEndpoint).toBeUndefined();
  });
});
