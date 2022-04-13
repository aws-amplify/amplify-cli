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
  initJSProjectWithProfile,
  transformCurrentProjectToGitPulledProject,
  updatedInitNewEnvWithProfile,
} from 'amplify-e2e-core';
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
    const {
      AuthRoleName, UnauthRoleName, UnauthRoleArn, AuthRoleArn, DeploymentBucketName,
    } = meta;
    expect(UnauthRoleName).toBeIAMRoleWithArn(UnauthRoleArn);
    expect(AuthRoleName).toBeIAMRoleWithArn(AuthRoleArn);
    expect(DeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);
  });

  it('test init on a git pulled project', async () => {
    const envName = 'dev';
    const resourceName = 'authConsoleTest';
    await initJSProjectWithProfile(projectRoot, { disableAmplifyAppCreation: false, name: resourceName, envName });
    await addAuthWithDefault(projectRoot, {});
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

    transformCurrentProjectToGitPulledProject(projectRoot);
    expect(() => {
      getParameters(projectRoot, category, authResourceName);
    }).toThrow();

    // add new environment test to not crash
    await updatedInitNewEnvWithProfile(projectRoot, { envName: 'test' });

    // check parameters.json exists
    expect(() => {
      getParameters(projectRoot, category, authResourceName);
    }).not.toThrow();
  });
});
