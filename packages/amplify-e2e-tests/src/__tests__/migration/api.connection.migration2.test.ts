import { initJSProjectWithProfile, deleteProject, amplifyPush, amplifyPushUpdate, addFeatureFlag } from 'amplify-e2e-core';
import { addApiWithoutSchema, updateApiSchema } from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';

describe('amplify add api', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('api-conn-migration');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init project, run invalid migration trying to change a @connection field name, and check for error', async () => {
    const projectName = 'changeconnection';
    const initialSchema = 'migrations_connection/initial_schema.graphql';
    const nextSchema1 = 'migrations_connection/cant_change_connection_field_name.graphql';

    await initJSProjectWithProfile(projRoot, { name: projectName });
    await addFeatureFlag(projRoot, 'graphqltransformer', 'enableiterativegsiupdates', false);

    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await updateApiSchema(projRoot, projectName, initialSchema);
    await amplifyPush(projRoot);
    updateApiSchema(projRoot, projectName, nextSchema1);
    await expect(
      amplifyPushUpdate(
        projRoot,
        /Attempting to edit the global secondary index gsi-PostComments on the CommentTable table in the Comment stack.*/,
      ),
    ).rejects.toThrowError('Process exited with non zero exit code 1');
  });

  it('init project, run valid migration to remove a connection, then run another migration that adds a slightly different GSI.', async () => {
    const projectName = 'removeaddconnection';
    const initialSchema = 'migrations_connection/initial_schema.graphql';
    const nextSchema1 = 'migrations_connection/remove_connection.graphql';
    const nextSchema2 = 'migrations_connection/add_a_sort_key.graphql';

    await initJSProjectWithProfile(projRoot, { name: projectName });
    await addFeatureFlag(projRoot, 'graphqltransformer', 'enableiterativegsiupdates', false);

    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await updateApiSchema(projRoot, projectName, initialSchema);
    await amplifyPush(projRoot);
    updateApiSchema(projRoot, projectName, nextSchema1);
    await amplifyPushUpdate(projRoot, /GraphQL endpoint:.*/);
    updateApiSchema(projRoot, projectName, nextSchema2);
    await amplifyPushUpdate(projRoot, /GraphQL endpoint:.*/);
  });
});
