import { amplifyPushAuth, amplifyPull, deleteProject, initJSProjectWithProfile } from '../init';
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

describe('environment commands', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir();
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
    expect(meta.providers.awscloudformation).toBeDefined();
    const {
      AuthRoleArn: authRoleArn,
      DeploymentBucketName: bucketName,
      Region: region,
      StackId: stackId,
    } = meta.providers.awscloudformation;

    expect(authRoleArn).toBeDefined();
    expect(region).toBeDefined();
    expect(stackId).toBeDefined();
    const bucketExists = await checkIfBucketExists(bucketName, region);
    expect(bucketExists).toMatchObject({});
  });

  // it('init two projects, get and import environment from one to the other', async () => {
  //   await initJSProjectWithProfile(projRoot, { envName: 'env' });
  //   await addAuthWithDefault(projRoot, {});
  //   const providerConfig = await getEnvironment(projRoot, { envName: 'env' });
  //   expect(providerConfig === JSON.stringify(JSON.parse(providerConfig))).toBeTruthy();
  //   await amplifyPushAuth(projRoot);

  //   try {
  //     let projRoot2 = createNewProjectDir();
  //     await initJSProjectWithProfile(projRoot2, {});
  //     await importEnvironment(projRoot2, { providerConfig, envName: 'env' });

  //     const meta2 = getProjectMeta(projRoot2);
  //     expect(meta2.providers.awscloudformation).toBeDefined();
  //     const {
  //       AuthRoleArn: authRoleArn2,
  //       DeploymentBucketName: bucketName2,
  //       Region: region2,
  //       StackId: stackId2,
  //     } = meta2.providers.awscloudformation;

  //     expect(authRoleArn2).toBeDefined();
  //     expect(region2).toBeDefined();
  //     expect(stackId2).toBeDefined();

  //     const bucket2Exists = await checkIfBucketExists(bucketName2, region2);
  //     expect(bucket2Exists).toMatchObject({});

  //     await listEnvironment(projRoot2, {});

  //   } catch(e) {
  //     console.error(e);
  //   } finally {
  //     console.log('Finally delete:', projRoot2)
  //     await deleteProject(projRoot2);
  //     deleteProjectDir(projRoot2);
  //   }

  //   await pullEnvironment(projRoot, {});
  //   await amplifyPull(projRoot, {});

  //   let meta1 = getProjectMeta(projRoot);
  //   expect(meta1.providers.awscloudformation).toBeDefined();
  //   let {
  //     AuthRoleArn: authRoleArn1,
  //     DeploymentBucketName: bucketName1,
  //     Region: region1,
  //     StackId: stackId1,
  //   } = meta1.providers.awscloudformation;

  //   expect(authRoleArn1).toBeDefined();
  //   expect(region1).toBeDefined();
  //   expect(stackId1).toBeDefined();
  //   const bucket1Exists = await checkIfBucketExists(bucketName1, region1);
  //   expect(bucket1Exists).toMatchObject({});
  // });

  it('init a project, pull, add auth, pull to override auth change', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await amplifyPull(projRoot, { override: false });
    await addAuthWithDefault(projRoot, {});
    await amplifyPull(projRoot, { override: true });

    const meta = getProjectMeta(projRoot);
    expect(meta.providers.awscloudformation).toBeDefined();
    const {
      AuthRoleArn: authRoleArn,
      DeploymentBucketName: bucketName,
      Region: region,
      StackId: stackId,
    } = meta.providers.awscloudformation;

    expect(authRoleArn).toBeDefined();
    expect(region).toBeDefined();
    expect(stackId).toBeDefined();
    const bucketExists = await checkIfBucketExists(bucketName, region);
    expect(bucketExists).toMatchObject({});
  });
});
