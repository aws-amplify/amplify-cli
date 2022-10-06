import {
  // eslint-disable-next-line spellcheck/spell-checker
  addAuthWithRecaptchaTrigger,
  amplifyPushAuth,
  checkIfBucketExists,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import {
  addEnvironment,
  checkoutEnvironment,
  listEnvironment,
  pullEnvironment,
} from '../environment/env';

// eslint-disable-next-line spellcheck/spell-checker
const envAName = 'enva';
// eslint-disable-next-line spellcheck/spell-checker
const envBName = 'envb';

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
