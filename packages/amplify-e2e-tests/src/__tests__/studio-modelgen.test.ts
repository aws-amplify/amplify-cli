import {
  initAndroidProjectWithProfile,
  addApiWithBlankSchemaAndConflictDetection,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  enableAdminUI,
  getLocalEnvInfo,
  getProjectMeta,
  amplifyPush,
  updateApiSchema,
  getDeploymentBucketObject,
  getProjectConfig,
} from '@aws-amplify/amplify-e2e-core';

describe('upload Studio CMS assets on push of Studio enabled project', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('studio-cms-upload');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('uploads expected CMS assets to shared location in S3 bucket', async () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const name = 'studiocmstest';
    const defaultsSettings = {
      disableAmplifyAppCreation: false,
      name,
    };
    // init an android project to check that studio modelgen generates JS types even with other frontend config
    await initAndroidProjectWithProfile(projRoot, defaultsSettings);

    const originalProjectConfig = getProjectConfig(projRoot);

    const meta = getProjectMeta(projRoot);
    const appId = meta.providers?.awscloudformation?.AmplifyAppId;
    const region = meta.providers?.awscloudformation?.Region;

    expect(appId).toBeDefined();

    const localEnvInfo = getLocalEnvInfo(projRoot);
    const { envName } = localEnvInfo;

    // setup Amplify Studio backend
    await enableAdminUI(appId, envName, region);

    await addApiWithBlankSchemaAndConflictDetection(projRoot, { transformerVersion: 2 });
    await updateApiSchema(projRoot, name, 'simple_model.graphql');
    await amplifyPush(projRoot);

    // expect CMS assets to be present in S3
    await expect(getDeploymentBucketObject(projRoot, `models/${name}/schema.graphql`)).resolves.toMatchInlineSnapshot(`
            "type Todo @model {
              id: ID!
              content: String
            }
            "
          `);
    await expect(getDeploymentBucketObject(projRoot, `models/${name}/schema.js`)).resolves.toMatchSnapshot();
    await expect(getDeploymentBucketObject(projRoot, `models/${name}/modelIntrospection.json`)).resolves.toMatchSnapshot();

    // expect project config to be unmodified
    expect(getProjectConfig(projRoot)).toEqual(originalProjectConfig);
  });

  it('able to generate and upload Codegen model artifacts for schema with connected PK', async () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const name = 'pkmodelgen';
    const schemaName = 'modelgen/schema_with_connected_pk.graphql';
    const defaultsSettings = {
      disableAmplifyAppCreation: false,
      name,
    };
    // init an android project to check that studio modelgen generates JS types even with other frontend config
    await initAndroidProjectWithProfile(projRoot, defaultsSettings);

    const originalProjectConfig = getProjectConfig(projRoot);

    const meta = getProjectMeta(projRoot);
    const appId = meta.providers?.awscloudformation?.AmplifyAppId;
    const region = meta.providers?.awscloudformation?.Region;

    expect(appId).toBeDefined();

    const localEnvInfo = getLocalEnvInfo(projRoot);
    const { envName } = localEnvInfo;

    // setup Amplify Studio backend
    await enableAdminUI(appId, envName, region);

    await addApiWithBlankSchemaAndConflictDetection(projRoot, { transformerVersion: 2 });
    await updateApiSchema(projRoot, name, schemaName);
    await amplifyPush(projRoot);

    // expect CMS assets to be present in S3
    await expect(getDeploymentBucketObject(projRoot, `models/${name}/schema.graphql`)).resolves.toMatchSnapshot();
    await expect(getDeploymentBucketObject(projRoot, `models/${name}/schema.js`)).resolves.toMatchSnapshot();
    await expect(getDeploymentBucketObject(projRoot, `models/${name}/modelIntrospection.json`)).resolves.toMatchSnapshot();

    // expect project config to be unmodified
    expect(getProjectConfig(projRoot)).toEqual(originalProjectConfig);
  });
});
