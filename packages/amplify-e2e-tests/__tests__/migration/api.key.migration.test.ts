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

  it('init project, run invalid migration trying to add an LSI, and wait for error', async () => {
    const projectName = 'migratingkey';
    const initialSchema = 'migrations_key/initial_schema.graphql';
    const nextSchema1 = 'migrations_key/cant_add_lsi.graphql';
    await initProjectWithProfile(projRoot, { name: projectName });
    await addApiWithSchema(projRoot, initialSchema);
    await amplifyPush(projRoot);
    updateApiSchema(projRoot, projectName, nextSchema1);
    await amplifyPushUpdate(
        projRoot,
        /Attempting to add a local secondary index to the TodoTable table in the Todo stack. Local secondary indexes must be created when the table is created.*/
    );
  });

  it('init project, run invalid migration trying to change a gsi, and check for error', async () => {
    const projectName = 'migratingkey';
    const initialSchema = 'migrations_key/initial_schema.graphql';
    const nextSchema1 = 'migrations_key/cant_change_gsi.graphql';
    await initProjectWithProfile(projRoot, { name: projectName });
    await addApiWithSchema(projRoot, initialSchema);
    await amplifyPush(projRoot);
    updateApiSchema(projRoot, projectName, nextSchema1);
    await amplifyPushUpdate(
        projRoot,
        /Attempting to edit the global secondary index SomeGSI on the TodoTable table in the Todo stack.*/
    );
  });

  it('init project, run invalid migration trying to change the key schema, and check for error', async () => {
    const projectName = 'migratingkey';
    const initialSchema = 'migrations_key/initial_schema.graphql';
    const nextSchema1 = 'migrations_key/cant_change_key_schema.graphql';
    await initProjectWithProfile(projRoot, { name: projectName });
    await addApiWithSchema(projRoot, initialSchema);
    await amplifyPush(projRoot);
    updateApiSchema(projRoot, projectName, nextSchema1);
    await amplifyPushUpdate(
        projRoot,
        /Attempting to edit the key schema of the TodoTable table in the Todo stack.*/
    );
  });

  it('init project, run invalid migration trying to change an lsi, and check for error', async () => {
    const projectName = 'migrationchangelsi';
    const initialSchema = 'migrations_key/initial_schema.graphql';
    const nextSchema1 = 'migrations_key/cant_change_lsi.graphql';
    await initProjectWithProfile(projRoot, { name: projectName });
    await addApiWithSchema(projRoot, initialSchema);
    await amplifyPush(projRoot);
    updateApiSchema(projRoot, projectName, nextSchema1);
    await amplifyPushUpdate(
        projRoot,
        /Attempting to edit the local secondary index SomeLSI on the TodoTable table in the Todo stack.*/
    );
  });

  it('init project, run valid migration adding a GSI', async () => {
    const projectName = 'validaddinggsi';
    const initialSchema = 'migrations_key/initial_schema.graphql';
    const nextSchema1 = 'migrations_key/add_gsi.graphql';
    await initProjectWithProfile(projRoot, { name: projectName });
    await addApiWithSchema(projRoot, initialSchema);
    await amplifyPush(projRoot);
    updateApiSchema(projRoot, projectName, nextSchema1);
    await amplifyPushUpdate(projRoot, /GraphQL endpoint:.*/);
  });
});
