import {
  addAuthWithDefault,
  amplifyPushUpdate,
  checkIfBucketExists,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import {
  importEnvironment,
} from '../environment/env';

const validate = async (meta: any) : Promise<void> => {
  expect(meta.providers.awscloudformation).toBeDefined();
  const {
    AuthRoleArn: authRoleArn, DeploymentBucketName: bucketName, Region: region, StackId: stackId,
  } = meta.providers.awscloudformation;

  expect(authRoleArn).toBeDefined();
  expect(region).toBeDefined();
  expect(stackId).toBeDefined();
  const bucketExists = await checkIfBucketExists(bucketName, region);
  expect(bucketExists).toMatchObject({});
};

describe('cross project environment commands', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('import-env-test');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init two projects, get and import environment from one to the other', async () => {
    await initJSProjectWithProfile(projRoot, { envName: 'env', disableAmplifyAppCreation: false });
    await addAuthWithDefault(projRoot, {});
    const providerConfig = getProjectMeta(projRoot).providers;
    await amplifyPushUpdate(projRoot);

    let projRoot2: string;
    try {
      projRoot2 = await createNewProjectDir('import-env-test2');
      await initJSProjectWithProfile(projRoot2, {});
      await importEnvironment(projRoot2, { providerConfig: JSON.stringify(providerConfig), envName: 'env' });
      await validate(getProjectMeta(projRoot));
      await validate(getProjectMeta(projRoot2));
    } finally {
      deleteProjectDir(projRoot2);
    }
  });
});
