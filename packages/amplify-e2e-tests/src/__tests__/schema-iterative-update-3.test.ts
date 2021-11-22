import * as path from 'path';
import {
  createNewProjectDir,
  initJSProjectWithProfile,
  deleteProject,
  deleteProjectDir,
  addApiWithoutSchema,
  addFeatureFlag,
  amplifyPush,
  updateApiSchema,
  amplifyPushUpdate,
} from 'amplify-e2e-core';

describe('Schema iterative update - delete', () => {
  let projectDir: string;

  beforeAll(async () => {
    projectDir = await createNewProjectDir('schemaIterative');
    await initJSProjectWithProfile(projectDir, {
      name: 'deletekeys',
    });

    addFeatureFlag(projectDir, 'graphqltransformer', 'enableiterativegsiupdates', true);
  });
  afterAll(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });
  it('should support removal of multiple @key directive from a single @model ', async () => {
    const apiName = 'deletekeys';

    const initialSchema = path.join('iterative-push', 'multiple-key-delete', 'initial-schema.graphql');
    await addApiWithoutSchema(projectDir, { apiKeyExpirationDays: 7, transformerVersion: 1 });
    await updateApiSchema(projectDir, apiName, initialSchema);
    await amplifyPush(projectDir);

    const finalSchema = path.join('iterative-push', 'multiple-key-delete', 'final-schema.graphql');
    await updateApiSchema(projectDir, apiName, finalSchema);
    await amplifyPushUpdate(projectDir);
  });
});
