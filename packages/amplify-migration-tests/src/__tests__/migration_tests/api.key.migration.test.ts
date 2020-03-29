import { initJSProjectWithProfile, deleteProject, amplifyPush, amplifyPushUpdate } from '../../../../amplify-e2e-tests/src/init';
import { addApiWithSchema, updateApiSchema } from '../../../../amplify-e2e-tests/src/categories/api';
import { createNewProjectDir, deleteProjectDir } from '../../utils';

describe('amplify add api', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init project, run invalid migration trying to add an LSI, and wait for error', async () => {
    const projectName = 'migratingkey';
    const initialSchema = 'migrations_key/initial_schema.graphql';
    const nextSchema1 = 'migrations_key/cant_add_lsi.graphql';
    // init, add api and push with installed cli
    await initJSProjectWithProfile(projRoot, { name: projectName, local: true });
    await addApiWithSchema(projRoot, initialSchema, true);
    await amplifyPush(projRoot, true);
    // update and push with codebase cli
    updateApiSchema(projRoot, projectName, nextSchema1);
    await amplifyPushUpdate(
      projRoot,
      /Attempting to add a local secondary index to the TodoTable table in the Todo stack. Local secondary indexes must be created when the table is created.*/,
    );
  });

  it('init project, run invalid migration trying to change a gsi, and check for error', async () => {
    const projectName = 'migratingkey';
    const initialSchema = 'migrations_key/initial_schema.graphql';
    const nextSchema1 = 'migrations_key/cant_change_gsi.graphql';
    // init, add api and push with installed cli
    await initJSProjectWithProfile(projRoot, { name: projectName, local: true });
    await addApiWithSchema(projRoot, initialSchema, true);
    await amplifyPush(projRoot, true);
    // update and push with codebase cli
    updateApiSchema(projRoot, projectName, nextSchema1);
    await amplifyPushUpdate(projRoot, /Attempting to edit the global secondary index SomeGSI on the TodoTable table in the Todo stack.*/);
  });

  it('init project, run invalid migration trying to change the key schema, and check for error', async () => {
    const projectName = 'migratingkey';
    const initialSchema = 'migrations_key/initial_schema.graphql';
    const nextSchema1 = 'migrations_key/cant_change_key_schema.graphql';
    // init, add api and push with installed cli
    await initJSProjectWithProfile(projRoot, { name: projectName, local: true });
    await addApiWithSchema(projRoot, initialSchema, true);
    await amplifyPush(projRoot, true);
    // update and push with codebase cli
    updateApiSchema(projRoot, projectName, nextSchema1);
    await amplifyPushUpdate(projRoot, /Attempting to edit the key schema of the TodoTable table in the Todo stack.*/);
  });

  it('init project, run invalid migration trying to change an lsi, and check for error', async () => {
    const projectName = 'migrationchangelsi';
    const initialSchema = 'migrations_key/initial_schema.graphql';
    const nextSchema1 = 'migrations_key/cant_change_lsi.graphql';
    // init, add api and push with installed cli
    await initJSProjectWithProfile(projRoot, { name: projectName, local: true });
    await addApiWithSchema(projRoot, initialSchema, true);
    await amplifyPush(projRoot, true);
    // update and push with codebase cli
    updateApiSchema(projRoot, projectName, nextSchema1);
    await amplifyPushUpdate(projRoot, /Attempting to edit the local secondary index SomeLSI on the TodoTable table in the Todo stack.*/);
  });

  it('init project, run valid migration adding a GSI', async () => {
    const projectName = 'validaddinggsi';
    const initialSchema = 'migrations_key/initial_schema.graphql';
    const nextSchema1 = 'migrations_key/add_gsi.graphql';
    // init, add api and push with installed cli
    await initJSProjectWithProfile(projRoot, { name: projectName, local: true });
    await addApiWithSchema(projRoot, initialSchema, true);
    await amplifyPush(projRoot, true);
    // update and push with codebase cli
    updateApiSchema(projRoot, projectName, nextSchema1);
    await amplifyPushUpdate(projRoot, /GraphQL endpoint:.*/);
  });
});
