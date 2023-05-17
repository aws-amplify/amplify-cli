import { addFeatureFlag, updateApiSchema, createNewProjectDir, deleteProjectDir, generateModels } from '@aws-amplify/amplify-e2e-core';
import { amplifyAppAndroid, amplifyAppAngular, amplifyAppIos, amplifyAppReact } from '../amplify-app-helpers/amplify-app-setup';

describe('data store modelgen tests', () => {
  let projRoot: string;
  const schemaWithAppSyncScalars = 'modelgen/model_gen_schema_with_aws_scalars.graphql';
  const schemaWithError = 'modelgen/model_gen_schema_with_errors.graphql';
  const projName = 'amplifyDatasource';

  beforeEach(async () => {
    projRoot = await createNewProjectDir('codegen-model');
  });

  afterEach(() => {
    deleteProjectDir(projRoot);
  });

  it('should generate models for android project', async () => {
    await amplifyAppAndroid(projRoot);
    updateApiSchema(projRoot, projName, schemaWithAppSyncScalars);

    addFeatureFlag(projRoot, 'graphqltransformer', 'transformerVersion', 1);
    addFeatureFlag(projRoot, 'graphqltransformer', 'useExperimentalPipelinedTransformer', false);

    await expect(generateModels(projRoot)).resolves.not.toThrow();
    updateApiSchema(projRoot, projName, schemaWithError);
    await expect(generateModels(projRoot)).rejects.toThrowError();
  });

  it('should generate models for iOS project', async () => {
    await amplifyAppIos(projRoot);
    updateApiSchema(projRoot, projName, schemaWithAppSyncScalars);

    addFeatureFlag(projRoot, 'graphqltransformer', 'transformerVersion', 1);
    addFeatureFlag(projRoot, 'graphqltransformer', 'useExperimentalPipelinedTransformer', false);

    await expect(generateModels(projRoot)).resolves.not.toThrow();
    updateApiSchema(projRoot, projName, schemaWithError);
    await expect(generateModels(projRoot)).rejects.toThrowError();
  });

  it('should generate models for angular project', async () => {
    await amplifyAppAngular(projRoot);
    updateApiSchema(projRoot, projName, schemaWithAppSyncScalars);

    addFeatureFlag(projRoot, 'graphqltransformer', 'transformerVersion', 1);
    addFeatureFlag(projRoot, 'graphqltransformer', 'useExperimentalPipelinedTransformer', false);

    await expect(generateModels(projRoot)).resolves.not.toThrow();
    updateApiSchema(projRoot, projName, schemaWithError);
    await expect(generateModels(projRoot)).rejects.toThrowError();
  });

  it('should generate models for react project', async () => {
    await amplifyAppReact(projRoot);
    updateApiSchema(projRoot, projName, schemaWithAppSyncScalars);

    addFeatureFlag(projRoot, 'graphqltransformer', 'transformerVersion', 1);
    addFeatureFlag(projRoot, 'graphqltransformer', 'useExperimentalPipelinedTransformer', false);

    await expect(generateModels(projRoot)).resolves.not.toThrow();
    updateApiSchema(projRoot, projName, schemaWithError);
    await expect(generateModels(projRoot)).rejects.toThrowError();
  });

  it('should fail to generate models for invalid schema', async () => {
    await amplifyAppReact(projRoot);
    addFeatureFlag(projRoot, 'graphqltransformer', 'transformerVersion', 1);
    addFeatureFlag(projRoot, 'graphqltransformer', 'useExperimentalPipelinedTransformer', false);

    updateApiSchema(projRoot, projName, schemaWithError);
    await expect(generateModels(projRoot)).rejects.toThrowError();
  });
});
