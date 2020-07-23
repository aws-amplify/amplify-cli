import { initJSProjectWithProfile, deleteProject, amplifyPush, amplifyPushForce } from 'amplify-e2e-core';
import { addApiWithSchema, apiGqlCompile } from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';

describe('amplify key force push', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('api-key-cli-migration');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init project, add key and migrate with force push', async () => {
    const projectName = 'keyforce';
    const initialSchema = 'migrations_key/simple_key.graphql';
    // init, add api and push with installed cli
    await initJSProjectWithProfile(projRoot, { name: projectName });
    await addApiWithSchema(projRoot, initialSchema);
    await amplifyPush(projRoot);
    // gql-compile and force push with codebase cli
    await apiGqlCompile(projRoot, true);
    await amplifyPushForce(projRoot, true);
  });
});
