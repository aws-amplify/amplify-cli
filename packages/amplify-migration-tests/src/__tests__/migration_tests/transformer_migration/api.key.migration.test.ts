import {
  addApiWithSchema,
  addFeatureFlag,
  amplifyPush,
  amplifyPushForce,
  amplifyPushUpdate,
  apiGqlCompile,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  updateApiSchema,
} from 'amplify-e2e-core';
import { initJSProjectWithProfile } from '../../../migration-helpers';

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

  it('init project, add lsi key and force push expect error', async () => {
    const projectName = 'keyforce';
    const initialSchema = 'migrations_key/initial_schema.graphql';
    // init, add api and push with installed cli
    await initJSProjectWithProfile(projRoot, { name: projectName });
    await addApiWithSchema(projRoot, initialSchema);
    await amplifyPush(projRoot);
    // add feature flag
    addFeatureFlag(projRoot, 'graphqltransformer', 'secondaryKeyAsGSI', true);
    // forceUpdateSchema
    updateApiSchema(projRoot, projectName, initialSchema, true);
    // gql-compile and force push with codebase cli
    await expect(
      amplifyPushUpdate(projRoot, /Attempting to remove a local secondary index on the TodoTable table in the Todo stack.*/, true),
    ).rejects.toThrowError(/Attempting to remove a local secondary index on the TodoTable table in the Todo stack.*/);
  });
});
