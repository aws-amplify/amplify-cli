import {
  addAuthWithDefault,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getBackendAmplifyMeta,
  getParameters,
  getProjectMeta,
  getTeamProviderInfo,
  gitCleanFdx,
  gitCommitAll,
  gitInit,
  initHeadless,
  initJSProjectWithProfile,
  updateAuthAddUserGroups,
  updatedInitNewEnvWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import * as specialCaseInit from '../init-special-cases';

describe('amplify init', () => {
  let projectRoot: string;
  beforeEach(async () => {
    projectRoot = await createNewProjectDir('special-init');
  });

  afterEach(async () => {
    await deleteProject(projectRoot);
    deleteProjectDir(projectRoot);
  });

  it('init without credential files and no new user set up', async () => {
    await specialCaseInit.initWithoutCredentialFileAndNoNewUserSetup(projectRoot);
    const meta = getBackendAmplifyMeta(projectRoot).providers.awscloudformation;
    expect(meta.Region).toBeDefined();
    const { AuthRoleName, UnauthRoleName, UnauthRoleArn, AuthRoleArn, DeploymentBucketName } = meta;
    await expect(UnauthRoleName).toBeIAMRoleWithArn(UnauthRoleArn);
    await expect(AuthRoleName).toBeIAMRoleWithArn(AuthRoleArn);
    await expect(DeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);
  });

  it('test init on a git pulled project', async () => {
    const envName = 'devtest';
    const resourceName = 'authConsoleTest';
    await initJSProjectWithProfile(projectRoot, { disableAmplifyAppCreation: false, name: resourceName, envName });
    await addAuthWithDefault(projectRoot);
    await updateAuthAddUserGroups(projectRoot, ['group']);
    await amplifyPushAuth(projectRoot);
    const teamInfo = getTeamProviderInfo(projectRoot);
    expect(teamInfo).toBeDefined();
    const appId = teamInfo[envName].awscloudformation.AmplifyAppId;
    const stackName = teamInfo[envName].awscloudformation.StackName;
    expect(stackName).toBeDefined();
    expect(appId).toBeDefined();
    expect(teamInfo[envName].categories.auth).toBeDefined();
    const meta = getProjectMeta(projectRoot);

    const authResourceName = Object.keys(meta.auth)[0];
    const category = 'auth';

    await gitInit(projectRoot);
    await gitCommitAll(projectRoot);
    await gitCleanFdx(projectRoot);
    expect(() => {
      getParameters(projectRoot, category, authResourceName);
    }).toThrow();

    // add new environment test to not crash
    const newEnvName = `test${Date.now()}`;
    await updatedInitNewEnvWithProfile(projectRoot, { envName: newEnvName });

    // check parameters.json exists
    expect(() => {
      getParameters(projectRoot, category, authResourceName);
    }).not.toThrow();
  });

  it('should fail if running amplify init -y on already initialized project', async () => {
    const envName = 'devtest';
    const resourceName = 'twoInitDefaultTest';
    await initJSProjectWithProfile(projectRoot, { disableAmplifyAppCreation: false, name: resourceName, envName });
    await expect(initHeadless(projectRoot)).rejects.toThrowError('Process exited with non zero exit code 1');
  });
});
