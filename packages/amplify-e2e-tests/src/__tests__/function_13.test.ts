import {
  addApi,
  addFunction,
  amplifyPush,
  amplifyPushCategoryWithYesFlag,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  generateRandomShortId,
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

  it('Test case when IAM is set as default auth and api is already deployed and pushing function', async () => {
    const projName = `iammodel${generateRandomShortId()}`;
    await initJSProjectWithProfile(projRoot, { name: projName });
    await addApi(projRoot, { IAM: {}, transformerVersion: 2 });
    updateApiSchema(projRoot, projName, 'iam_simple_model.graphql');
    await amplifyPush(projRoot);
    // update api
    updateApiSchema(projRoot, projName, 'iam_simple_model1.graphql');
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    // should only push function
    await amplifyPushCategoryWithYesFlag(projRoot, 'function', true);
  });
});
