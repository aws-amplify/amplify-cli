import {
  addAuthWithCustomTrigger,
  addAuthWithDefault,
  addAuthWithDefaultSocial,
  // eslint-disable-next-line spellcheck/spell-checker
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
} from '@aws-amplify/amplify-e2e-core';
import {
  addEnvironment,
  addEnvironmentHostedUI,
  checkoutEnvironment,
  importEnvironment,
  listEnvironment,
  pullEnvironment,
  removeEnvironment,
} from '../environment/env';

// eslint-disable-next-line spellcheck/spell-checker
const envAName = 'enva';
// eslint-disable-next-line spellcheck/spell-checker
const envBName = 'envb';

const validate = async (meta: any): Promise<void> => {
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
    await initJSProjectWithProfile(projRoot, { envName: envAName, disableAmplifyAppCreation: false });
    await listEnvironment(projRoot, {});
    await addEnvironment(projRoot, { envName: envBName });
    await listEnvironment(projRoot, { numEnv: 2 });
    await checkoutEnvironment(projRoot, { envName: envAName });
    await removeEnvironment(projRoot, { envName: envBName });
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

describe('environment commands with Cognito Triggers', () => {
  let projRoot: string;
  beforeAll(async () => {
    projRoot = await createNewProjectDir('env-test');
    await initJSProjectWithProfile(projRoot, { envName: envAName, disableAmplifyAppCreation: false });
    await addAuthWithCustomTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
  });

  afterAll(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project, add and checkout environment', async () => {
    await addEnvironment(projRoot, { envName: envBName });
    await listEnvironment(projRoot, { numEnv: 2 });
    await checkoutEnvironment(projRoot, { envName: envAName });
    const meta = getProjectMeta(projRoot);
    await validate(meta);
  });

  it('init a project, pull environment', async () => {
    await pullEnvironment(projRoot);
    const meta = getProjectMeta(projRoot);
    await validate(meta);
  });
});

// eslint-disable-next-line spellcheck/spell-checker
describe('environment commands with recaptcha trigger', () => {
  let projRoot: string;
  beforeAll(async () => {
    projRoot = await createNewProjectDir('env-test');
    await initJSProjectWithProfile(projRoot, { envName: envAName, disableAmplifyAppCreation: false });
    // eslint-disable-next-line spellcheck/spell-checker
    await addAuthWithRecaptchaTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
  });

  afterAll(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project, add and checkout environment', async () => {
    await addEnvironment(projRoot, { envName: envBName });
    await listEnvironment(projRoot, { numEnv: 2 });
    await checkoutEnvironment(projRoot, { envName: envAName });
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
    await initJSProjectWithProfile(projRoot, { envName: envAName, disableAmplifyAppCreation: false });
    await addAuthWithDefaultSocial(projRoot, {});
    await amplifyPushAuth(projRoot);
  });

  afterAll(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project, add and checkout environment', async () => {
    await addEnvironmentHostedUI(projRoot, { envName: envBName });
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
