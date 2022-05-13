import {
  addAuthWithCustomTrigger,
  addAuthWithDefault,
  addAuthWithDefaultSocial,
  addAuthWithRecaptchaTrigger,
  amplifyPull,
  amplifyPushAuth,
  amplifyPushUpdate,
  checkIfBucketExists,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initJSProjectWithProfile,
  setAmplifyAppIdInBackendAmplifyMeta,
} from 'amplify-e2e-core';
import {
  addEnvironment,
  addEnvironmentHostedUI,
  checkoutEnvironment,
  getEnvironment,
  importEnvironment,
  listEnvironment,
  pullEnvironment,
  removeEnvironment,
} from '../environment/env';

async function validate(meta: any) {
  expect(meta.providers.awscloudformation).toBeDefined();
  const {
    AuthRoleArn: authRoleArn, DeploymentBucketName: bucketName, Region: region, StackId: stackId,
  } = meta.providers.awscloudformation;

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

  it('init a project, pull, add auth, pull to override auth change', async () => {
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
    await amplifyPull(projRoot, { override: false });
    await addAuthWithDefault(projRoot, {});
    await amplifyPull(projRoot, { override: true });

    const meta = getProjectMeta(projRoot);
    await validate(meta);
  });
});

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
    await initJSProjectWithProfile(projRoot, { envName: 'env' });
    await addAuthWithDefault(projRoot, {});
    const providerConfig: string = await getEnvironment(projRoot, { envName: 'env' });
    await amplifyPushUpdate(projRoot);

    let projRoot2: string;
    try {
      projRoot2 = await createNewProjectDir('import-env-test2');
      await initJSProjectWithProfile(projRoot2, {});
      await importEnvironment(projRoot2, { providerConfig, envName: 'env' });
      await validate(getProjectMeta(projRoot));
      await validate(getProjectMeta(projRoot2));
    } finally {
      deleteProjectDir(projRoot2);
    }
  });
});

describe('environment commands with Cognito Triggers', () => {
  let projRoot: string;
  beforeAll(async () => {
    projRoot = await createNewProjectDir('env-test');
    await initJSProjectWithProfile(projRoot, { envName: 'enva' });
    await addAuthWithCustomTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
  });

  afterAll(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project, add and checkout environment', async () => {
    await addEnvironment(projRoot, { envName: 'envb' });
    await listEnvironment(projRoot, { numEnv: 2 });
    await checkoutEnvironment(projRoot, { envName: 'enva' });
    const meta = getProjectMeta(projRoot);
    await validate(meta);
  });

  it('init a project, pull environment', async () => {
    await pullEnvironment(projRoot);
    const meta = getProjectMeta(projRoot);
    await validate(meta);
  });
});

describe('environment commands with recaptcha trigger', () => {
  let projRoot: string;
  beforeAll(async () => {
    projRoot = await createNewProjectDir('env-test');
    await initJSProjectWithProfile(projRoot, { envName: 'enva' });
    await addAuthWithRecaptchaTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
  });

  afterAll(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project, add and checkout environment', async () => {
    await addEnvironment(projRoot, { envName: 'envb' });
    await listEnvironment(projRoot, { numEnv: 2 });
    await checkoutEnvironment(projRoot, { envName: 'enva' });
    const meta = getProjectMeta(projRoot);
    await validate(meta);
  });
  it('init a project, pull environment', async () => {
    await pullEnvironment(projRoot);
    const meta = getProjectMeta(projRoot);
    await validate(meta);
  });
});

describe('environment commands with HostedUI params', () => {
  let projRoot: string;
  beforeAll(async () => {
    projRoot = await createNewProjectDir('env-test');
    await initJSProjectWithProfile(projRoot, { envName: 'enva', disableAmplifyAppCreation: false});
    //setAmplifyAppIdInBackendAmplifyMeta(projRoot);
    await addAuthWithDefaultSocial(projRoot, {});
    await amplifyPushAuth(projRoot);
  });

  afterAll(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project, add and checkout environment', async () => {
    await addEnvironmentHostedUI(projRoot, { envName: 'envb' });
    await listEnvironment(projRoot, { numEnv: 2 });
    const meta = getProjectMeta(projRoot);
    await validate(meta);
  });

  it('init a project, pull environment', async () => {
    await pullEnvironment(projRoot);
    const meta = getProjectMeta(projRoot);
    await validate(meta);
  });
});
