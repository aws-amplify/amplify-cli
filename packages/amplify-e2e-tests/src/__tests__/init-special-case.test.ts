import { category } from '@aws-amplify/amplify-category-auth';
import {
  addAuthWithDefault,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getBackendAmplifyMeta,
  getParameters,
  getTeamProviderInfo,
  initJSProjectWithProfile,
  transformCurrentProjectToGitPulledProject,
  updatedInitNewEnvWithProfile,
} from 'amplify-e2e-core';
import * as specialCaseInit from '../init-special-cases';

describe('amplify init', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('special-init');
  });

  afterEach(async () => {
    // await deleteProject(projRoot);
    // deleteProjectDir(projRoot);
  });

  it('init without credential files and no new user set up', async () => {
    await specialCaseInit.initWithoutCredentialFileAndNoNewUserSetup(projRoot);
    const meta = getBackendAmplifyMeta(projRoot).providers.awscloudformation;
    expect(meta.Region).toBeDefined();
    const { AuthRoleName, UnauthRoleName, UnauthRoleArn, AuthRoleArn, DeploymentBucketName } = meta;
    expect(UnauthRoleName).toBeIAMRoleWithArn(UnauthRoleArn);
    expect(AuthRoleName).toBeIAMRoleWithArn(AuthRoleArn);
    expect(DeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);
  });

  it.only('test init on a git pulled project', async () => {
    const envName = 'dev';
    const resourceName = 'authConsoleTest';
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false, name: resourceName, envName });
    await addAuthWithDefault(projRoot, {});
    await amplifyPushAuth(projRoot);
    let teamInfo = getTeamProviderInfo(projRoot);
    expect(teamInfo).toBeDefined();
    let appId = teamInfo[envName].awscloudformation.AmplifyAppId;
    let stackName = teamInfo[envName].awscloudformation.StackName;
    expect(stackName).toBeDefined();
    expect(appId).toBeDefined();
    expect(teamInfo[envName].categories.auth).toBeDefined();
    /**
     * simulate git clone by deleteing files based on .gitignore
     */
    transformCurrentProjectToGitPulledProject(projRoot);

    // to not crash
    expect(await updatedInitNewEnvWithProfile(projRoot, { envName })).not.toThrow();

    // check parameters.json exists
    expect(getParameters(projRoot, category, resourceName)).not.toThrow();
  });
});
