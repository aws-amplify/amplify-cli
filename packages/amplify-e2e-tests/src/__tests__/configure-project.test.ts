import { amplifyConfigureProject, createNewProjectDir, deleteProject, deleteProjectDir, initJSProjectWithProfile } from 'amplify-e2e-core';
import { stateManager } from 'amplify-cli-core';

describe('amplify configure project tests', () => {
  let projRoot: string;
  const envName = 'integtest';
  beforeAll(async () => {
    projRoot = await createNewProjectDir('configProjTest');
    await initJSProjectWithProfile(projRoot, { envName });
  });

  afterAll(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('should update the project to use access keys', async () => {
    await amplifyConfigureProject({ cwd: projRoot, profileOption: 'Update AWS Profile', authenticationOption: 'AWS access keys' });
    const projectConfigForEnv = getLocalAwsInfoForEnv(projRoot, envName);
    expect(projectConfigForEnv).toBeDefined();
    expect(projectConfigForEnv.configLevel).toBe('project');
    expect(projectConfigForEnv.useProfile).toBe(false);
    expect(projectConfigForEnv.awsConfigFilePath).toBeDefined();
  });

  it('should update the project to use a profile', async () => {
    await amplifyConfigureProject({ cwd: projRoot, profileOption: 'Update AWS Profile', authenticationOption: 'AWS profile' });
    const projectConfigForEnv = getLocalAwsInfoForEnv(projRoot, envName);
    expect(projectConfigForEnv).toBeDefined();
    expect(projectConfigForEnv.configLevel).toBe('project');
    expect(projectConfigForEnv.useProfile).toBe(true);
    expect(projectConfigForEnv.profileName).toBeDefined();
  });

  it('should update the project to remove a profile', async () => {
    await amplifyConfigureProject({ cwd: projRoot, profileOption: 'Remove AWS Profile' });
    const projectConfigForEnv = getLocalAwsInfoForEnv(projRoot, envName);
    expect(projectConfigForEnv).toBeDefined();
    expect(projectConfigForEnv.configLevel).toBe('general');
  });

  it('should update the project to add access keys when configLevel is general', async () => {
    await amplifyConfigureProject({ cwd: projRoot, configLevel: 'general', authenticationOption: 'AWS access keys' });
    const projectConfigForEnv = getLocalAwsInfoForEnv(projRoot, envName);
    expect(projectConfigForEnv).toBeDefined();
    expect(projectConfigForEnv.configLevel).toBe('project');
    expect(projectConfigForEnv.useProfile).toBe(false);
    expect(projectConfigForEnv.awsConfigFilePath).toBeDefined();
  });

  // Set to profile last or deletProject() in afterAll() will fail
  it('should update the project to use a profile', async () => {
    await amplifyConfigureProject({ cwd: projRoot, profileOption: 'Update AWS Profile', authenticationOption: 'AWS profile' });
    const projectConfigForEnv = getLocalAwsInfoForEnv(projRoot, envName);
    expect(projectConfigForEnv).toBeDefined();
    expect(projectConfigForEnv.configLevel).toBe('project');
    expect(projectConfigForEnv.useProfile).toBe(true);
    expect(projectConfigForEnv.profileName).toBeDefined();
  });
});

function getLocalAwsInfoForEnv(projRoot: string, envName: string) {
  return stateManager.getLocalAWSInfo(projRoot)[envName];
}
