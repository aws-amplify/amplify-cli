import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPush,
  amplifyPushForce,
  addFeatureFlag,
  createRandomName,
  addAuthWithDefault,
} from 'amplify-e2e-core';
import { addApiWithoutSchema, updateApiSchema } from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';

describe('transformer @http migration test', () => {
  let projRoot: string;
  let projectName: string;

  beforeEach(async () => {
    projectName = createRandomName();
    projRoot = await createNewProjectDir(createRandomName());
    await initJSProjectWithProfile(projRoot, { name: projectName });
    await addAuthWithDefault(projRoot, {});
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('migration of @http schema', async () => {
    const httpSchema = 'transformer_migration/http.graphql';

    await addApiWithoutSchema(projRoot, { apiName: projectName, transformerVersion: 1 });
    await updateApiSchema(projRoot, projectName, httpSchema);
    await amplifyPush(projRoot);

    await addFeatureFlag(projRoot, 'graphqltransformer', 'transformerVersion', 2);
    await addFeatureFlag(projRoot, 'graphqltransformer', 'useExperimentalPipelinedTransformer', true);

    await updateApiSchema(projRoot, projectName, httpSchema);
    await amplifyPushForce(projRoot);
  });
});
