import {
  generateRandomShortId,
  initJSProjectWithProfile,
  addApi,
  updateApiSchema,
  getBackendConfig,
  addFunction,
  functionBuild,
  amplifyPush,
  getProjectMeta,
  getFunction,
  invokeFunction,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  amplifyPushFunction,
  removeFunction,
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
    await updateApiSchema(projRoot, projName, 'iam_simple_model.graphql');
    await amplifyPushFunction(projRoot);
  });
});
