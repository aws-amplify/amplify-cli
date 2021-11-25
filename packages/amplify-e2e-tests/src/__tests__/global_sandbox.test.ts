import {
  initJSProjectWithProfile,
  deleteProject,
  addApiWithoutSchema,
  addApiWithOneModel,
  addApiWithThreeModels,
  updateApiSchema,
  apiGqlCompile,
  amplifyPush,
  generateModels,
} from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';

describe('global sandbox mode', () => {
  let projectDir: string;
  let apiName = 'sandbox';

  beforeEach(async () => {
    projectDir = await createNewProjectDir('sandbox');
    await initJSProjectWithProfile(projectDir);
  });

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  it('compiles schema with one model and pushes to cloud', async () => {
    await addApiWithOneModel(projectDir);
    await apiGqlCompile(projectDir, true);
    await generateModels(projectDir);
    await amplifyPush(projectDir, true);
  });

  it.skip('compiles schema with three models and pushes to cloud', async () => {
    await addApiWithThreeModels(projectDir);
    await apiGqlCompile(projectDir, true);
    await generateModels(projectDir);
    await amplifyPush(projectDir, true);
  });

  it('compiles schema user-added schema and pushes to cloud', async () => {
    await addApiWithoutSchema(projectDir, { apiName });
    updateApiSchema(projectDir, apiName, 'model_with_sandbox_mode.graphql');
    await apiGqlCompile(projectDir, true);
    await generateModels(projectDir);
    await amplifyPush(projectDir, true);
  });
});
