import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPush,
  amplifyPushUpdate,
  addApiWithoutSchema,
  updateApiSchema,
  getProjectMeta,
  createNewProjectDir,
  deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';
import { addEnvironment } from '../../environment/env';

describe('amplify add api', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('api-key-migration-2');
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
    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await updateApiSchema(projRoot, projectName, initial_schema);
    await amplifyPush(projRoot);

    updateApiSchema(projRoot, projectName, nextSchema);
    await amplifyPushUpdate(projRoot, /GraphQL endpoint:.*/);
  });

  it('init project, allow editing keyschema when adding environment', async () => {
    const projectName = 'migratingkey';
    const initialSchema = 'migrations_key/initial_schema.graphql';
    const nextSchema1 = 'migrations_key/cant_change_key_schema.graphql';

    await initJSProjectWithProfile(projRoot, { name: projectName });
    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await updateApiSchema(projRoot, projectName, initialSchema);
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
});
