import { initJSProjectWithProfile, deleteProject, amplifyPush, amplifyPushUpdate, addFeatureFlag } from 'amplify-e2e-core';
import { addApiWithoutSchema, updateApiSchema, getProjectMeta } from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';
import { addEnvironment } from '../../environment/env';

describe('amplify add api', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('api-key-migration-5');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init project, run invalid migration trying to add more than one gsi, and check for error', async () => {
    const projectName = 'migratingkey3';
    const initialSchema = 'migrations_key/initial_schema.graphql';
    const nextSchema1 = 'migrations_key/cant_add_more_gsi.graphql';

    await initJSProjectWithProfile(projRoot, { name: projectName });
    addFeatureFlag(projRoot, 'graphqltransformer', 'enableiterativegsiupdates', false);

    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await updateApiSchema(projRoot, projectName, initialSchema);
    await amplifyPush(projRoot);

    updateApiSchema(projRoot, projectName, nextSchema1);
    await expect(
      amplifyPushUpdate(
        projRoot,
        /Attempting to add more than 1 global secondary index SomeGSI1 and someGSI2 on the TodoTable table in the Todo stack.*/,
      ),
    ).rejects.toThrowError('Process exited with non zero exit code 1');
  });

  it('init project, run invalid migration when adding more than one gsi on the same table', async () => {
    const projectName = 'invalidgsiupdate';

    const initialSchema = 'migrations_key/simple_key.graphql';
    const nextSchema = 'migrations_key/cant_add_multiple_gsi.graphql';

    await initJSProjectWithProfile(projRoot, { name: projectName });
    addFeatureFlag(projRoot, 'graphqltransformer', 'enableiterativegsiupdates', false);

    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await updateApiSchema(projRoot, projectName, initialSchema);
    await amplifyPush(projRoot);

    updateApiSchema(projRoot, projectName, nextSchema);
    await expect(
      amplifyPushUpdate(
        projRoot,
        /Attempting to mutate more than 1 global secondary index at the same time on the TodoTable table in the Todo stack.*/,
      ),
    ).rejects.toThrowError('Process exited with non zero exit code 1');
  });
});
