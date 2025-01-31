/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import {
  initJSProjectWithProfile,
  deleteProject,
  addApiWithThreeModels,
  apiGqlCompile,
  amplifyPush,
  generateModels,
  createNewProjectDir,
  deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';

describe('global sandbox mode c', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createNewProjectDir('sandbox');
    await initJSProjectWithProfile(projectDir);
  });

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  // TODO: need a reason why we're skipping this or we should remove this test
  it.skip('compiles schema with three models and pushes to cloud', async () => {
    await addApiWithThreeModels(projectDir);
    await apiGqlCompile(projectDir);
    await generateModels(projectDir);
    await amplifyPush(projectDir);
  });
});
