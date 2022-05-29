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
  createRandomName,
} from 'amplify-e2e-core';

describe('Schema iterative update - rename @key', () => {
  let projectDir: string;
  let appName: string;

  beforeAll(async () => {
    appName = createRandomName();
    projectDir = await createNewProjectDir('schemaIterative');
    await initJSProjectWithProfile(projectDir, {
      name: appName,
    });

    addFeatureFlag(projectDir, 'graphqltransformer', 'enableiterativegsiupdates', true);
  });
  afterAll(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });
  it('should support changing gsi name', async () => {
    const initialSchema = path.join('iterative-push', 'change-model-name', 'initial-schema.graphql');
    await addApiWithoutSchema(projectDir, { apiKeyExpirationDays: 7, transformerVersion: 1 });
    await updateApiSchema(projectDir, appName, initialSchema);
    await amplifyPush(projectDir);

    const finalSchema = path.join('iterative-push', 'change-model-name', 'final-schema.graphql');
    await updateApiSchema(projectDir, appName, finalSchema);
    await amplifyPushUpdate(projectDir, undefined, undefined, true);
  });
});
