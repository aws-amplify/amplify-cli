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
} from '@aws-amplify/amplify-e2e-core';

describe('Schema iterative update - create update and delete', () => {
  let projectDir: string;

  beforeAll(async () => {
    projectDir = await createNewProjectDir('schemaIterative');
    await initJSProjectWithProfile(projectDir, {
      name: 'iterativetest1',
    });

    addFeatureFlag(projectDir, 'graphqltransformer', 'enableiterativegsiupdates', true);
  });
  afterAll(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });
  it('should support updating, adding and removing of @keys from same model', async () => {
    const apiName = 'iterativetest1';

    const initialSchema = path.join('iterative-push', 'add-remove-and-update-key', 'initial-schema.graphql');
    await addApiWithoutSchema(projectDir, { apiKeyExpirationDays: 7, transformerVersion: 1 });
    await updateApiSchema(projectDir, apiName, initialSchema);
    await amplifyPush(projectDir);

    const finalSchema = path.join('iterative-push', 'add-remove-and-update-key', 'final-schema.graphql');
    await updateApiSchema(projectDir, apiName, finalSchema);
    console.log("starting iterative updates");
    await amplifyPushUpdate(projectDir);
    console.log("done with iterative updates");
  });
});
