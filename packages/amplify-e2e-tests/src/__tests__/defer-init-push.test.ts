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
  it('does not create a root stack until running amplify push', async () => {
    await initJSProjectWithProfile(projRoot, { name: 'deferInitPush' });
    const tpi_before = getTeamProviderInfo(projRoot);
    expect(tpi_before?.dev?.awscloudformation?.DeploymentBucket).toBeUndefined();
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await amplifyPushAuth(projRoot);
    const tpi_after = getTeamProviderInfo(projRoot);
    expect(tpi_after?.dev?.awscloudformation?.DeploymentBucket).toBeDefined();
  });

  it('creates a root stack when doing headless init', async () => {
    await amplifyInitYes(projRoot);
    const tpi_after = getTeamProviderInfo(projRoot);
    expect(tpi_after?.dev?.awscloudformation?.DeploymentBucket).toBeDefined();
  });

  it('creates a root stack when doing headless env add', async () => {
    await initJSProjectWithProfile(projRoot, { name: 'deferInitPush' });
    const tpi_dev = getTeamProviderInfo(projRoot);
    expect(tpi_dev?.dev?.awscloudformation?.DeploymentBucket).toBeUndefined();
    await addEnvironmentYes(projRoot, { envName: 'test' });
    const tpi_test = getTeamProviderInfo(projRoot);
    expect(tpi_test?.test?.awscloudformation?.DeploymentBucket).toBeDefined();
  });

  it('can checkout unpushed environment', async () => {
    await initJSProjectWithProfile(projRoot, { name: 'deferInitPush' });
    const tpi_dev = getTeamProviderInfo(projRoot);
    expect(tpi_dev?.dev?.awscloudformation?.DeploymentBucket).toBeUndefined();
    await addEnvironment(projRoot, { envName: 'test' });
    const tpi_test = getTeamProviderInfo(projRoot);
    expect(tpi_test?.test?.awscloudformation?.DeploymentBucket).toBeUndefined();
    await checkoutEnvironment(projRoot, { envName: 'dev' });
    const localEnvInfo = getLocalEnvInfo(projRoot);
    expect(localEnvInfo?.envName).toEqual('dev');
  });

  it('can remove a non-pushed env', async () => {
    await initJSProjectWithProfile(projRoot, { name: 'deferInitPush' });
    await addEnvironment(projRoot, { envName: 'test' });
    await checkoutEnvironment(projRoot, { envName: 'dev' });
    const tpi_before = getTeamProviderInfo(projRoot);
    expect(Object.keys(tpi_before).sort()).toEqual(['dev', 'test']);
    await removeEnvironment(projRoot, { envName: 'test' });
    const tpi_after = getTeamProviderInfo(projRoot);
    expect(Object.keys(tpi_after)).toEqual(['dev']);
  });
});
