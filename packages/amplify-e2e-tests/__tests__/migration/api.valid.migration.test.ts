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
});
