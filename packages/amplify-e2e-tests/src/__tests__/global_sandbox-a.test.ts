/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import {
  initJSProjectWithProfile,
  deleteProject,
  addApiWithOneModel,
  apiGqlCompile,
  amplifyPush,
  generateModels,
  createNewProjectDir,
  deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';

describe('global sandbox mode a', () => {
  let projectDir: string;

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
    await apiGqlCompile(projectDir);
    await generateModels(projectDir);
    await amplifyPush(projectDir);
  });
});
