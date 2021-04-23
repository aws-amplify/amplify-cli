import {
  addFunction,
  amplifyInitYes,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getLocalEnvInfo,
  getTeamProviderInfo,
  initJSProjectWithProfile,
} from 'amplify-e2e-core';
import { addEnvironment, addEnvironmentYes, checkoutEnvironment, removeEnvironment } from '../environment/env';

describe('defer root stack push', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('defer-init-push');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('does not create a root stack on interactive init', async () => {
    await initJSProjectWithProfile(projRoot, { name: 'deferInitPush', envName: 'dev' });
    const tpi_before = getTeamProviderInfo(projRoot);
    expect(tpi_before?.dev?.awscloudformation?.DeploymentBucketName).toBeUndefined();
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await amplifyPushAuth(projRoot);
    const tpi_after = getTeamProviderInfo(projRoot);
    expect(tpi_after?.dev?.awscloudformation?.DeploymentBucketName).toBeDefined();
  });

  it('does not create a root stack on interactive env add', async () => {
    await initJSProjectWithProfile(projRoot, { name: 'deferInitPush', envName: 'dev' });
    const tpi_dev = getTeamProviderInfo(projRoot);
    expect(tpi_dev?.dev?.awscloudformation?.DeploymentBucketName).toBeUndefined();
    await addEnvironment(projRoot, { envName: 'test' });
    const tpi_test = getTeamProviderInfo(projRoot);
    expect(tpi_test?.test?.awscloudformation?.DeploymentBucketName).toBeUndefined();
  });

  it('creates a root stack on headless init', async () => {
    await amplifyInitYes(projRoot);
    const tpi_after = getTeamProviderInfo(projRoot);
    expect(tpi_after?.dev?.awscloudformation?.DeploymentBucketName).toBeDefined();
  });

  it('creates a root stack on headless env add', async () => {
    await initJSProjectWithProfile(projRoot, { name: 'deferInitPush', envName: 'dev' });
    const tpi_dev = getTeamProviderInfo(projRoot);
    expect(tpi_dev?.dev?.awscloudformation?.DeploymentBucketName).toBeUndefined();
    await addEnvironmentYes(projRoot, { envName: 'test' });
    const tpi_test = getTeamProviderInfo(projRoot);
    expect(tpi_test?.test?.awscloudformation?.DeploymentBucketName).toBeDefined();
  });

  it('can checkout unpushed environment', async () => {
    await initJSProjectWithProfile(projRoot, { name: 'deferInitPush', envName: 'dev' });
    const tpi_dev = getTeamProviderInfo(projRoot);
    expect(tpi_dev?.dev?.awscloudformation?.DeploymentBucketName).toBeUndefined();
    await addEnvironment(projRoot, { envName: 'test' });
    const tpi_test = getTeamProviderInfo(projRoot);
    expect(tpi_test?.test?.awscloudformation?.DeploymentBucketName).toBeUndefined();
    await checkoutEnvironment(projRoot, { envName: 'dev' });
    const localEnvInfo = getLocalEnvInfo(projRoot);
    expect(localEnvInfo?.envName).toEqual('dev');
  });

  it('can remove unpushed environment', async () => {
    await initJSProjectWithProfile(projRoot, { name: 'deferInitPush', envName: 'dev' });
    await addEnvironment(projRoot, { envName: 'test' });
    await checkoutEnvironment(projRoot, { envName: 'dev' });
    const tpi_before = getTeamProviderInfo(projRoot);
    expect(Object.keys(tpi_before).sort()).toEqual(['dev', 'test']);
    await removeEnvironment(projRoot, { envName: 'test' });
    const tpi_after = getTeamProviderInfo(projRoot);
    expect(Object.keys(tpi_after)).toEqual(['dev']);
  });
});
