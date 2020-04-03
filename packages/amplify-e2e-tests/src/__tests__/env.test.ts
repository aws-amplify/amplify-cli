import { amplifyPushUpdate, amplifyPull, deleteProject, initJSProjectWithProfile } from '../init';
import { checkIfBucketExists, createNewProjectDir, deleteProjectDir, getProjectMeta } from '../utils';
import { addAuthWithDefault } from '../categories/auth';
import {
  addEnvironment,
  checkoutEnvironment,
  getEnvironment,
  importEnvironment,
  listEnvironment,
  pullEnvironment,
  removeEnvironment,
} from '../environment/add-env';

async function validate(meta: any) {
  expect(meta.providers.awscloudformation).toBeDefined();
  const { AuthRoleArn: authRoleArn, DeploymentBucketName: bucketName, Region: region, StackId: stackId } = meta.providers.awscloudformation;

  expect(authRoleArn).toBeDefined();
  expect(region).toBeDefined();
  expect(stackId).toBeDefined();
  const bucketExists = await checkIfBucketExists(bucketName, region);
  expect(bucketExists).toMatchObject({});
}

describe('environment commands', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('env-test');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project, add environments, list them, then remove them', async () => {
    await initJSProjectWithProfile(projRoot, { envName: 'enva' });
    await listEnvironment(projRoot, {});
    await addEnvironment(projRoot, { envName: 'envb' });
    await listEnvironment(projRoot, { numEnv: 2 });
    await checkoutEnvironment(projRoot, { envName: 'enva' });
    await removeEnvironment(projRoot, { envName: 'envb' });
    await listEnvironment(projRoot, {});

    const meta = getProjectMeta(projRoot);
    await validate(meta);
  });

  it('init two projects, get and import environment from one to the other', async () => {
    await initJSProjectWithProfile(projRoot, { envName: 'env' });
    await addAuthWithDefault(projRoot, {});
    const providerConfig: string = await getEnvironment(projRoot, { envName: 'env' });
    expect(providerConfig === JSON.stringify(JSON.parse(providerConfig))).toBeTruthy();
    await amplifyPushUpdate(projRoot);
    let projRoot2: string;
    try {
      projRoot2 = await createNewProjectDir('env-test2');
      await initJSProjectWithProfile(projRoot2, {});
      await importEnvironment(projRoot2, { providerConfig, envName: 'env' });
      const meta2 = getProjectMeta(projRoot2);
      await validate(meta2);
    } catch (e) {
      console.error(e);
    } finally {
      await deleteProject(projRoot2);
      deleteProjectDir(projRoot2);
    }
    // await pullEnvironment(projRoot, {});
    // await amplifyPull(projRoot, {});

    const meta1 = getProjectMeta(projRoot);
    await validate(meta1);
  });

  it('init a project, pull, add auth, pull to override auth change', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await amplifyPull(projRoot, { override: false });
    await addAuthWithDefault(projRoot, {});
    await amplifyPull(projRoot, { override: true });

    const meta = getProjectMeta(projRoot);
    await validate(meta);
  });
});
