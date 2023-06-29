/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import {
  initJSProjectWithProfile,
  deleteProject,
  addApiWithoutSchema,
  updateApiSchema,
  apiGqlCompile,
  amplifyPush,
  generateModels,
  createNewProjectDir,
  deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';

describe('global sandbox mode b', () => {
  let projectDir: string;
  const apiName = 'sandbox';

  beforeEach(async () => {
    projectDir = await createNewProjectDir('sandbox');
    await initJSProjectWithProfile(projectDir);
  });

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  it('compiles schema user-added schema and pushes to cloud', async () => {
    await addApiWithoutSchema(projectDir, { apiName });
    updateApiSchema(projectDir, apiName, 'model_with_sandbox_mode.graphql');
    await apiGqlCompile(projectDir);
    await generateModels(projectDir);
    await amplifyPush(projectDir);
  });
});
