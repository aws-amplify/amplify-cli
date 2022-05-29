import {
  addApiWithoutSchema,
  apiGqlCompile,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getSchemaPath,
  getTransformConfig,
  initJSProjectWithProfile,
  setTransformConfig,
  updateApiSchema,
} from 'amplify-e2e-core';
import * as path from 'path';

describe('GraphQL transformer v2 - Custom transformers', () => {
  let projRoot: string;
  let projFolderName: string;

  beforeEach(async () => {
    projFolderName = 'graphqlv2customtransformer';
    projRoot = await createNewProjectDir(projFolderName);
  });

  afterEach(async () => {
    try {
      await deleteProject(projRoot);
    } catch (_) {
      // No-op.
    }

    deleteProjectDir(projRoot);
  });

  it('create a project including a custom transformer', async () => {
    const projName = 'v2customtransformer';
    const schemaDir = 'custom_transformers';
    const schemaFile = 'simple_custom_model.graphql';
    const schemaName = path.join(schemaDir, schemaFile);
    const schemaPath = getSchemaPath(schemaName);
    const customTransformerName = 'simple_custom_transformer.js';
    const customTransformerPath = schemaPath.replace(schemaFile, customTransformerName);

    await initJSProjectWithProfile(projRoot, { name: projName });
    await addApiWithoutSchema(projRoot);
    await updateApiSchema(projRoot, projName, schemaName);

    // GQL compile should fail initially because the transformer does
    // not know about the custom directive.
    await expect(async () => {
      await apiGqlCompile(projRoot);
    }).rejects.toThrow();

    // Add the custom directive.
    const config = getTransformConfig(projRoot, projName);
    config.transformers ??= [];
    config.transformers.push(customTransformerPath);
    setTransformConfig(projRoot, projName, config);

    // GQL compile should pass now because the transformer knows about
    // the custom directive.
    await apiGqlCompile(projRoot);
  });
});
