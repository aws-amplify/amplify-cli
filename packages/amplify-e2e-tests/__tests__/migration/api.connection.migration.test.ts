require('../../src/aws-matchers/'); // custom matcher for assertion
import {
  initProjectWithProfile,
  deleteProject,
  amplifyPush,
  amplifyPushUpdate
} from '../../src/init';
import { addApiWithSchema, updateApiSchema } from '../../src/categories/api';
import { createNewProjectDir, deleteProjectDir } from '../../src/utils';

describe('amplify add api', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
    jest.setTimeout(1000 * 60 * 60); // 1 hour
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init project, run invalid migration trying to add a sort key to @connection, and check for error', async () => {
    const projectName = 'addconnection';
    const initialSchema = 'migrations_connection/initial_schema.graphql';
    const nextSchema1 = 'migrations_connection/cant_add_a_sort_key.graphql';
    await initProjectWithProfile(projRoot, { name: projectName });
    await addApiWithSchema(projRoot, initialSchema);
    await amplifyPush(projRoot);
    updateApiSchema(projRoot, projectName, nextSchema1);
    await amplifyPushUpdate(
        projRoot,
        /Attempting to edit the global secondary index gsi-PostComments on the CommentTable table in the Comment stack.*/
    );
  });

  it('init project, run invalid migration trying to change add and remove connection at same time, and check for error', async () => {
    const projectName = 'iremoveaddconnection';
    const initialSchema = 'migrations_connection/initial_schema.graphql';
    const nextSchema1 = 'migrations_connection/cant_add_and_remove_at_same_time.graphql';
    await initProjectWithProfile(projRoot, { name: projectName });
    await addApiWithSchema(projRoot, initialSchema);
    await amplifyPush(projRoot);
    updateApiSchema(projRoot, projectName, nextSchema1);
    await amplifyPushUpdate(
        projRoot,
        /Attempting to add and remove a global secondary index at the same time on the CommentTable table in the Comment stack.*/
    );
  });

  it('init project, run invalid migration trying to change a @connection field name, and check for error', async () => {
    const projectName = 'changeconnection';
    const initialSchema = 'migrations_connection/initial_schema.graphql';
    const nextSchema1 = 'migrations_connection/cant_change_connection_field_name.graphql';
    await initProjectWithProfile(projRoot, { name: projectName });
    await addApiWithSchema(projRoot, initialSchema);
    await amplifyPush(projRoot);
    updateApiSchema(projRoot, projectName, nextSchema1);
    await amplifyPushUpdate(
        projRoot,
        /Attempting to edit the global secondary index gsi-PostComments on the CommentTable table in the Comment stack.*/
    );
  });

  it('init project, run valid migration to remove a connection, then run another migration that adds a slightly different GSI.', async () => {
    const projectName = 'removeaddconnection';
    const initialSchema = 'migrations_connection/initial_schema.graphql';
    const nextSchema1 = 'migrations_connection/remove_connection.graphql';
    const nextSchema2 = 'migrations_connection/add_a_sort_key.graphql';
    await initProjectWithProfile(projRoot, { name: projectName });
    await addApiWithSchema(projRoot, initialSchema);
    await amplifyPush(projRoot);
    updateApiSchema(projRoot, projectName, nextSchema1);
    await amplifyPushUpdate(projRoot, /GraphQL endpoint:.*/);
    updateApiSchema(projRoot, projectName, nextSchema2);
    await amplifyPushUpdate(projRoot, /GraphQL endpoint:.*/);
  });

  it(`init project, run valid migration to add a connection that uses the \
  existing key fields, then run another migration that removes the old connection \
  and renames the field.`,
  async () => {
    const projectName = 'addremoveconnection';
    const initialSchema = 'migrations_connection/initial_schema.graphql';
    const nextSchema1 = 'migrations_connection/add_a_sort_key_before_remove.graphql';
    const nextSchema2 = 'migrations_connection/remove_old_connection_after.graphql';
    await initProjectWithProfile(projRoot, { name: projectName });
    await addApiWithSchema(projRoot, initialSchema);
    await amplifyPush(projRoot);
    updateApiSchema(projRoot, projectName, nextSchema1);
    await amplifyPushUpdate(projRoot, /GraphQL endpoint:.*/);
    updateApiSchema(projRoot, projectName, nextSchema2);
    await amplifyPushUpdate(projRoot, /GraphQL endpoint:.*/);
  });
});
