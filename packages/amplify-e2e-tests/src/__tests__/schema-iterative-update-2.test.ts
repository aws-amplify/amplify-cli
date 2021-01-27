import * as path from 'path';
import {
  createNewProjectDir,
  initJSProjectWithProfile,
  deleteProject,
  deleteProjectDir,
  addAuthWithDefault,
  addFeatureFlag,
  amplifyPush,
  updateApiSchema,
  amplifyPushUpdate,
  addApi,
} from 'amplify-e2e-core';

describe('Schema iterative update - add new @models and @key', () => {
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
  it('should support adding a new @key to existing @model and adding multiple @models with iam @auth enabled ', async () => {
    const apiName = 'addkeyandmodel';

    const initialSchema = path.join('iterative-push', 'add-one-key-multiple-models', 'initial-schema.graphql');
    await addAuthWithDefault(projectDir);
    await addApi(projectDir, {
      'API Key': {},
      'Amazon Cognito User Pool': {},
      IAM: {},
      apiOptions: {
        apiName,
        schemaPath: initialSchema,
      },
    });
    updateApiSchema(projectDir, apiName, initialSchema);
    await amplifyPush(projectDir);

    const finalSchema = path.join('iterative-push', 'add-one-key-multiple-models', 'final-schema.graphql');
    await updateApiSchema(projectDir, apiName, finalSchema);
    await amplifyPushUpdate(projectDir);
  });
});
