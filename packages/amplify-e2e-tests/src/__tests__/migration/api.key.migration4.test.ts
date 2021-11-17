import { initJSProjectWithProfile, deleteProject, amplifyPush, amplifyPushUpdate, addFeatureFlag } from 'amplify-e2e-core';
import { addApiWithoutSchema, updateApiSchema, getProjectMeta } from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';
import { addEnvironment } from '../../environment/env';

describe('amplify add api', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('api-key-migration-4');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init project, allow updated two types with new GSIs', async () => {
    const projectName = 'twotableupdategsi';
    const initialSchema = 'migrations_key/two_key_model_schema.graphql';
    const nextSchema = 'migrations_key/four_key_model_schema.graphql';

    await initJSProjectWithProfile(projRoot, { name: projectName });
    addFeatureFlag(projRoot, 'graphqltransformer', 'enableiterativegsiupdates', false);

    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await updateApiSchema(projRoot, projectName, initialSchema);
    await amplifyPush(projRoot);

    updateApiSchema(projRoot, projectName, nextSchema);
    await amplifyPushUpdate(projRoot, /GraphQL endpoint:.*/);
  });

  it('init project, run valid migration adding a GSI', async () => {
    const projectName = 'validaddinggsi';
    const initialSchema = 'migrations_key/initial_schema.graphql';
    const nextSchema1 = 'migrations_key/add_gsi.graphql';

    await initJSProjectWithProfile(projRoot, { name: projectName });
    addFeatureFlag(projRoot, 'graphqltransformer', 'enableiterativegsiupdates', false);

    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await updateApiSchema(projRoot, projectName, initialSchema);
    await amplifyPush(projRoot);

    updateApiSchema(projRoot, projectName, nextSchema1);
    await amplifyPushUpdate(projRoot, /GraphQL endpoint:.*/);
  });
});
