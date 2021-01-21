import * as path from 'path';
import {
  createNewProjectDir,
  initJSProjectWithProfile,
  deleteProject,
  deleteProjectDir,
  addApiWithSchema,
  addFeatureFlag,
  amplifyPush,
  updateApiSchema,
  amplifyPushUpdate,
} from 'amplify-e2e-core';

describe('Schema iterative update - rename @key', () => {
  let projectDir: string;

  beforeAll(async () => {
    projectDir = await createNewProjectDir('schemaIterative');
    await initJSProjectWithProfile(projectDir, {});

    addFeatureFlag(projectDir, 'graphqltransformer', 'enableiterativegsiupdates', true);
  });
  afterAll(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });
  it('should support changing gsi name', async () => {
    const apiName = 'renamekey';

    const initialSchema = path.join('iterative-push', 'change-model-name', 'initial-schema.graphql');
    await addApiWithSchema(projectDir, initialSchema, { apiName, apiKeyExpirationDays: 7 });
    await amplifyPush(projectDir);

    const finalSchema = path.join('iterative-push', 'change-model-name', 'final-schema.graphql');
    await updateApiSchema(projectDir, apiName, finalSchema);
    await amplifyPushUpdate(projectDir);
  });
});
