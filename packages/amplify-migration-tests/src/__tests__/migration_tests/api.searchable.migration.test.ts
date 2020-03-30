import { initJSProjectWithProfile, deleteProject, amplifyPush, amplifyPushUpdate } from '../../../../amplify-e2e-tests/src/init';
import { addApiWithSchema, updateApiSchema } from '../../../../amplify-e2e-tests/src/categories/api';
import { createNewProjectDir, deleteProjectDir } from '../../utils';

describe('amplify searchable migration', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir('api-searchable-cli-migration');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init project, add searchable and migrate with updated searchable', async () => {
    const projectName = 'searchable';
    const initialSchema = 'migrations_searchable/initial_searchable.graphql';
    const nextSchema = 'migrations_searchable/updated_searchable.graphql';
    // init, add api and push with installed cli
    await initJSProjectWithProfile(projRoot, { name: projectName, local: true });
    await addApiWithSchema(projRoot, initialSchema, true);
    await amplifyPush(projRoot, true);
    // update and push with codebase cli
    updateApiSchema(projRoot, projectName, nextSchema);
    await amplifyPushUpdate(projRoot, /GraphQL endpoint:.*/);
  });
});
