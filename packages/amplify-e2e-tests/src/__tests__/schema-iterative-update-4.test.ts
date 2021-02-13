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

describe('Schema iterative update - create update and delete', () => {
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
  it('should support updating, adding and removing of @keys from same model', async () => {
    const apiName = 'iterativetest1';

    const initialSchema = path.join('iterative-push', 'add-remove-and-update-key', 'initial-schema.graphql');
    await addApiWithSchema(projectDir, initialSchema, { apiName, apiKeyExpirationDays: 7 });
    await amplifyPush(projectDir);

    const finalSchema = path.join('iterative-push', 'add-remove-and-update-key', 'final-schema.graphql');
    await updateApiSchema(projectDir, apiName, finalSchema);
    await amplifyPushUpdate(projectDir);
  });
});
