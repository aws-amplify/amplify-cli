import { initJSProjectWithProfile, deleteProject, amplifyPush, amplifyPushUpdate } from '../../../../amplify-e2e-tests/src/init';
import { addApiWithSchema, updateApiSchema } from '../../../../amplify-e2e-tests/src/categories/api';
import { createNewProjectDir, deleteProjectDir } from '../../utils';

describe('amplify add api migration', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir('api-conn-cli-migration');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init project, run invalid migration trying to add a sort key to @connection, and check for error', async () => {
    const projectName = 'addconnection';
    const initialSchema = 'migrations_connection/initial_schema.graphql';
    const nextSchema1 = 'migrations_connection/cant_add_a_sort_key.graphql';
    // init, add api and push with installed cli
    await initJSProjectWithProfile(projRoot, { name: projectName, local: true });
    await addApiWithSchema(projRoot, initialSchema, true);
    await amplifyPush(projRoot, true);
    // update and push with codebase cli
    updateApiSchema(projRoot, projectName, nextSchema1);
    await expect(
      amplifyPushUpdate(
        projRoot,
        /Attempting to edit the global secondary index gsi-PostComments on the CommentTable table in the Comment stack.*/,
      ),
    ).rejects.toThrowError('Process exited with non zero exit code 1');
  });

  it('init project, run invalid migration trying to change add and remove connection at same time, and check for error', async () => {
    const projectName = 'iremoveaddconnection';
    const initialSchema = 'migrations_connection/initial_schema.graphql';
    const nextSchema1 = 'migrations_connection/cant_add_and_remove_at_same_time.graphql';
    // init, add api and push with installed cli
    await initJSProjectWithProfile(projRoot, { name: projectName, local: true });
    await addApiWithSchema(projRoot, initialSchema, true);
    await amplifyPush(projRoot, true);
    // update and push with codebase cli
    updateApiSchema(projRoot, projectName, nextSchema1);
    await expect(
      amplifyPushUpdate(
        projRoot,
        /Attempting to add and remove a global secondary index at the same time on the CommentTable table in the Comment stack.*/,
      ),
    ).rejects.toThrowError('Process exited with non zero exit code 1');
  });

  it('init project, run invalid migration trying to change a @connection field name, and check for error', async () => {
    const projectName = 'changeconnection';
    const initialSchema = 'migrations_connection/initial_schema.graphql';
    const nextSchema1 = 'migrations_connection/cant_change_connection_field_name.graphql';
    // init, add api and push with installed cli
    await initJSProjectWithProfile(projRoot, { name: projectName, local: true });
    await addApiWithSchema(projRoot, initialSchema, true);
    await amplifyPush(projRoot, true);
    // update and push with codebase cli
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
    // init, add api and push with installed cli
    await initJSProjectWithProfile(projRoot, { name: projectName, local: true });
    await addApiWithSchema(projRoot, initialSchema, true);
    await amplifyPush(projRoot, true);
    // update and push with codebase cli
    updateApiSchema(projRoot, projectName, nextSchema1);
    await amplifyPushUpdate(projRoot, /GraphQL endpoint:.*/);
    updateApiSchema(projRoot, projectName, nextSchema2);
    await amplifyPushUpdate(projRoot, /GraphQL endpoint:.*/);
  });
});
