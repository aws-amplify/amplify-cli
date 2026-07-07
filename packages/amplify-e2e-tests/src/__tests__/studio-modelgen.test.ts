import {
  initAndroidProjectWithProfile,
  addApiWithBlankSchema,
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

describe('upload Studio CMS assets on push', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('studio-cms-upload');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });
  it.each([
    [true, true],
    [false, true],
    [false, false],
  ])(
    'uploads expected CMS assets to shared location in S3 bucket %p %p',
    async (isStudioEnabled: boolean, apiWithConflictDetection: boolean) => {
      // eslint-disable-next-line spellcheck/spell-checker
      const name = `cms${isStudioEnabled}${apiWithConflictDetection}`;
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

      const localEnvInfo = getLocalEnvInfo(projRoot);
      const { envName } = localEnvInfo;

      if (isStudioEnabled) {
        expect(appId).toBeDefined();
        // setup Amplify Studio backend
        await enableAdminUI(appId, envName, region);
      }

      if (apiWithConflictDetection) {
        await addApiWithBlankSchemaAndConflictDetection(projRoot, { transformerVersion: 2 });
      } else {
        await addApiWithBlankSchema(projRoot, { transformerVersion: 2 });
      }
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
    },
  );
});
