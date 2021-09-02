import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPush,
  amplifyPushUpdate,
  addFeatureFlag,
  addApiWithSchema,
  updateApiSchema,
  getProjectMeta,
  createNewProjectDir,
  deleteProjectDir,
} from 'amplify-e2e-core';
import { addEnvironment } from '../../environment/env';

describe('amplify add api', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('api-key-migration');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init project, allow adding key when keyschema of one key is used in another key', async () => {
    const projectName = 'validksgsiupdate';
    const initial_schema = 'migrations_key/three_gsi_model_schema.graphql';
    const nextSchema = 'migrations_key/four_gsi_model_schema.graphql';
    await initJSProjectWithProfile(projRoot, { name: projectName });
    await addApiWithSchema(projRoot, initial_schema);
    await amplifyPush(projRoot);

    updateApiSchema(projRoot, projectName, nextSchema);
    await amplifyPushUpdate(projRoot, /GraphQL endpoint:.*/);
  });

  it('init project, allow editing keyschema when adding environment', async () => {
    const projectName = 'migratingkey';
    const initialSchema = 'migrations_key/initial_schema.graphql';
    const nextSchema1 = 'migrations_key/cant_change_key_schema.graphql';

    await initJSProjectWithProfile(projRoot, { name: projectName });
    await addApiWithSchema(projRoot, initialSchema);
    await amplifyPush(projRoot);
    await addEnvironment(projRoot, { envName: 'test' });
    updateApiSchema(projRoot, projectName, nextSchema1);
    await amplifyPush(projRoot);
    const { output } = getProjectMeta(projRoot).api[projectName];
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();
  });

  it('init project, run invalid migration trying to add more than one gsi, and check for error', async () => {
    const projectName = 'migratingkey';
    const initialSchema = 'migrations_key/initial_schema.graphql';
    const nextSchema1 = 'migrations_key/cant_add_more_gsi.graphql';

    await initJSProjectWithProfile(projRoot, { name: projectName });
    addFeatureFlag(projRoot, 'graphqltransformer', 'enableiterativegsiupdates', false);

    await addApiWithSchema(projRoot, initialSchema);
    await amplifyPush(projRoot);

    updateApiSchema(projRoot, projectName, nextSchema1);
    await expect(
      amplifyPushUpdate(
        projRoot,
        /Attempting to add more than 1 global secondary index SomeGSI1 and someGSI2 on the TodoTable table in the Todo stack.*/,
      ),
    ).rejects.toThrowError('Process exited with non zero exit code 1');
  });

  it('init project, run invalid migration trying to delete more than one gsi, and check for error', async () => {
    const projectName = 'migratingkey1';
    const initialSchema = 'migrations_key/initial_schema1.graphql';
    const nextSchema1 = 'migrations_key/cant_remove_more_gsi.graphql';

    await initJSProjectWithProfile(projRoot, { name: projectName });
    addFeatureFlag(projRoot, 'graphqltransformer', 'enableiterativegsiupdates', false);

    await addApiWithSchema(projRoot, initialSchema);
    await amplifyPush(projRoot);

    updateApiSchema(projRoot, projectName, nextSchema1);
    await expect(
      amplifyPushUpdate(
        projRoot,
        /Attempting to delete more than 1 global secondary index SomeGSI1 and someGSI2 on the TodoTable table in the Todo stack.*/,
      ),
    ).rejects.toThrowError('Process exited with non zero exit code 1');
  });
});
